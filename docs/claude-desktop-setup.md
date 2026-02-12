# Claude Desktop MCP Configuration Guide

## Overview

This guide explains how to configure Claude Desktop to use the Gemini MCP server. The Model Context Protocol (MCP) allows Claude to interact with external AI models and tools.

## Configuration Steps

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create or sign in to your Google account
3. Generate a new API key
4. Copy the API key for later use

### 2. Locate Configuration File

The configuration file location depends on your operating system:

- **macOS**:
  ```
  ~/Library/Application Support/Claude/claude_desktop_config.json
  ```

- **Windows**:
  ```
  %APPDATA%\Claude\claude_desktop_config.json
  ```

- **Linux**:
  ```
  ~/.config/Claude/claude_desktop_config.json
  ```

### 3. Edit Configuration

1. Open the configuration file in a text editor
2. Add or update the mcpServers section:

```json
{
  "mcpServers": {
    "gemini": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 4. Verify Setup

1. Save the configuration file
2. Restart Claude Desktop completely
3. Test the connection by asking Claude:
   "Can you list the available Gemini models?"

## Advanced Configuration

### Local Development Build
```json
{
  "mcpServers": {
    "gemini": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-server-gemini/dist/enhanced-stdio-server.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Configuration File Not Found**
   - Run Claude Desktop at least once
   - Create the directory if it doesn't exist
   - Create an empty JSON file if needed

2. **Connection Errors**
   - The server uses stdio — no port or network configuration needed
   - Verify your internet connection (needed for Gemini API calls)
   - Check Claude Desktop logs for error details

3. **API Key Issues**
   - Verify the key is correct
   - Ensure no whitespace in the key
   - Check API key permissions in Google AI Studio

### Error Messages

1. **"Cannot connect to MCP server"**
   - Check if npx can resolve the package
   - Verify Node.js is installed and in PATH
   - Check Claude Desktop logs: `~/Library/Logs/Claude/` (macOS)

2. **"Invalid API key"**
   - Verify API key in config
   - Regenerate API key if needed
   - Check for copying errors

## Security Notes

1. **API Key Storage**
   - Keep your API key secure
   - Don't share the configuration file
   - Regularly rotate API keys

2. **File Permissions**
   - Set appropriate file permissions
   - Restrict access to config file
   - Use environment variables when possible

## Additional Resources

1. [Gemini API Documentation](https://ai.google.dev/docs)
2. [Claude Desktop Documentation](https://www.anthropic.com/claude)
3. [MCP Protocol Specification](https://modelcontextprotocol.io)
