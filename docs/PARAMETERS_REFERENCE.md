# Gemini MCP Server - Complete Parameters Reference

This guide provides detailed information on all available parameters for each tool.

## 1. generate_text Tool

### Required Parameters
- **prompt** (string): The text prompt to send to Gemini

### Optional Parameters

| Parameter | Type | Default | Description | Example Values |
|-----------|------|---------|-------------|----------------|
| **model** | string | gemini-3-pro-preview | Gemini model to use | gemini-3-pro-preview, gemini-3-flash-preview, gemini-2.5-pro |
| **systemInstruction** | string | none | System prompt to guide behavior | "You are a helpful Python tutor" |
| **temperature** | number | 1.0 | Creativity level (0-2) | 0.1 (precise), 1.0 (balanced), 1.5 (creative) |
| **maxTokens** | number | 2048 | Maximum output tokens | 100, 500, 1000, 4096, 65536 |
| **topK** | number | 40 | Top-k sampling | 1 (greedy), 40 (default), 100 (diverse) |
| **topP** | number | 0.95 | Nucleus sampling | 0.1 (focused), 0.95 (default), 1.0 (all) |
| **thinkingLevel** | string | none | Thinking depth for Gemini 3 models | minimal, low, medium, high |
| **jsonMode** | boolean | false | Enable JSON output | true, false |
| **jsonSchema** | object | none | JSON schema validation | See examples below |
| **grounding** | boolean | false | Enable Google Search | true, false |
| **conversationId** | string | none | Maintain conversation | "chat-001", "session-123" |
| **safetySettings** | array | default | Content filtering | See safety section |

### Thinking Level Details

The `thinkingLevel` parameter controls reasoning depth for Gemini 3 models:

| Level | Description | Available On |
|-------|-------------|-------------|
| `minimal` | Fastest, minimal reasoning | gemini-3-flash-preview only |
| `low` | Light reasoning | gemini-3-pro-preview, gemini-3-flash-preview |
| `medium` | Moderate reasoning | gemini-3-flash-preview only |
| `high` | Deep reasoning (recommended for complex tasks) | gemini-3-pro-preview, gemini-3-flash-preview |

**Note:** `thinkingLevel` is only effective on models with thinking capability. It is ignored for legacy models.

### Examples with Parameters

#### Basic Text Generation
```
"Use Gemini to explain machine learning"
```

#### With Specific Model and Temperature
```
"Use Gemini 3 Pro with temperature 0.2 to write technical documentation for this API"
```

#### With Thinking Level
```
"Use Gemini 3 Pro with thinkingLevel high to solve this complex math problem"
"Use Gemini 3 Flash with thinkingLevel minimal for a quick answer"
```

#### With System Instruction
```
"Use Gemini with system instruction 'You are an expert Python developer' to review this code"
```

#### JSON Mode with Schema
```
"Use Gemini in JSON mode to analyze this text and return:
{
  type: object,
  properties: {
    sentiment: { type: string, enum: ['positive', 'negative', 'neutral'] },
    confidence: { type: number, minimum: 0, maximum: 1 },
    keywords: { type: array, items: { type: string } }
  }
}"
```

#### With Grounding
```
"Use Gemini with grounding enabled to tell me about the latest AI developments"
```

#### With Conversation Memory
```
"Start a conversation with ID 'python-help' and ask Gemini about decorators"
"Continue conversation 'python-help' and ask about generators"
```

#### With Safety Settings
```
"Use Gemini with safety settings [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }
] to analyze this medical text"
```

## 2. analyze_image Tool

### Required Parameters (one of these)
- **imageUrl** (string): URL of the image to analyze
- **imageBase64** (string): Base64-encoded image data

### Required Parameters
- **prompt** (string): Question or instruction about the image

### Optional Parameters
| Parameter | Type | Default | Description | Example Values |
|-----------|------|---------|-------------|----------------|
| **model** | string | gemini-3-pro-preview | Vision-capable model | gemini-3-pro-preview, gemini-3-flash-preview, gemini-2.5-pro, gemini-2.5-flash |
| **mediaResolution** | string | media_resolution_medium | Token allocation for image/video | media_resolution_low, media_resolution_medium, media_resolution_high |

### Media Resolution Details

The `mediaResolution` parameter controls how many tokens are allocated to process the image:

| Level | Description | Use Case |
|-------|-------------|----------|
| `media_resolution_low` | Minimal token allocation | Quick classification, simple descriptions |
| `media_resolution_medium` | Balanced (default) | General image analysis |
| `media_resolution_high` | Maximum token allocation | Detailed diagrams, fine text, complex scenes |

### Examples

#### With Image URL
```
"Analyze this image and describe what you see: https://example.com/image.jpg"
```

#### With Base64 Image
```
"What's in this screenshot? [paste image directly]"
```

#### With Specific Model and Media Resolution
```
"Use Gemini 3 Pro with mediaResolution high to analyze this architecture diagram and explain the components"
```

## 3. count_tokens Tool

### Required Parameters
- **text** (string): Text to count tokens for

### Optional Parameters
| Parameter | Type | Default | Description | Example Values |
|-----------|------|---------|-------------|----------------|
| **model** | string | gemini-3-pro-preview | Model for token counting | Any Gemini model |

### Examples
```
"Count tokens for this text: [your long text]"
"How many tokens would this use with gemini-3-pro-preview: [text]"
```

## 4. list_models Tool

