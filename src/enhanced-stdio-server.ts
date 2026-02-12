#!/usr/bin/env node
import { GoogleGenAI } from '@google/genai';
import { createInterface } from 'readline';
import { MCPRequest, MCPResponse } from './types.js';

// Increase max buffer size for large images (10MB)
if (process.stdin.setEncoding) {
  process.stdin.setEncoding('utf8');
}

// Available Gemini models as of February 2026
const GEMINI_MODELS = {
  // Gemini 3 series - latest and most capable
  'gemini-3-pro-preview': {
    description: 'Most capable reasoning model, state-of-the-art multimodal and agentic',
    features: ['thinking', 'function_calling', 'json_mode', 'grounding', 'system_instructions'],
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 65536,
    thinking: true,
    thinkingLevels: ['low', 'high']
  },
  'gemini-3-flash-preview': {
    description: 'Best balance of speed, scale, and frontier intelligence',
    features: ['thinking', 'function_calling', 'json_mode', 'grounding', 'system_instructions'],
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 65536,
    thinking: true,
    thinkingLevels: ['minimal', 'low', 'medium', 'high']
  },

  // Legacy models (2.5 series)
  'gemini-2.5-pro': {
    description: 'Previous generation thinking model, complex reasoning and coding',
    features: ['thinking', 'function_calling', 'json_mode', 'grounding', 'system_instructions'],
    contextWindow: 2000000,
    thinking: true
  },
  'gemini-2.5-flash': {
    description: 'Previous generation fast thinking model',
    features: ['thinking', 'function_calling', 'json_mode', 'grounding', 'system_instructions'],
    contextWindow: 1000000,
    thinking: true
  },
  'gemini-2.5-flash-lite': {
    description: 'Previous generation ultra-fast, cost-efficient thinking model',
    features: ['thinking', 'function_calling', 'json_mode', 'system_instructions'],
    contextWindow: 1000000,
    thinking: true
  }
};

// Configurable default model via GEMINI_DEFAULT_MODEL env var.
// Falls back to 'gemini-3-pro-preview' if unset or not a known model.
const DEFAULT_MODEL = (() => {
  const envModel = process.env.GEMINI_DEFAULT_MODEL;
  if (envModel) {
    if (envModel in GEMINI_MODELS) return envModel;
    process.stderr.write(`[warn] GEMINI_DEFAULT_MODEL="${envModel}" is not a known model. Falling back to gemini-3-pro-preview.\n`);
  }
  return 'gemini-3-pro-preview';
})();

