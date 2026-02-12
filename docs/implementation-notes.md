# Implementation Notes

## Overview

This MCP server implements the Model Context Protocol for Google's Gemini API via stdio-based JSON-RPC 2.0 communication. It provides a standardized way for MCP-compatible clients (Claude Desktop, Cursor, Windsurf) to interact with Gemini models.

## Protocol Implementation

### Initialization Flow
```json
// Client sends initialize request (one JSON object per line on stdin)
{"jsonrpc": "2.0", "id": 1, "method": "initialize"}

// Server responds on stdout
{"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": "2024-11-05", "serverInfo": {"name": "mcp-server-gemini-enhanced", "version": "5.0.0"}, "capabilities": {"tools": {}, "resources": {}, "prompts": {}}}}
```

### Tool Call (generate_text with Gemini 3)
```json
// Client sends tool call
{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "generate_text", "arguments": {"prompt": "Hello, world!", "model": "gemini-3-pro-preview", "thinkingLevel": "high"}}}

// Server responds with generated content
{"jsonrpc": "2.0", "id": 2, "result": {"content": [{"type": "text", "text": "..."}], "metadata": {"model": "gemini-3-pro-preview", "tokensUsed": 42}}}
```

## Key Components

1. Stdio Interface
   - Uses Node.js `readline` to read one JSON object per line from stdin
   - Responses written to stdout as newline-delimited JSON
   - All debug/error logging goes to stderr (stdout is the protocol channel)

2. Gemini Integration
   - Uses `@google/genai` SDK (v1.41.0+)
   - Supports Gemini 3 `thinkingConfig` with `thinkingLevel` parameter
   - Supports `mediaResolution` for vision tasks
   - Default model: `gemini-3-pro-preview`

3. Request Routing
   - `handleRequest()` dispatches by MCP method name
   - `handleToolCall()` routes by tool name to handler methods
   - JSON-RPC error codes: `-32601` (method not found), `-32603` (internal error)

## Gemini 3 Specific Details

### Thinking Levels
- `gemini-3-pro-preview`: supports `low` and `high`
- `gemini-3-flash-preview`: supports `minimal`, `low`, `medium`, `high`
- Passed to the API via `generationConfig.thinkingConfig.thinkingLevel`
- Cannot be mixed with the legacy `thinkingBudget` parameter

### Media Resolution
- Controls token allocation for image/video inputs
- Options: `media_resolution_low`, `media_resolution_medium` (default), `media_resolution_high`
- Passed via `generationConfig.mediaResolution` in `analyzeImage()`

### Temperature
- Google recommends `1.0` as default for Gemini 3 (changed from `0.7`)
- Uses nullish coalescing (`??`) to allow explicit `temperature: 0`

## Security Considerations

1. API Key Handling
   - Environment variables only (`GEMINI_API_KEY`)
   - No logging of sensitive data
   - Never written to stdout

2. Input Validation
   - Model name validated against known models
   - Request format validated by JSON-RPC parsing
   - Error boundary handling in all tool methods

## Performance

1. Single Process
   - One Node.js process per MCP client session
   - No external dependencies beyond `@google/genai`
   - In-memory conversation state (Map)

2. Conversation Memory
   - Keyed by `conversationId` string
   - Not persisted across server restarts
   - Accumulates full message history per conversation
