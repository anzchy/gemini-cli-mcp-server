# Gemini MCP Server Usage Guide

This guide explains how to use all the available tools in the Gemini MCP Server through Claude Desktop.

## Available Tools Overview

Once the Gemini MCP Server is configured in Claude Desktop, you can access these 6 powerful tools:

1. **generate_text** - Advanced text generation with all Gemini features
2. **analyze_image** - Vision analysis for images
3. **count_tokens** - Token counting for cost estimation
4. **list_models** - List available Gemini models
5. **embed_text** - Generate text embeddings
6. **get_help** - Get help and usage information directly in Claude

📋 **[See Complete Parameters Reference](PARAMETERS_REFERENCE.md)** for detailed parameter documentation with all available options and examples.

## How to Use Tools in Claude Desktop

When the MCP server is properly configured, you can simply ask Claude to use these tools naturally in conversation. Here are examples:

### 1. Text Generation Tool (`generate_text`)

**Basic Usage:**
```
"Use Gemini to explain quantum computing"
"Ask Gemini 3 Pro to write a Python function for sorting"
"Have Gemini generate a creative story about space exploration"
```

**Advanced Usage with Parameters:**
```
"Use Gemini 3 Pro with high temperature (1.5) to write a creative poem"
"Ask Gemini to explain machine learning in JSON format with key concepts"
"Use Gemini with Google Search grounding to tell me about today's news"
```

**Example with All Features:**
```
"Use Gemini 3 Pro to analyze this code and return a JSON response with:
- code_quality (1-10 scale)
- issues (array of problems)
- suggestions (array of improvements)
Enable grounding for latest best practices."
```

### 2. Image Analysis Tool (`analyze_image`)

**Usage:**
```
"Use Gemini to analyze this image: [paste image or provide URL]"
"What's in this screenshot? [attach image]"
"Describe the architecture diagram in this image using Gemini"
```

**Note:** You can either:
- Paste an image directly into Claude
- Provide an image URL
- Attach an image file

### 3. Token Counting Tool (`count_tokens`)

**Usage:**
```
"Count tokens for this text using Gemini: [your text]"
"How many tokens would this prompt use with gemini-3-pro-preview?"
"Check token count for my document with Gemini 3 Pro"
```

### 4. Model Listing Tool (`list_models`)

**Usage:**
```
"List all available Gemini models"
"Show me Gemini models that support thinking"
"Which Gemini models have grounding capability?"
"List models with JSON mode support"
```

**Filter Options:**
- `all` - Show all models
- `thinking` - Models with thinking capabilities
- `vision` - Vision-capable models
- `grounding` - Models with Google Search grounding
- `json_mode` - Models supporting JSON output

### 5. Text Embedding Tool (`embed_text`)

**Usage:**
```
"Generate embeddings for this text: [your text]"
"Create semantic embeddings using Gemini for similarity search"
"Get embeddings for these product descriptions using gemini-embedding-001"
```

### 6. Help Tool (`get_help`)

**Usage:**
```
"Get help on using Gemini MCP server"
"Get help on tools"
"Get help on models"
"Get help on parameters"
"Get help on examples"
"Show me a quick start guide"
```

**Available Topics:**
- `overview` - General introduction and features
- `tools` - Detailed information about each tool
- `models` - Available models and selection guide
- `parameters` - Complete parameter reference
- `examples` - Usage examples for common tasks
- `quick-start` - Quick start guide

This tool is perfect for learning how to use the MCP server without leaving Claude Desktop!

## Advanced Features

### System Instructions
You can guide the model's behavior:
```
"Use Gemini with system instruction 'You are a helpful Python tutor' to explain decorators"
```

### JSON Mode with Schema
Get structured output:
```
"Use Gemini in JSON mode to analyze this text and return:
{
  sentiment: 'positive' | 'negative' | 'neutral',
  confidence: number (0-1),
  key_phrases: string[]
}"
```

### Conversation Memory
Maintain context across multiple requests:
```
"Start a conversation with Gemini about machine learning (use conversation ID: ml-chat-001)"
"Continue the ml-chat-001 conversation and ask about neural networks"
```

### Thinking Level Control (Gemini 3)
Control reasoning depth per request:
- `minimal`: Fastest, minimal reasoning (Flash only)
- `low`: Light reasoning
- `medium`: Moderate reasoning (Flash only)
- `high`: Deep reasoning (default for thinking models)

```
"Use Gemini 3 Pro with thinkingLevel high to solve this complex problem"
"Use Gemini 3 Flash with thinkingLevel minimal for a quick answer"
```

### Media Resolution (Image Analysis)
Control token allocation for images:
```
"Analyze this diagram with mediaResolution high for maximum detail"
```

### Temperature Control
Adjust creativity:
- Low (0.1-0.3): Focused, deterministic responses
- Medium (0.7-1.0): Balanced responses (default: 1.0 for Gemini 3)
- High (1.0-2.0): Creative, diverse responses

```
"Use Gemini with temperature 0.2 for precise technical documentation"
"Use Gemini with temperature 1.5 for creative writing"
```

### Safety Settings
Configure content filtering:
```
"Use Gemini with relaxed safety settings for medical content analysis"
```

## Model Selection Guide

### For Complex Reasoning & Coding
- **gemini-3-pro-preview** (recommended) - State-of-the-art reasoning, agentic, multimodal
- **gemini-2.5-pro** - Previous generation, 2M context window

### For Fast Responses
- **gemini-3-flash-preview** - Best balance of speed and intelligence, 4 thinking levels
- **gemini-2.5-flash** - Previous generation fast model

### For Cost Efficiency
- **gemini-2.5-flash-lite** - Ultra-fast, cost-efficient

## Tips for Best Results

1. **Be Specific**: Instead of "use Gemini", specify the model and parameters you need
2. **Use Thinking Levels**: For complex problems, use `thinkingLevel: high` with Gemini 3 models
3. **Enable Grounding**: For current information, ask to "enable grounding" or "use Google Search"
4. **Structure Output**: Use JSON mode for structured data extraction
5. **Monitor Tokens**: Use count_tokens before expensive operations

## Example Conversations

### Code Review
```
You: "Use Gemini 3 Pro with thinkingLevel high to review this code for security issues, performance problems, and suggest improvements"
```

### Research with Grounding
```
You: "Use Gemini with grounding enabled to research the latest developments in quantum computing"
```

### Creative Writing
```
You: "Use Gemini 3 Flash with temperature 1.2 to write a short sci-fi story about AI consciousness"
```

### Multi-turn Conversation
```
You: "Start a conversation with Gemini about web development (ID: webdev-001)"
You: "Continue webdev-001 and ask about React best practices"
You: "Continue webdev-001 and ask about state management options"
```

## Troubleshooting

If tools aren't working:
1. Check MCP server status in Claude Desktop
2. Verify your API key is set correctly
3. Look for errors in the logs
4. Restart Claude Desktop
5. Ensure you're using the latest version (v5.0.0)

## Rate Limits

Be aware of Google's API rate limits:
- Requests per minute vary by model
- Token limits differ between models
- Monitor usage to avoid hitting limits

For detailed API limits, check [Google AI Studio](https://makersuite.google.com/app/apikey).