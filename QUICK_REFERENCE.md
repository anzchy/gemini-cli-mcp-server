# Gemini MCP Server - Quick Reference

## Quick Commands

### Text Generation
```
"Use Gemini to [your prompt]"
"Ask Gemini 3 Pro to [complex task]"
"Use Gemini with temperature 1.5 for [creative task]"
"Use Gemini 3 Pro with thinkingLevel high to [reasoning task]"
```

### Image Analysis
```
"Analyze this image with Gemini: [image]"
"What's in this screenshot?"
"Describe this diagram using Gemini with mediaResolution high"
```

### Token Counting
```
"Count tokens for: [text]"
"How many tokens in this prompt?"
```

### Model Info
```
"List all Gemini models"
"Show thinking models"
"Which models support grounding?"
```

### Embeddings
```
"Generate embeddings for: [text]"
"Create semantic vectors for search"
```

## Model Selection

| Task | Recommended Model | Why |
|------|------------------|-----|
| Complex reasoning | gemini-3-pro-preview | State-of-the-art thinking, agentic |
| General use | gemini-3-flash-preview | Best speed/intelligence balance |
| Fast responses | gemini-3-flash-preview (thinkingLevel: minimal) | Minimal reasoning overhead |
| Deep analysis | gemini-3-pro-preview (thinkingLevel: high) | Maximum reasoning depth |
| Cost-sensitive | gemini-2.5-flash-lite | Legacy, ultra-fast |

## Thinking Levels (Gemini 3)

| Level | Speed | Quality | Available On |
|-------|-------|---------|-------------|
| `minimal` | Fastest | Basic | Flash only |
| `low` | Fast | Light reasoning | Pro, Flash |
| `medium` | Moderate | Balanced | Flash only |
| `high` | Slowest | Deep reasoning | Pro, Flash |

## Advanced Features

### JSON Output
```
"Use Gemini in JSON mode to analyze sentiment and return {sentiment, confidence, keywords}"
```

### Google Search Grounding
```
"Use Gemini with grounding to research [current topic]"
```

### System Instructions
```
"Use Gemini as a Python tutor to explain [concept]"
```

### Conversation Memory
```
"Start conversation 'chat-001' with Gemini about [topic]"
"Continue chat-001 and ask about [related topic]"
```

### Media Resolution (Image Analysis)
```
"Analyze this diagram with mediaResolution high for maximum detail"
"Quick classify this image with mediaResolution low"
```

## Temperature Guide

- **0.1-0.3**: Precise, factual (documentation, analysis)
- **0.7-1.0**: Balanced (default: 1.0 for Gemini 3)
- **1.0-1.5**: Creative (stories, brainstorming)
- **1.5-2.0**: Very creative (poetry, fiction)

## Pro Tips

1. **Use thinkingLevel** to control reasoning depth per request
2. **Specify models** for better control
3. **Use grounding** for current information
4. **Enable JSON mode** for structured data
5. **Set temperature** based on task type
6. **Use conversation IDs** for context
7. **Count tokens** before long operations
8. **Use mediaResolution high** for detailed image analysis

## Troubleshooting

- **Tools not showing?** Restart your MCP client
- **Errors?** Check logs at `~/Library/Logs/Claude/` (macOS)
- **API issues?** Verify your API key
- **Need help?** See [Usage Guide](USAGE_GUIDE.md)
