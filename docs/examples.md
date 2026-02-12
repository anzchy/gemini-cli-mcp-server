# Examples and Usage Instructions

## MCP Client Setup

### Claude Desktop

1. **Locate the Configuration File**
   ```
   Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
   Windows: %APPDATA%\Claude\claude_desktop_config.json
   Linux: ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add Gemini MCP Configuration**
   ```json
   {
     "mcpServers": {
       "gemini": {
         "type": "stdio",
         "command": "npx",
         "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
         "env": {
           "GEMINI_API_KEY": "your_api_key_here",
           "GEMINI_DEFAULT_MODEL": "gemini-3-pro-preview"
         }
       }
     }
   }
   ```

   > **Tip:** `GEMINI_DEFAULT_MODEL` is optional. When set, it overrides the default model used by `generate_text`, `analyze_image`, and `count_tokens` when no explicit `model` argument is provided. Must be a known model name (see Supported Models). If omitted or invalid, falls back to `gemini-3-pro-preview`.

3. **Restart Claude Desktop**
   - Close Claude Desktop completely
   - Relaunch the application
   - The Gemini tools should now be available

### Cursor

```json
{
  "gemini": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
    "env": {
      "GEMINI_API_KEY": "your_api_key_here",
      "GEMINI_DEFAULT_MODEL": "gemini-3-pro-preview"
    }
  }
}
```

### Claude Code

**Option A: CLI command (recommended)**
```bash
claude mcp add --transport stdio \
  --env GEMINI_API_KEY=your_api_key_here \
  --env GEMINI_DEFAULT_MODEL=gemini-3-pro-preview \
  gemini -- npx -y github:anzchy/gemini-cli-mcp-server
```

**Option B: JSON config via CLI**
```bash
claude mcp add-json gemini '{"type":"stdio","command":"npx","args":["-y","github:anzchy/gemini-cli-mcp-server"],"env":{"GEMINI_API_KEY":"your_api_key_here","GEMINI_DEFAULT_MODEL":"gemini-3-pro-preview"}}'
```

**Option C: Edit `~/.claude.json` directly**
```json
{
  "mcpServers": {
    "gemini": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "GEMINI_DEFAULT_MODEL": "gemini-3-pro-preview"
      }
    }
  }
}
```

Use `--scope user` to make the server available across all projects, or `--scope project` to share via `.mcp.json`.

### Codex CLI

**Option A: CLI command**
```bash
codex mcp add gemini \
  --env GEMINI_API_KEY=your_api_key_here \
  --env GEMINI_DEFAULT_MODEL=gemini-3-pro-preview \
  -- npx -y github:anzchy/gemini-cli-mcp-server
```

**Option B: Edit `~/.codex/config.toml` directly**
```toml
[mcp_servers.gemini]
command = "npx"
args = ["-y", "github:anzchy/gemini-cli-mcp-server"]

[mcp_servers.gemini.env]
GEMINI_API_KEY = "your_api_key_here"
GEMINI_DEFAULT_MODEL = "gemini-3-pro-preview"
```

Project-scoped config can be placed in `.codex/config.toml` (trusted projects only).

### Gemini CLI

**Option A: CLI command**
```bash
gemini mcp add \
  -e GEMINI_API_KEY=your_api_key_here \
  -e GEMINI_DEFAULT_MODEL=gemini-3-pro-preview \
  gemini npx -y github:anzchy/gemini-cli-mcp-server
```

**Option B: Edit `~/.gemini/settings.json` directly**
```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "GEMINI_DEFAULT_MODEL": "gemini-3-pro-preview"
      }
    }
  }
}
```

Project-scoped config can be placed in `.gemini/settings.json` in your project directory. Use `--scope user` for global config.

### Other MCP Clients

Use the standard MCP stdio configuration:
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
  "env": {
    "GEMINI_API_KEY": "your_api_key_here",
    "GEMINI_DEFAULT_MODEL": "gemini-3-pro-preview"
  }
}
```

## Example Interactions

### Basic Text Generation
```
"Use Gemini to explain quantum computing in simple terms"
"Use Gemini 3 Pro to write a Python sorting function"
```

### With Thinking Level Control (Gemini 3)
```
"Use Gemini 3 Pro with thinkingLevel high to solve this math proof"
"Use Gemini 3 Flash with thinkingLevel minimal for a quick answer"
```

### With Temperature Control
```
"Use Gemini with temperature 0.1 for precise factual analysis"
"Use Gemini with temperature 1.5 for creative writing"
```

