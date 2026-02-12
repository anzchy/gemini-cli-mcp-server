# Troubleshooting Guide

## Common Issues

### Connection Problems

1. Server Not Starting
```
Error: GEMINI_API_KEY environment variable is required
```
Solution:
- Ensure `GEMINI_API_KEY` is set in your MCP client config's `env` section
- Verify the API key is valid

2. MCP Client Can't Find Server
```
Error: Cannot connect to MCP server
```
Solution:
- Verify Node.js is installed and in PATH
- Check that `npx` can resolve the package
- Restart your MCP client completely

### API Issues

1. Invalid API Key
```
Error: Invalid API key provided
```
Solution:
- Check GEMINI_API_KEY in your MCP client config
- Verify API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Regenerate API key if needed

2. Rate Limiting
```
Error: Resource exhausted
```
Solution:
- Reduce request frequency
- Check quota limits in Google Cloud Console
- Upgrade API tier if needed

3. Model Not Found
```
Error: Unknown model: gemini-xyz
```
Solution:
- Use `list_models` tool to see available models
- Default model is `gemini-3-pro-preview`
- Legacy models: `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`

4. Fetch Failed / Network Timeout
```
Error: fetch failed
```
Solution:
- Check internet connectivity
- If behind a proxy, ensure Node.js can reach Google APIs
- On Node.js 24+, use `--use-env-proxy` flag if `http_proxy`/`https_proxy` is set

## Protocol Errors

1. Invalid Message Format
```json
Error: Parse error (-32700)
```
Solution:
- Each message must be a complete JSON object on a single line
- Verify JSON syntax

2. Method Not Found
```json
Error: Method not found (-32601)
```
Solution:
- Supported methods: `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`
- Check spelling

## Debugging Steps

1. Test the server directly via stdin/stdout:
```bash
echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{}}' | \
  GEMINI_API_KEY=your_key node dist/enhanced-stdio-server.js 2>/dev/null
```

2. Check stderr for debug output:
```bash
echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{}}' | \
  GEMINI_API_KEY=your_key node dist/enhanced-stdio-server.js 2>&1 1>/dev/null
```

3. Check MCP client logs:
   - Claude Desktop (macOS): `~/Library/Logs/Claude/`
   - Cursor: Check developer console

## Getting Help

1. Check Documentation
   - Review [examples](examples.md)
   - Check [implementation notes](implementation-notes.md)

2. Open Issues
   - Search existing issues at https://github.com/aliargun/mcp-server-gemini/issues
   - Provide error details and reproduction steps

3. Verify Your Setup
   - Ask your MCP client: "List all Gemini models"
   - If this works, the connection is healthy
