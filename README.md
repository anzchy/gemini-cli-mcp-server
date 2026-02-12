# Gemini MCP Server

![smithery badge](https://smithery.ai/badge/mcp-server-gemini)
![npm version](https://img.shields.io/npm/v/@anzchy/mcp-server-gemini)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![MCP Version](https://img.shields.io/badge/MCP-2024--11--05-green)

A powerful MCP (Model Context Protocol) server that brings Google's latest Gemini AI models to your favorite development environment. Access Gemini 3's state-of-the-art reasoning, configurable thinking depth, vision analysis, embeddings, and more through a seamless integration.

🚀 **Works with**: Claude Desktop, Cursor, Windsurf, and any MCP-compatible client
🎯 **Why use this**: Get Gemini's cutting-edge AI features directly in your IDE with full parameter control
📚 **Self-documenting**: Built-in help system means you never need to leave your editor

## Features

- **6 Powerful Tools**: Text generation, image analysis, token counting, model listing, embeddings, and self-documenting help

- **Latest Gemini 3 Models**: `gemini-3-pro-preview` and `gemini-3-flash-preview` with configurable thinking depth

- **Thinking Level Control**: Adjust reasoning depth per request (minimal/low/medium/high)

- **Media Resolution Control**: Configure token allocation for image/video inputs

- **Advanced Features**: JSON mode, Google Search grounding, system instructions, conversation memory

- **Full MCP Protocol**: Standard stdio communication for seamless integration with any MCP client

- **Self-Documenting**: Built-in help system - no external docs needed

- **TypeScript & ESM**: Modern, type-safe implementation

### Supported Models

| Model                  | Context   | Max Output | Thinking Levels            | Best For                   |
| ---------------------- | --------- | ---------- | -------------------------- | -------------------------- |
| gemini-3-pro-preview ⭐ | 1M tokens | 64K tokens | low, high                  | Complex reasoning, agentic |
| gemini-3-flash-preview | 1M tokens | 64K tokens | minimal, low, medium, high | Fast + smart               |
| gemini-2.5-pro         | 2M tokens | —          | —                          | Legacy complex tasks       |
| gemini-2.5-flash       | 1M tokens | —          | —                          | Legacy general use         |
| gemini-2.5-flash-lite  | 1M tokens | —          | —                          | Legacy cost-efficient      |

## Quick Start

1. **Get Gemini API Key**

   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)

   - Create a new API key

   - **IMPORTANT**: Keep your API key secure and never commit it to version control

2. **Configure Your MCP Client**

   <details open>
   <summary>&lt;b&gt;Claude Desktop&lt;/b&gt;</summary>

   Config location:

   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

   - Linux: `~/.config/Claude/claude_desktop_config.json`

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
   </details>

   <details>
   <summary>&lt;b&gt;Cursor&lt;/b&gt;</summary>

   Add to Cursor's MCP settings:

   ```json
   {
     "gemini": {
       "type": "stdio",
       "command": "npx",
       "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
       "env": {
         "GEMINI_API_KEY": "your_api_key_here"
       }
     }
   }
   ```
   </details>

   <details>
   <summary>&lt;b&gt;Windsurf&lt;/b&gt;</summary>

   Configure in Windsurf's MCP settings following their documentation.
   </details>

   <details>
   <summary>&lt;b&gt;Other MCP Clients&lt;/b&gt;</summary>

   Use the standard MCP stdio configuration:

   ```json
   {
     "type": "stdio",
     "command": "npx",
     "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
     "env": {
       "GEMINI_API_KEY": "your_api_key_here"
     }
   }
   ```
   </details>

3. **Restart Your MCP Client**

## How to Use

Once configured, you can use natural language in your MCP client to access Gemini's capabilities:

### Basic Commands

```
"Use Gemini to explain quantum computing"
"Analyze this image with Gemini" 
"List all Gemini models"
"Get help on using Gemini"
```

### Advanced Examples

```
"Use Gemini 3 Pro with thinkingLevel high to review this code"
"Use Gemini in JSON mode to extract key points with schema {title, summary, tags}"
"Use Gemini with grounding to research the latest in quantum computing"
"Analyze this image with mediaResolution high for maximum detail"
```

📖 **[See the complete Usage Guide](USAGE_GUIDE.md)** for detailed examples and advanced features.

## Why Gemini MCP Server?

- **Access Latest Models**: Use Gemini 3 with configurable thinking depth - Google's most advanced models

- **Full Feature Set**: All Gemini API features including JSON mode, grounding, thinkingLevel, mediaResolution, and system instructions

- **Easy Setup**: One-line npx installation, no complex configuration needed

- **Production Ready**: Comprehensive error handling, TypeScript types, and extensive documentation

- **Active Development**: Regular updates with new Gemini features as they're released

## Documentation

- **[Usage Guide](USAGE_GUIDE.md)** - Complete guide on using all tools and features

- **[Parameters Reference](PARAMETERS_REFERENCE.md)** - Detailed documentation of all parameters

- **[Quick Reference](QUICK_REFERENCE.md)** - Quick commands cheat sheet

- **[Enhanced Features](ENHANCED_FEATURES.md)** - Detailed list of v5.0.0 capabilities

- [Claude Desktop Setup Guide](docs/claude-desktop-setup.md) - Detailed setup instructions

- [Examples and Usage](docs/examples.md) - Usage examples and advanced configuration

- [Implementation Notes](docs/implementation-notes.md) - Technical implementation details

- [Development Guide](docs/development-guide.md) - Guide for developers

- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions

## Local Development

```bash
# Clone repository
git clone https://github.com/anzchy/gemini-cli-mcp-server.git
cd mcp-server-gemini

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start development server
npm run dev
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

## Common Issues

1. **Connection Issues**

   - Ensure your MCP client is properly restarted

   - Check the client's logs (e.g., `~/Library/Logs/Claude/mcp-server-gemini.log` for Claude Desktop on Mac)

   - Verify internet connection

   - See [Troubleshooting Guide](docs/troubleshooting.md)

2. **API Key Problems**

   - Verify API key is correct

   - Check API key has proper permissions

   - Ensure the key is set in the environment variable

   - See [Setup Guide](docs/claude-desktop-setup.md)

3. **Stale Version / Not Picking Up Updates**

   When using `npx -y github:anzchy/gemini-cli-mcp-server`, npx caches the package locally. If you're not seeing new features or bug fixes after an update, clear the cache:

   ```bash
   # Clear the npx cache (installs a small helper, then wipes the cache)
   npx clear-npx-cache

   # Also clear the npm cache for good measure
   npm cache clean --force
   ```

   After clearing, restart your MCP client. The next invocation will pull the latest version from GitHub.

   **Tip:** If you want to skip caching entirely during development, point your MCP client to the local build instead:
   ```json
   {
     "command": "node",
     "args": ["--use-env-proxy", "/path/to/dist/enhanced-stdio-server.js"]
   }
   ```

## Security

- API keys are handled via environment variables only

- Never commit API keys to version control

- The `.claude/` directory is excluded from git

- No sensitive data is logged or stored

- Regular security updates

- If your API key is exposed, regenerate it immediately in Google Cloud Console

## License

MIT