### JSON Mode
```
"Use Gemini in JSON mode to analyze sentiment and return {sentiment, confidence, keywords}"
```

### JSON-RPC Tool Call Examples

#### generate_text with thinkingLevel
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_text",
    "arguments": {
      "prompt": "Explain the P vs NP problem",
      "model": "gemini-3-pro-preview",
      "temperature": 1.0,
      "thinkingLevel": "high",
      "maxTokens": 4096
    }
  }
}
```

#### generate_text with JSON mode and grounding
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "generate_text",
    "arguments": {
      "prompt": "What are the latest AI developments?",
      "model": "gemini-3-pro-preview",
      "jsonMode": true,
      "jsonSchema": {
        "type": "object",
        "properties": {
          "developments": {
            "type": "array",
            "items": { "type": "string" }
          },
          "summary": { "type": "string" }
        }
      },
      "grounding": true
    }
  }
}
```

#### analyze_image with mediaResolution
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "analyze_image",
    "arguments": {
      "prompt": "Describe every detail in this architecture diagram",
      "imageUrl": "https://example.com/diagram.png",
      "model": "gemini-3-pro-preview",
      "mediaResolution": "media_resolution_high"
    }
  }
}
```

#### count_tokens
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "count_tokens",
    "arguments": {
      "text": "Your text to count tokens for",
      "model": "gemini-3-pro-preview"
    }
  }
}
```

#### embed_text
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "embed_text",
    "arguments": {
      "text": "Machine learning is fascinating",
      "model": "gemini-embedding-001"
    }
  }
}
```

## Troubleshooting Common Setup Issues

1. **Config File Not Found**
   - Make sure your MCP client has been run at least once
   - Check the path for your operating system
   - Create the file if it doesn't exist

2. **API Key Issues**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Ensure the key has proper permissions
   - Check for any whitespace in the key

3. **Connection Issues**
   - This server uses stdio (not WebSocket) — no port configuration needed
   - Verify internet connection for API calls
   - Check your MCP client's logs for error details

4. **Stale Version / Not Picking Up Updates**

   `npx` caches packages locally. After the server is updated on GitHub or npm, your local `npx` may still run the old cached version. To force a fresh download:

   ```bash
   # Clear the npx cache
   npx clear-npx-cache

   # Clear the npm cache
   npm cache clean --force
   ```

   Then restart your MCP client (Claude Desktop, Cursor, Claude Code, etc.). The next `npx -y github:anzchy/gemini-cli-mcp-server` invocation will pull the latest code.

   **Symptoms of a stale cache:**
   - New environment variables (e.g. `GEMINI_DEFAULT_MODEL`) have no effect
   - New tools or parameters are missing from `tools/list`
   - Bug fixes aren't applied despite being merged upstream

   **Alternative — bypass npx caching entirely** by pointing to a local build:
   ```json
   {
     "command": "node",
     "args": ["--use-env-proxy", "/path/to/mcp-server-gemini/dist/enhanced-stdio-server.js"],
     "env": {
       "GEMINI_API_KEY": "your_api_key_here"
     }
   }
   ```

## Best Practices

1. **API Key Security**
   - Never share your API key
   - Use environment variables
   - Rotate keys periodically

2. **Model Selection**
   - Use `gemini-3-pro-preview` for complex reasoning (default)
   - Use `gemini-3-flash-preview` for fast responses with thinking control
   - Use `gemini-2.5-flash` for legacy compatibility

3. **Thinking Level**
   - Use `high` for complex problems requiring deep reasoning
   - Use `low` for simpler tasks where some reasoning helps
   - Use `minimal` (Flash only) for fastest responses

## Development Setup

For local development, point your MCP client to the local build:
```json
{
  "mcpServers": {
    "gemini": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-server-gemini/dist/enhanced-stdio-server.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "GEMINI_DEFAULT_MODEL": "gemini-3-flash-preview"
      }
    }
  }
}
```

## Using with Other MCP Servers

### Multiple Providers Example
```json
{
  "mcpServers": {
    "gemini": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_key",
        "GEMINI_DEFAULT_MODEL": "gemini-3-pro-preview"
      }
    },
    "openai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@mzxrai/mcp-openai@latest"],
      "env": {
        "OPENAI_API_KEY": "your_openai_key"
      }
    }
  }
}
```

## Verification

Test the MCP integration by asking your client:
```
"List all Gemini models"
"Get help on using Gemini"
"Use Gemini to say hello"
```
