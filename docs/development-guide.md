# Development Guide

## Environment Setup

1. Prerequisites
   - Node.js 16+
   - npm
   - TypeScript
   - Gemini API key

2. Installation
```bash
git clone https://github.com/anzchy/gemini-cli-mcp-server.git
cd mcp-server-gemini
npm install
```

3. Configuration
```bash
# Set your Gemini API key
export GEMINI_API_KEY=your_api_key_here
```

## Development Workflow

1. Start Development Server
```bash
npm run dev
```

2. Build for Production
```bash
npm run build
```

3. Run Tests
```bash
npm test
```

## Project Structure

```
src/
├── enhanced-stdio-server.ts   # Main server (single-class monolith)
├── types.ts                   # TypeScript type definitions
tests/
├── enhanced-stdio-server.test.ts  # Comprehensive test suite
docs/                          # Documentation
```

The entire server lives in `src/enhanced-stdio-server.ts` as a single class (`EnhancedStdioMCPServer`). This is intentional for simple deployment via npx.

## Architecture

```
MCP Client (stdin) → JSON-RPC line-delimited → EnhancedStdioMCPServer → @google/genai SDK → Gemini API
                     (stdout) ← JSON-RPC response ←
```

- **Stdio interface**: Reads JSON objects from stdin, writes responses to stdout
- **All logging goes to stderr** — stdout is reserved for the MCP protocol
- **Request routing**: `handleRequest()` dispatches by MCP method name
- **Tool dispatch**: `handleToolCall()` routes to handler methods

## Adding Features

1. Add a new tool in `getAvailableTools()`:
```typescript
{
  name: 'my_new_tool',
  description: 'Description of the tool',
  inputSchema: {
    type: 'object',
    properties: { /* ... */ },
    required: ['param1']
  }
}
```

2. Add the handler method and wire it in `handleToolCall()`:
```typescript
case 'my_new_tool':
  return await this.myNewTool(request.id, args);
```

## Testing

The test suite spawns the server as a child process and communicates via stdin/stdout using real JSON-RPC, exactly like an MCP client.

1. Protocol Tests (no API calls)
```typescript
describe('tools/list', () => {
  it('should return all 6 tools', async () => {
    const res = await sendRequest(server, { /* ... */ });
    expect(res.result.tools).toHaveLength(6);
  });
});
```

2. Integration Tests (real Gemini API calls)
```typescript
describe('generate_text', () => {
  it('should work with thinkingLevel=high', async () => {
    const res = await sendRequest(server, {
      jsonrpc: '2.0', id: 1,
      method: 'tools/call',
      params: { name: 'generate_text', arguments: { prompt: '...', thinkingLevel: 'high' } }
    });
  });
});
```

## Debugging

1. Run the server manually and send JSON-RPC messages via stdin:
```bash
echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{}}' | \
  GEMINI_API_KEY=your_key node dist/enhanced-stdio-server.js
```

2. Check stderr for debug output — the server logs request handling to stderr.

## Best Practices

1. Code Style
   - TypeScript strict mode, ESM imports
   - Follow existing patterns in the monolithic server file
   - JSDoc comments for public APIs

2. Error Handling
   - Use JSON-RPC error codes: `-32601` (method not found), `-32603` (internal error)
   - Never write non-JSON to stdout
   - Log errors to stderr

3. Testing
   - Run `npm run build && npm test` before submitting changes
   - Add both protocol-level and integration tests for new features