### Optional Parameters
| Parameter | Type | Default | Description | Example Values |
|-----------|------|---------|-------------|----------------|
| **filter** | string | all | Filter by capability | all, thinking, vision, grounding, json_mode |

### Examples
```
"List all Gemini models"
"Show me models with thinking capability"
"Which models support grounding?"
"List models that have JSON mode"
```

## 5. embed_text Tool

### Required Parameters
- **text** (string): Text to generate embeddings for

### Optional Parameters
| Parameter | Type | Default | Description | Example Values |
|-----------|------|---------|-------------|----------------|
| **model** | string | gemini-embedding-001 | Embedding model | gemini-embedding-001 |

### Examples
```
"Generate embeddings for: Machine learning is fascinating"
"Create embeddings for this text using gemini-embedding-001"
```

## Advanced Parameter Combinations

### Complex Analysis with All Features
```
"Use Gemini 3 Pro with thinkingLevel high to analyze this code with:
- System instruction: 'You are a security expert'
- Temperature: 0.3
- Max tokens: 4096
- JSON mode enabled
- Schema: { security_score: number, vulnerabilities: array, recommendations: array }
- Grounding enabled for latest security practices"
```

### Creative Writing with Parameters
```
"Use Gemini 3 Flash with thinkingLevel minimal to write a story with:
- Temperature: 1.5
- Max tokens: 2000
- Top-k: 100
- Top-p: 0.98
- System instruction: 'You are a creative sci-fi writer'"
```

### Conversation with Context
```
"Start conversation 'code-review-001' with Gemini 3 Pro using:
- thinkingLevel: high
- System instruction: 'You are a thorough code reviewer'
- Temperature: 0.5
- Review this Python function"

"Continue conversation 'code-review-001' and ask about performance optimizations"
```

## Safety Settings Reference

### Categories
- HARM_CATEGORY_HARASSMENT
- HARM_CATEGORY_HATE_SPEECH
- HARM_CATEGORY_SEXUALLY_EXPLICIT
- HARM_CATEGORY_DANGEROUS_CONTENT

### Thresholds
- BLOCK_NONE - No blocking
- BLOCK_ONLY_HIGH - Block only high probability
- BLOCK_MEDIUM_AND_ABOVE - Block medium and high
- BLOCK_LOW_AND_ABOVE - Block all but negligible

### Example
```
"Use Gemini with safety settings:
[
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
]
to analyze this medical research paper"
```

## Model-Specific Features

### Gemini 3 Series (Latest)
- **gemini-3-pro-preview** — Most capable reasoning, agentic, multimodal (1M context, 64K output, thinkingLevels: low/high)
- **gemini-3-flash-preview** — Speed + intelligence balance (1M context, 64K output, thinkingLevels: minimal/low/medium/high)

### Legacy 2.5 Series
- **gemini-2.5-pro** — Previous generation pro model (2M context)
- **gemini-2.5-flash** — Previous generation fast model (1M context)
- **gemini-2.5-flash-lite** — Ultra-fast, cost-efficient

These models all support:
- Thinking capabilities
- Function calling
- JSON mode
- System instructions
- Google Search grounding
- Safety settings
- Temperature control

### Embedding Model
- **gemini-embedding-001** — Text embeddings for semantic search and similarity

## Tips for Parameter Usage

1. **Start Simple**: Begin with just the prompt, add parameters as needed
2. **Model Selection**: Use gemini-3-pro-preview for complex reasoning, gemini-3-flash-preview for speed
3. **Thinking Levels**: Use `thinkingLevel: high` for complex problems, `minimal` for quick answers
4. **Temperature**: Google recommends 1.0 as default for Gemini 3; lower for factual tasks, higher for creative
5. **Media Resolution**: Use `high` for detailed image analysis, `low` for quick classification
6. **Token Limits**: Count tokens first for long inputs; Gemini 3 models support up to 64K output tokens
7. **JSON Mode**: Always provide a schema for consistent output
8. **Grounding**: Enable only when you need current information
9. **Conversations**: Use IDs to maintain context across multiple queries

## Common Parameter Patterns

### For Code Review
```
model: "gemini-3-pro-preview"
thinkingLevel: "high"
temperature: 0.3
systemInstruction: "You are an expert code reviewer"
jsonMode: true
maxTokens: 4096
```

### For Creative Writing
```
model: "gemini-3-flash-preview"
thinkingLevel: "minimal"
temperature: 1.2
topK: 100
topP: 0.98
maxTokens: 2000
```

### For Factual Analysis
```
model: "gemini-3-pro-preview"
temperature: 0.1
grounding: true
jsonMode: true
```

### For Learning/Tutoring
```
model: "gemini-3-flash-preview"
systemInstruction: "You are a patient teacher"
temperature: 1.0
conversationId: "learning-session-001"
```

### For Image Analysis
```
model: "gemini-3-pro-preview"
mediaResolution: "media_resolution_high"
```

## Error Handling

When a tool encounters an error during execution (e.g. invalid model, API failure, rate limiting), the error message is returned in the standard MCP result format with `isError: true`:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Unknown model: gemini-invalid. Use list_models to see available models."
    }
  ],
  "isError": true
}
```

This follows the [MCP specification](https://modelcontextprotocol.io) best practice: tool execution errors are returned in `result.content` (so the LLM can see and self-correct), while only protocol-level errors (unknown method, malformed request) use JSON-RPC error responses.
