# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP server that exposes Google Gemini API capabilities (text generation, vision analysis, embeddings, token counting) to MCP-compatible clients (Claude Desktop, Cursor, Windsurf) via the stdio JSON-RPC 2.0 protocol. Default model: `gemini-3-pro-preview`.

## Commands

```bash
npm install            # Install dependencies
npm run build          # Compile TypeScript → dist/
npm run start          # Run compiled server
npm run dev            # Run with ts-node (development)
npm test               # Run Jest tests
npm run test:watch     # Tests in watch mode
npm run lint           # ESLint on src/**/*.ts
npm run format         # Prettier on src/**/*.ts
```

The `GEMINI_API_KEY` environment variable is required at runtime.

## Architecture

**Single-class design.** The entire server lives in `src/enhanced-stdio-server.ts` (~1300 lines). This is intentional for simple deployment via npx.

```
MCP Client (stdin) → JSON-RPC line-delimited → EnhancedStdioMCPServer → @google/genai SDK → Gemini API
                     (stdout) ← JSON-RPC response ←
```

### EnhancedStdioMCPServer class

- **Stdio interface**: Uses Node.js `readline` to read one JSON object per line from stdin. Responses written to stdout. All debug/error logging goes to **stderr** (critical — stdout is the protocol channel).
- **Request routing**: `handleRequest()` uses a switch on the MCP method name (`initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`).
- **Tool dispatch**: `handleToolCall()` routes by tool name to handler methods: `generateText()`, `analyzeImage()`, `countTokens()`, `listModels()`, `embedText()`, `getHelp()`.
- **Conversation state**: In-memory `Map<string, any[]>` keyed by conversation ID. Not persisted across restarts.

### Types

`src/types.ts` defines MCP protocol interfaces (MCPRequest, MCPResponse, ConnectionState, etc.) and Gemini-specific request/response types.

### Tools exposed (6)

| Tool | Handler method | Purpose |
|------|---------------|---------|
| `generate_text` | `generateText()` | Text generation with temperature, JSON mode, grounding, safety settings, conversation context, thinkingLevel |
| `analyze_image` | `analyzeImage()` | Vision analysis via URL or base64 input, mediaResolution control |
| `count_tokens` | `countTokens()` | Token counting for cost estimation |
| `list_models` | `listModels()` | List available Gemini models with optional filtering |
| `embed_text` | `embedText()` | Text embeddings (gemini-embedding-001) |
| `get_help` | `getHelp()` | Self-documenting help system |

### Resources (gemini:// URIs)

`gemini://models`, `gemini://capabilities`, `gemini://help/usage`, `gemini://help/parameters`, `gemini://help/examples`

## Tech Stack

- **TypeScript 5.3** with strict mode, ESM modules (`"type": "module"`)
- **Target**: ES2022, module resolution: NodeNext
- **Runtime**: Node.js ≥16
- **Single production dependency**: `@google/genai` (Google Gemini SDK)
- **Testing**: Jest + ts-jest (test roots in `src/`, setup file at `src/__tests__/setup.ts`)

## Protocol Constraints

- Every line on stdout must be valid JSON-RPC 2.0. Never `console.log()` to stdout — use `process.stderr.write()` for debug output.
- JSON-RPC error codes: `-32601` (method not found), `-32603` (internal error).
- MCP protocol version: `2024-11-05`.
- Max buffer increased to 10MB for large base64 image payloads.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_DEFAULT_MODEL` | No | Override the default model (must be a key in `GEMINI_MODELS`). Falls back to `gemini-3-pro-preview` with a stderr warning if the value is not a known model. |

## Code Style

- TypeScript strict mode, async/await, ESM imports
- JSDoc comments for public APIs
- Follow existing patterns in the monolithic server file
- Run `npm run lint && npm test` before submitting changes

## Pre-Commit Documentation Check

Before every git commit, scan these files for accuracy and update them if the change affects user-facing behavior (new env vars, new tools, changed defaults, new parameters, model changes, config format changes):

- **Root-level**: `README.md`, `CLAUDE.md`
- **docs/**: `docs/examples.md`, `docs/PARAMETERS_REFERENCE.md`, `docs/claude-desktop-setup.md`, `docs/troubleshooting.md`, `docs/development-guide.md`, `docs/implementation-notes.md`

Ask: "Does this change affect any documented defaults, config examples, parameter tables, or setup instructions?" If yes, update the relevant docs in the same commit.

## MCP Tool Call Convention

When calling Gemini MCP tools (e.g. `generate_text`, `analyze_image`, `count_tokens`), **always explicitly include the `model` parameter** in the tool call so the user can see which model is being used in the tool invocation context. Example of what the user sees:

```
⏺ gemini - generate_text (MCP)(prompt: "Explain quantum computing", model: "gemini-2.5-flash", temperature: 0.3, maxTokens: 4096)
```

This transparency helps users understand cost/performance tradeoffs and troubleshoot model-specific behavior. Even when using the default model, include it explicitly.
