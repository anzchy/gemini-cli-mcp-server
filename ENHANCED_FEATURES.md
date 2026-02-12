# Enhanced Gemini MCP Server Features (v5.0.0)

This enhanced version of the Gemini MCP server includes all the latest features from Google's Gemini API, including Gemini 3 series support.

## Available Models

### Gemini 3 Series (Latest - State-of-the-Art)
- **gemini-3-pro-preview** - Most capable reasoning model with 1M context, 64K output, agentic capabilities (thinkingLevels: low, high)
- **gemini-3-flash-preview** - Best balance of speed and intelligence with 1M context, 64K output (thinkingLevels: minimal, low, medium, high)

### Legacy 2.5 Series
- **gemini-2.5-pro** - Previous generation pro model (2M context)
- **gemini-2.5-flash** - Previous generation fast model (1M context)
- **gemini-2.5-flash-lite** - Ultra-fast, cost-efficient thinking model

### Embedding Model
- **gemini-embedding-001** - Text embeddings for semantic search and similarity

## Available Tools

### 1. `generate_text` - Advanced Text Generation
Generate text with all the latest Gemini features:
- **Model Selection**: Choose any available Gemini model
- **Thinking Level Control**: Control reasoning depth with `thinkingLevel` (minimal/low/medium/high) for Gemini 3 models
- **System Instructions**: Guide model behavior with system prompts
- **Temperature Control**: Fine-tune creativity (0-2, default: 1.0 for Gemini 3)
- **Advanced Sampling**: Control with topK and topP parameters
- **JSON Mode**: Get structured JSON output with optional schema validation
- **Google Search Grounding**: Get up-to-date information from the web
- **Safety Settings**: Configure content filtering per category
- **Conversation Memory**: Maintain context across multiple turns

### 2. `analyze_image` - Vision Analysis
Analyze images using Gemini's vision capabilities:
- Support for image URLs or base64-encoded images
- **Media Resolution Control**: Control token allocation with `mediaResolution` (low/medium/high)
- Compatible with all vision-capable models
- Natural language understanding of visual content

### 3. `count_tokens` - Token Counting
Count tokens for any text with a specific model:
- Accurate token counting for cost estimation
- Model-specific tokenization

### 4. `list_models` - Model Discovery
List all available models with filtering:
- Filter by capabilities (thinking, vision, grounding, json_mode)
- View model descriptions and context windows
- Check feature availability

### 5. `embed_text` - Text Embeddings
Generate embeddings for semantic search and similarity:
- Latest embedding model (gemini-embedding-001)
- High-dimensional vectors for accuracy

## Available Resources

- **gemini://models** - Detailed list of all available models
- **gemini://capabilities** - Comprehensive API capabilities documentation
- **gemini://help/usage** - Usage guide
- **gemini://help/parameters** - Parameter reference
- **gemini://help/examples** - Usage examples

## Available Prompts

### 1. `code_review` - Comprehensive Code Review
Use Gemini 3 Pro's thinking capabilities for in-depth code analysis

### 2. `explain_with_thinking` - Deep Explanations
Leverage Gemini 3 thinking models for thorough explanations of complex topics

### 3. `creative_writing` - Creative Content Generation
Generate creative content with style and length control

## Advanced Features

### Thinking Level Control (Gemini 3)
The `thinkingLevel` parameter allows you to control how deeply the model reasons about a problem:
- **minimal**: Fastest response, minimal reasoning (Flash only)
- **low**: Light reasoning for straightforward tasks
- **medium**: Balanced reasoning depth (Flash only)
- **high**: Deep reasoning for complex problems (recommended for coding, math, analysis)

```json
{
  "tool": "generate_text",
  "arguments": {
    "prompt": "Solve this optimization problem...",
    "model": "gemini-3-pro-preview",
    "thinkingLevel": "high"
  }
}
```

### Media Resolution Control
The `mediaResolution` parameter controls token allocation for image/video inputs in `analyze_image`:
- **media_resolution_low**: Quick classification, simple descriptions
- **media_resolution_medium**: General image analysis (default)
- **media_resolution_high**: Detailed diagrams, fine text, complex scenes

```json
{
  "tool": "analyze_image",
  "arguments": {
    "prompt": "Describe every detail in this architecture diagram",
    "imageUrl": "https://example.com/diagram.png",
    "model": "gemini-3-pro-preview",
    "mediaResolution": "media_resolution_high"
  }
}
```

### JSON Mode with Schema Validation
When `jsonMode` is enabled, you can provide a JSON schema to ensure the output matches your exact requirements.

### Google Search Grounding
Enable real-time web search to ground responses in current information, perfect for:
- Current events
- Technical documentation
- Fact-checking
- Up-to-date information

### Multi-turn Conversations
Maintain conversation context using `conversationId` to build more coherent, contextual interactions.

### Safety Configuration
Fine-tune safety settings per request with granular control over:
- Harassment
- Hate speech
- Sexually explicit content
- Dangerous content

## Example Usage

### Text Generation with Thinking Level
```json
{
  "tool": "generate_text",
  "arguments": {
    "prompt": "Explain quantum computing",
    "model": "gemini-3-pro-preview",
    "thinkingLevel": "high",
    "systemInstruction": "You are a physics professor explaining to undergraduate students",
    "temperature": 1.0,
    "maxTokens": 2048,
    "jsonMode": true,
    "jsonSchema": {
      "type": "object",
      "properties": {
        "explanation": { "type": "string" },
        "key_concepts": { "type": "array", "items": { "type": "string" } },
        "difficulty_level": { "type": "number", "minimum": 1, "maximum": 10 }
      }
    },
    "grounding": true,
    "conversationId": "quantum-discussion-001"
  }
}
```

### Image Analysis with Media Resolution
```json
{
  "tool": "analyze_image",
  "arguments": {
    "prompt": "What's happening in this image? Describe any text, objects, and activities.",
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "model": "gemini-3-pro-preview",
    "mediaResolution": "media_resolution_high"
  }
}
```

### Quick Flash Response
```json
{
  "tool": "generate_text",
  "arguments": {
    "prompt": "Summarize this paragraph in one sentence",
    "model": "gemini-3-flash-preview",
    "thinkingLevel": "minimal"
  }
}
```

## Best Practices

1. **Model Selection**:
   - Use `gemini-3-pro-preview` for complex reasoning, coding, and agentic tasks
   - Use `gemini-3-flash-preview` for general use with good speed/quality balance
   - Use `gemini-2.5-flash-lite` for high-volume, simple tasks

2. **Thinking Levels**:
   - Use `high` for complex reasoning, math, and code analysis
   - Use `minimal` or `low` for simple tasks where speed matters
   - Gemini 3 Pro only supports `low` and `high`; Flash supports all four levels

3. **Temperature**:
   - Google recommends 1.0 as the default for Gemini 3 models
   - Use lower values (0.1-0.3) for factual, deterministic tasks
   - Use higher values (1.2-1.5) for creative writing

4. **Context Management**:
   - Use conversation IDs for multi-turn interactions
   - Monitor token usage with the count_tokens tool
   - Gemini 3 models support up to 1M input tokens and 64K output tokens

5. **Image Analysis**:
   - Use `mediaResolution: high` for detailed diagrams or fine text
   - Use `mediaResolution: low` for quick image classification to save tokens