class EnhancedStdioMCPServer {
  private genAI: GoogleGenAI;
  private conversations: Map<string, any[]> = new Map();
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.setupStdioInterface();
  }

  private setupStdioInterface() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
      // Increase max line length for large image data
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      if (line.trim()) {
        try {
          const request: MCPRequest = JSON.parse(line);
          this.handleRequest(request);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      }
    });

    process.stdin.on('error', (err) => {
      console.error('stdin error:', err);
    });
  }

  private async handleRequest(request: MCPRequest) {
    console.error('Handling request:', request.method);
    try {
      let response: MCPResponse;

      switch (request.method) {
        case 'initialize':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: {
                name: 'mcp-server-gemini-enhanced',
                version: '0.5.1'
              },
              capabilities: {
                tools: {},
                resources: {},
                prompts: {}
              }
            }
          };
          break;

        case 'tools/list':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: this.getAvailableTools()
            }
          };
          break;

        case 'tools/call':
          response = await this.handleToolCall(request);
          break;

        case 'resources/list':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              resources: this.getAvailableResources()
            }
          };
          break;

        case 'resources/read':
          response = await this.handleResourceRead(request);
          break;

        case 'prompts/list':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              prompts: this.getAvailablePrompts()
            }
          };
          break;

        case 'ping':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {}
          };
          break;

        default:
          if (!('id' in request)) {
            console.error(`Notification received: ${(request as any).method}`);
            return;
          }
          
          response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: 'Method not found'
            }
          };
      }

      this.sendResponse(response);
    } catch (error) {
      const errorResponse: MCPResponse = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error'
        }
      };
      this.sendResponse(errorResponse);
    }
  }

  private getAvailableTools() {
    return [
      {
        name: 'generate_text',
        description: 'Generate text using Google Gemini with advanced features',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to send to Gemini'
            },
            model: {
              type: 'string',
              description: 'Specific Gemini model to use',
              enum: Object.keys(GEMINI_MODELS),
              default: DEFAULT_MODEL
            },
            systemInstruction: {
              type: 'string',
              description: 'System instruction to guide model behavior'
            },
            temperature: {
              type: 'number',
              description: 'Temperature for generation (0-2)',
              default: 1.0,
              minimum: 0,
              maximum: 2
            },
            maxTokens: {
              type: 'number',
              description: 'Maximum tokens to generate',
              default: 2048
            },
            topK: {
              type: 'number',
              description: 'Top-k sampling parameter',
              default: 40
            },
            topP: {
              type: 'number',
              description: 'Top-p (nucleus) sampling parameter',
              default: 0.95
            },
            jsonMode: {
              type: 'boolean',
              description: 'Enable JSON mode for structured output',
              default: false
            },
            jsonSchema: {
              type: 'object',
              description: 'JSON schema for structured output (when jsonMode is true)'
            },
            grounding: {
              type: 'boolean',
              description: 'Enable Google Search grounding for up-to-date information',
              default: false
            },
            safetySettings: {
              type: 'array',
              description: 'Safety settings for content filtering',
              items: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    enum: ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
                  },
                  threshold: {
                    type: 'string',
                    enum: ['BLOCK_NONE', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE']
                  }
                }
              }
            },
            conversationId: {
              type: 'string',
              description: 'ID for maintaining conversation context'
            },
            thinkingLevel: {
              type: 'string',
              description: 'Thinking depth for Gemini 3 models. Pro supports low/high; Flash supports minimal/low/medium/high.',
              enum: ['minimal', 'low', 'medium', 'high']
            }
          },
          required: ['prompt']
        }
      },
      {
        name: 'analyze_image',
        description: 'Analyze images using Gemini vision capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Question or instruction about the image'
            },
            imageUrl: {
              type: 'string',
              description: 'URL of the image to analyze. Either imageUrl or imageBase64 must be provided.'
            },
            imageBase64: {
              type: 'string',
              description: 'Base64-encoded image data. Either imageUrl or imageBase64 must be provided.'
            },
            model: {
              type: 'string',
              description: 'Vision-capable Gemini model',
              enum: ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'],
              default: DEFAULT_MODEL
            },
            mediaResolution: {
              type: 'string',
              description: 'Token allocation for image/video inputs. Higher resolution uses more tokens but provides better detail.',
              enum: ['media_resolution_low', 'media_resolution_medium', 'media_resolution_high']
            }
          },
          required: ['prompt']
        }
      },
      {
        name: 'count_tokens',
        description: 'Count tokens for a given text with a specific model',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to count tokens for'
            },
            model: {
              type: 'string',
              description: 'Model to use for token counting',
              enum: Object.keys(GEMINI_MODELS),
              default: DEFAULT_MODEL
            }
          },
          required: ['text']
        }
      },
      {
        name: 'list_models',
        description: 'List all available Gemini models and their capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: 'Filter models by capability',
              enum: ['all', 'thinking', 'vision', 'grounding', 'json_mode']
            }
          }
        }
      },
      {
        name: 'embed_text',
        description: 'Generate embeddings for text using Gemini embedding models',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to generate embeddings for'
            },
            model: {
              type: 'string',
              description: 'Embedding model to use',
              enum: ['gemini-embedding-001'],
              default: 'gemini-embedding-001'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'get_help',
        description: 'Get help and usage information for the Gemini MCP server',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Help topic to get information about',
              enum: ['overview', 'tools', 'models', 'parameters', 'examples', 'quick-start'],
              default: 'overview'
            }
          }
        }
      }
    ];
  }

  private getAvailableResources() {
    return [
      {
        uri: 'gemini://models',
        name: 'Available Gemini Models',
        description: 'List of all available Gemini models and their capabilities',
        mimeType: 'application/json'
      },
      {
        uri: 'gemini://capabilities',
        name: 'API Capabilities',
        description: 'Detailed information about Gemini API capabilities',
        mimeType: 'text/markdown'
      },
      {
        uri: 'gemini://help/usage',
        name: 'Usage Guide',
        description: 'Complete guide on using all tools and features',
        mimeType: 'text/markdown'
      },
      {
        uri: 'gemini://help/parameters',
        name: 'Parameters Reference',
        description: 'Detailed documentation of all parameters',
        mimeType: 'text/markdown'
      },
      {
        uri: 'gemini://help/examples',
        name: 'Examples',
        description: 'Example usage patterns for common tasks',
        mimeType: 'text/markdown'
      }
    ];
  }

  private getAvailablePrompts() {
    return [
      {
        name: 'code_review',
        description: 'Comprehensive code review with Gemini 3 Pro',
        arguments: [
          {
            name: 'code',
            description: 'Code to review',
            required: true
          },
          {
            name: 'language',
            description: 'Programming language',
            required: false
          }
        ]
      },
      {
        name: 'explain_with_thinking',
        description: 'Deep explanation using Gemini 3 thinking capabilities',
        arguments: [
          {
            name: 'topic',
            description: 'Topic to explain',
            required: true
          },
          {
            name: 'level',
            description: 'Explanation level (beginner/intermediate/expert)',
            required: false
          }
        ]
      },
      {
        name: 'creative_writing',
        description: 'Creative writing with style control',
        arguments: [
          {
            name: 'prompt',
            description: 'Writing prompt',
            required: true
          },
          {
            name: 'style',
            description: 'Writing style',
            required: false
          },
          {
            name: 'length',
            description: 'Desired length',
            required: false
          }
        ]
      }
    ];
  }

  private async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params || {};

    switch (name) {
      case 'generate_text':
        return await this.generateText(request.id, args);
      
      case 'analyze_image':
        return await this.analyzeImage(request.id, args);
      
      case 'count_tokens':
        return await this.countTokens(request.id, args);
      
      case 'list_models':
        return this.listModels(request.id, args);
      
      case 'embed_text':
        return await this.embedText(request.id, args);
      
      case 'get_help':
        return this.getHelp(request.id, args);
      
      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32602,
            message: `Unknown tool: ${name}`
          }
        };
    }
  }

  private async generateText(id: any, args: any): Promise<MCPResponse> {
    try {
      const model = args.model || DEFAULT_MODEL;
      const modelInfo = GEMINI_MODELS[model as keyof typeof GEMINI_MODELS];
      
      if (!modelInfo) {
        throw new Error(`Unknown model: ${model}`);
      }

      // Build contents
      let contents: any[] = [{
        parts: [{ text: args.prompt }],
        role: 'user'
      }];

      // Prepend conversation history if continuing a conversation
      if (args.conversationId) {
        const history = this.conversations.get(args.conversationId) || [];
        if (history.length > 0) {
          contents = [...history, ...contents];
        }
      }

      // Build SDK config (flat structure per @google/genai SDK pattern)
      const config: any = {
        temperature: args.temperature ?? 1.0,
        maxOutputTokens: args.maxTokens || 2048,
        topK: args.topK || 40,
        topP: args.topP || 0.95,
      };

      if (args.systemInstruction) {
        config.systemInstruction = args.systemInstruction;
      }

      if (args.jsonMode) {
        config.responseMimeType = 'application/json';
        if (args.jsonSchema) {
          config.responseSchema = args.jsonSchema;
        }
      }

      if (args.safetySettings) {
        config.safetySettings = args.safetySettings;
      }

      if (args.grounding && modelInfo.features.includes('grounding')) {
        config.tools = [{ googleSearch: {} }];
      }

      // Thinking config for Gemini 3 models (SDK expects uppercase level)
      if (args.thinkingLevel && modelInfo.thinking) {
        config.thinkingConfig = {
          thinkingLevel: args.thinkingLevel.toUpperCase()
        };
      }

      // Call the API using SDK config pattern
      const result = await this.genAI.models.generateContent({
        model,
        contents,
        config,
      });
      const text = result.text || '';

      // Update conversation history with only the new messages
      if (args.conversationId) {
        const history = this.conversations.get(args.conversationId) || [];
        history.push({
          parts: [{ text: args.prompt }],
          role: 'user'
        });
        history.push({
          parts: [{ text: text }],
          role: 'model'
        });
        this.conversations.set(args.conversationId, history);
      }

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: text
          }],
          metadata: {
            model,
            tokensUsed: result.usageMetadata?.totalTokenCount,
            candidatesCount: result.candidates?.length || 1,
            finishReason: result.candidates?.[0]?.finishReason
          }
        }
      };
    } catch (error) {
      console.error('Error in generateText:', error);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Internal error'}`
          }],
          isError: true
        }
      };
    }
  }

  private async analyzeImage(id: any, args: any): Promise<MCPResponse> {
    try {
      const model = args.model || DEFAULT_MODEL;

      // Validate inputs
      if (!args.imageUrl && !args.imageBase64) {
        throw new Error('Either imageUrl or imageBase64 must be provided');
      }

      // Prepare image part
      let imagePart: any;
      if (args.imageUrl) {
        // For URL, we'd need to fetch and convert to base64
        // For now, we'll just pass the URL as instruction
        imagePart = {
          text: `[Image URL: ${args.imageUrl}]`
        };
      } else if (args.imageBase64) {
        // Log base64 data size for debugging
        console.error(`Image base64 length: ${args.imageBase64.length}`);
        
        // Extract MIME type and data
        const matches = args.imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          console.error(`MIME type: ${matches[1]}, Data length: ${matches[2].length}`);
          imagePart = {
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          };
        } else {
          // If no data URI format, assume raw base64
          console.error('Raw base64 data detected');
          imagePart = {
            inlineData: {
              mimeType: 'image/jpeg',
              data: args.imageBase64
            }
          };
        }
      }

      // Build SDK config
      const config: any = {};
      if (args.mediaResolution) {
        config.mediaResolution = args.mediaResolution;
      }

      const result = await this.genAI.models.generateContent({
        model,
        contents: [{
          parts: [
            { text: args.prompt },
            imagePart
          ],
          role: 'user'
        }],
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = result.text || '';

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: text
          }]
        }
      };
    } catch (error) {
      console.error('Error in analyzeImage:', error);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: `Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        }
      };
    }
  }

  private async countTokens(id: any, args: any): Promise<MCPResponse> {
    try {
      const model = args.model || DEFAULT_MODEL;

      const result = await this.genAI.models.countTokens({
        model,
        contents: [{
          parts: [{
            text: args.text
          }],
          role: 'user'
        }]
      });

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: `Token count: ${result.totalTokens}`
          }],
          metadata: {
            tokenCount: result.totalTokens,
            model
          }
        }
      };
    } catch (error) {
      console.error('Error in countTokens:', error);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: `Token counting failed: ${error instanceof Error ? error.message : 'Internal error'}`
          }],
          isError: true
        }
      };
    }
  }

  private listModels(id: any, args: any): MCPResponse {
    const filter = args?.filter || 'all';
    let models = Object.entries(GEMINI_MODELS);

    if (filter !== 'all') {
      models = models.filter(([_, info]) => {
        switch (filter) {
          case 'thinking':
            return 'thinking' in info && info.thinking === true;
          case 'vision':
            return info.features.includes('function_calling'); // All current models support vision
          case 'grounding':
            return info.features.includes('grounding');
          case 'json_mode':
            return info.features.includes('json_mode');
          default:
            return true;
        }
      });
    }

    const modelList = models.map(([name, info]) => ({
      name,
      ...info
    }));

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(modelList, null, 2)
        }],
        metadata: {
          count: modelList.length,
          filter
        }
      }
    };
  }

  private async embedText(id: any, args: any): Promise<MCPResponse> {
    try {
      const model = args.model || 'gemini-embedding-001';
      
      const result = await this.genAI.models.embedContent({
        model,
        contents: args.text
      });

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              embedding: result.embeddings?.[0]?.values || [],
              model
            })
          }],
          metadata: {
            model,
            dimensions: result.embeddings?.[0]?.values?.length || 0
          }
        }
      };
    } catch (error) {
      console.error('Error in embedText:', error);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{
            type: 'text',
            text: `Embedding failed: ${error instanceof Error ? error.message : 'Internal error'}`
          }],
          isError: true
        }
      };
    }
  }

  private async handleResourceRead(request: MCPRequest): Promise<MCPResponse> {
    const uri = request.params?.uri;
    
    if (!uri) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: 'Missing required parameter: uri'
        }
      };
    }

    let content = '';
    let mimeType = 'text/plain';

    switch (uri) {
      case 'gemini://models':
        content = JSON.stringify(GEMINI_MODELS, null, 2);
        mimeType = 'application/json';
        break;

      case 'gemini://capabilities':
        content = `# Gemini API Capabilities

## Text Generation
- All models support advanced text generation
- System instructions for behavior control
- Temperature, topK, topP for output control
- Default temperature: 1.0 (recommended for Gemini 3)

## Thinking Models (3.x Series)
- Step-by-step reasoning before responding
- Configurable thinking depth via thinkingLevel parameter
- Gemini 3 Pro: low, high
- Gemini 3 Flash: minimal, low, medium, high
- Better accuracy for complex problems
- Ideal for coding, analysis, and problem-solving

## Media Resolution
- Control token allocation for image/video inputs
- Options: media_resolution_low, media_resolution_medium (default), media_resolution_high
- Higher resolution provides better detail at the cost of more tokens

## JSON Mode
- Structured output with schema validation
- Available on all models
- Ensures consistent response format

## Google Search Grounding
- Real-time web search integration
- Available on select models
- Perfect for current events and facts

## Vision Capabilities
- Image analysis and understanding
- Available on most models
- Supports URLs and base64 images

## Embeddings
- Semantic text embeddings
- Multiple models available
- Multilingual support

## Safety Settings
- Granular content filtering
- Customizable thresholds
- Per-category control

## Conversation Memory
- Context retention across messages
- Session-based conversations
- Ideal for multi-turn interactions`;
        mimeType = 'text/markdown';
        break;

      case 'gemini://help/usage':
        content = this.getHelpContent('overview') + '\n\n' + this.getHelpContent('tools');
        mimeType = 'text/markdown';
        break;

      case 'gemini://help/parameters':
        content = this.getHelpContent('parameters');
        mimeType = 'text/markdown';
        break;

      case 'gemini://help/examples':
        content = this.getHelpContent('examples');
        mimeType = 'text/markdown';
        break;

      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32602,
            message: `Unknown resource: ${uri}`
          }
        };
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        contents: [{
          uri,
          mimeType,
          text: content
        }]
      }
    };
  }

  private getHelpContent(topic: string): string {
    // Extract help content generation to a separate method
    switch (topic) {
      case 'overview':
        return `# Gemini MCP Server Help

Welcome to the Gemini MCP Server v0.5.1! This server provides access to Google's Gemini AI models through Claude Desktop.

## Available Tools
1. **generate_text** - Generate text with advanced features
2. **analyze_image** - Analyze images using vision models
3. **count_tokens** - Count tokens for cost estimation
4. **list_models** - List all available models
5. **embed_text** - Generate text embeddings
6. **get_help** - Get help on using this server

## Quick Start
- "Use Gemini to explain [topic]"
- "Analyze this image with Gemini"
- "List all Gemini models"
- "Get help on parameters"

## Key Features
- Latest Gemini 3 models with configurable thinking depth
- Thinking level control (minimal/low/medium/high)
- Media resolution control for vision tasks
- JSON mode for structured output
- Google Search grounding for current information
- System instructions for behavior control
- Conversation memory for context
- Safety settings customization

Use "get help on tools" for detailed tool information.`;

      case 'tools':
        return `# Available Tools

## 1. generate_text
Generate text using Gemini models with advanced features.

**Parameters:**
- prompt (required): Your text prompt
- model: Choose from gemini-3-pro-preview, gemini-3-flash-preview, etc.
- temperature: 0-2 (default 1.0)
- maxTokens: Max output tokens (default 2048)
- systemInstruction: Guide model behavior
- jsonMode: Enable JSON output
- grounding: Enable Google Search
- conversationId: Maintain conversation context
- thinkingLevel: Thinking depth (minimal/low/medium/high) for Gemini 3 models

**Example:** "Use Gemini 3 Pro to explain quantum computing"

## 2. analyze_image
Analyze images using vision-capable models.

**Parameters:**
- prompt (required): Question about the image
- imageUrl OR imageBase64 (required): Image source
- model: Vision-capable model (default gemini-3-pro-preview)
- mediaResolution: Token allocation for images (low/medium/high)

**Example:** "Analyze this architecture diagram"

## 3. count_tokens
Count tokens for text with a specific model.

**Parameters:**
- text (required): Text to count
- model: Model for counting (default gemini-3-pro-preview)

**Example:** "Count tokens for this paragraph"

## 4. list_models
List available models with optional filtering.

**Parameters:**
- filter: all, thinking, vision, grounding, json_mode

**Example:** "List models with thinking capability"

## 5. embed_text
Generate embeddings for semantic search.

**Parameters:**
- text (required): Text to embed
- model: gemini-embedding-001 (default)

**Example:** "Generate embeddings for similarity search"

## 6. get_help
Get help on using this server.

**Parameters:**
- topic: overview, tools, models, parameters, examples, quick-start

**Example:** "Get help on parameters"`;

      case 'parameters':
        return `# Parameter Reference

## generate_text Parameters

**Required:**
- prompt (string): Your text prompt

**Optional:**
- model (string): Model to use (default: gemini-3-pro-preview)
- systemInstruction (string): System prompt for behavior
- temperature (0-2): Creativity level (default: 1.0)
- maxTokens (number): Max output tokens (default: 2048)
- topK (number): Top-k sampling (default: 40)
- topP (number): Nucleus sampling (default: 0.95)
- jsonMode (boolean): Enable JSON output
- jsonSchema (object): JSON schema for validation
- grounding (boolean): Enable Google Search
- conversationId (string): Conversation identifier
- safetySettings (array): Content filtering settings
- thinkingLevel (string): Thinking depth for Gemini 3 models (minimal/low/medium/high)

## analyze_image Parameters

**Required:**
- prompt (string): Question about the image
- imageUrl OR imageBase64: Image source

**Optional:**
- model (string): Vision model (default: gemini-3-pro-preview)
- mediaResolution (string): Token allocation for images
  - media_resolution_low: Fewer tokens, faster processing
  - media_resolution_medium: Balanced (default)
  - media_resolution_high: More tokens, better detail

## Thinking Level Guide
- minimal: Fastest, minimal reasoning (Flash only)
- low: Light reasoning
- medium: Moderate reasoning (Flash only)
- high: Deep reasoning (default for thinking models)

## Temperature Guide
- 0.1-0.3: Precise, factual
- 0.7-1.0: Balanced (default 1.0, recommended for Gemini 3)
- 1.0-1.5: Creative
- 1.5-2.0: Very creative

## JSON Mode Example
Enable jsonMode and provide jsonSchema:
{
  "type": "object",
  "properties": {
    "sentiment": {"type": "string"},
    "score": {"type": "number"}
  }
}

## Safety Settings
Categories: HARASSMENT, HATE_SPEECH, SEXUALLY_EXPLICIT, DANGEROUS_CONTENT
Thresholds: BLOCK_NONE, BLOCK_ONLY_HIGH, BLOCK_MEDIUM_AND_ABOVE, BLOCK_LOW_AND_ABOVE`;

      case 'examples':
        return `# Usage Examples

## Basic Text Generation
"Use Gemini to explain machine learning"

## With Specific Model
"Use Gemini 3 Pro to write a Python sorting function"

## With Thinking Level
"Use Gemini 3 Pro with thinkingLevel high to solve this math problem"

## With Temperature
"Use Gemini with temperature 1.5 to write a creative story"

## JSON Mode
"Use Gemini in JSON mode to analyze sentiment and return {sentiment, confidence, keywords}"

## With Grounding
"Use Gemini with grounding to research latest AI developments"

## System Instructions
"Use Gemini as a Python tutor to explain decorators"

## Conversation Context
"Start conversation 'chat-001' about web development"
"Continue chat-001 and ask about React hooks"

## Image Analysis
"Analyze this screenshot and describe the UI elements"

## Image Analysis with High Resolution
"Analyze this diagram with mediaResolution high for maximum detail"

## Token Counting
"Count tokens for this document using gemini-3-pro-preview"

## Complex Example
"Use Gemini 3 Pro to review this code with:
- System instruction: 'You are a security expert'
- Temperature: 0.3
- thinkingLevel: high
- JSON mode with schema for findings
- Grounding for latest security practices"`;

      default:
        return 'Unknown help topic.';
    }
  }

  private getHelp(id: any, args: any): MCPResponse {
    const topic = args?.topic || 'overview';
    let helpContent = '';

    switch (topic) {
      case 'overview':
        helpContent = this.getHelpContent('overview');
        break;

      case 'tools':
        helpContent = this.getHelpContent('tools');
        break;

      case 'models':
        helpContent = `# Available Gemini Models

## Gemini 3 Series (Latest)
**gemini-3-pro-preview** ⭐ Recommended
- Most capable reasoning model, state-of-the-art multimodal and agentic
- 1M token context, 64K max output
- Thinking levels: low, high
- Features: thinking, JSON mode, grounding, system instructions

**gemini-3-flash-preview**
- Best balance of speed, scale, and frontier intelligence
- 1M token context, 64K max output
- Thinking levels: minimal, low, medium, high
- Features: thinking, JSON mode, grounding, system instructions

## Legacy Models (2.5 Series)
**gemini-2.5-pro**
- Previous generation thinking model
- 2M token context window
- Features: thinking, JSON mode, grounding, system instructions

**gemini-2.5-flash**
- Previous generation fast thinking model
- 1M token context window
- Features: thinking, JSON mode, grounding, system instructions

**gemini-2.5-flash-lite**
- Previous generation ultra-fast model
- 1M token context window
- Features: thinking, JSON mode, system instructions

## Model Selection Guide
- Complex reasoning: gemini-3-pro-preview
- General use: gemini-3-pro-preview
- Fast responses: gemini-3-flash-preview
- Cost-sensitive: gemini-2.5-flash-lite
- Maximum thinking control: gemini-3-flash-preview (4 levels)`;
        break;

      case 'parameters':
        helpContent = this.getHelpContent('parameters');
        break;

      case 'examples':
        helpContent = this.getHelpContent('examples');
        break;

      case 'quick-start':
        helpContent = `# Quick Start Guide

## 1. Basic Usage
Just ask naturally:
- "Use Gemini to [your request]"
- "Ask Gemini about [topic]"

## 2. Common Tasks

**Text Generation:**
"Use Gemini to write a function that sorts arrays"

**Image Analysis:**
"What's in this image?" [attach image]

**Model Info:**
"List all Gemini models"

**Token Counting:**
"Count tokens for my prompt"

## 3. Advanced Features

**JSON Output:**
"Use Gemini in JSON mode to extract key points"

**Current Information:**
"Use Gemini with grounding to get latest news"

**Conversations:**
"Start a chat with Gemini about Python"

## 4. Tips
- Use gemini-3-pro-preview for most tasks
- Lower temperature for facts, higher for creativity
- Enable grounding for current information
- Use conversation IDs to maintain context

## Need More Help?
- "Get help on tools" - Detailed tool information
- "Get help on parameters" - All parameters explained
- "Get help on models" - Model selection guide`;
        break;

      default:
        helpContent = 'Unknown help topic. Available topics: overview, tools, models, parameters, examples, quick-start';
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: helpContent
        }]
      }
    };
  }

  private sendResponse(response: MCPResponse) {
    const responseStr = JSON.stringify(response);
    process.stdout.write(responseStr + '\n');
  }
}

// Start the server
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

new EnhancedStdioMCPServer(apiKey);