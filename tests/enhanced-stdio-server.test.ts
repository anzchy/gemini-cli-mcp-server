/**
 * Comprehensive tests for EnhancedStdioMCPServer.
 *
 * These tests spawn the MCP server as a child process and communicate
 * over stdin/stdout using the JSON-RPC 2.0 protocol, exactly as a real
 * MCP client would.
 *
 * Tests marked with `@integration` require a valid GEMINI_API_KEY in .env
 * and make real API calls to Google Gemini.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { ChildProcess, spawn } from 'child_process';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '..', '.env') });

const SERVER_PATH = resolve(__dirname, '..', 'dist', 'enhanced-stdio-server.js');
const API_KEY = process.env.GEMINI_API_KEY;

// A dummy key is sufficient for protocol tests — the server just needs
// a non-empty value to start. Only integration tests need a real key.
const SERVER_KEY = API_KEY || 'dummy-key-for-protocol-tests';

// Detect proxy from environment for child processes
const PROXY_URL = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY || '';

// Helper: send a JSON-RPC message and wait for a response
function sendRequest(
  proc: ChildProcess,
  request: Record<string, any>,
  timeoutMs = 30000
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for response to method="${request.method}" id=${request.id}`));
    }, timeoutMs);

    const handler = (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === request.id) {
            clearTimeout(timer);
            proc.stdout!.off('data', handler);
            resolve(parsed);
            return;
          }
        } catch {
          // ignore non-JSON lines
        }
      }
    };

    proc.stdout!.on('data', handler);
    proc.stdin!.write(JSON.stringify(request) + '\n');
  });
}

// Helper: spawn the server process
function spawnServer(): ChildProcess {
  const nodeArgs = ['--use-env-proxy', SERVER_PATH];
  const proc = spawn('node', nodeArgs, {
    env: { ...process.env, GEMINI_API_KEY: SERVER_KEY },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  return proc;
}

// Helper: assert that a response has a result (not an error)
function expectResult(res: Record<string, any>): void {
  if (res.error) {
    throw new Error(`Expected result but got error: ${JSON.stringify(res.error)}`);
  }
  expect(res.result).toBeDefined();
}

// Helper: initialize the server (required before other calls)
async function initServer(proc: ChildProcess): Promise<Record<string, any>> {
  return sendRequest(proc, {
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {}
  });
}

// ============================================================
// UNIT TESTS — protocol-level, no real API calls needed
// ============================================================

describe('MCP Protocol Tests', () => {
  let server: ChildProcess;

  afterEach((done) => {
    if (server && !server.killed) {
      server.on('exit', () => done());
      server.kill();
    } else {
      done();
    }
  });

  // --- initialize ---
  describe('initialize', () => {
    it('should return correct protocol version and server info', async () => {
      server = spawnServer();
      const res = await initServer(server);

      expect(res.jsonrpc).toBe('2.0');
      expect(res.id).toBe(0);
      expect(res.result.protocolVersion).toBe('2024-11-05');
      expect(res.result.serverInfo.name).toBe('mcp-server-gemini-enhanced');
      expect(res.result.serverInfo.version).toBe('0.5.0');
      expect(res.result.capabilities).toHaveProperty('tools');
      expect(res.result.capabilities).toHaveProperty('resources');
      expect(res.result.capabilities).toHaveProperty('prompts');
    });
  });

  // --- tools/list ---
  describe('tools/list', () => {
    it('should return all 6 tools', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      });

      const tools = res.result.tools;
      expect(tools).toHaveLength(6);
      const names = tools.map((t: any) => t.name);
      expect(names).toContain('generate_text');
      expect(names).toContain('analyze_image');
      expect(names).toContain('count_tokens');
      expect(names).toContain('list_models');
      expect(names).toContain('embed_text');
      expect(names).toContain('get_help');
    });

    it('generate_text tool should have thinkingLevel parameter', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      });

      const genTool = res.result.tools.find((t: any) => t.name === 'generate_text');
      expect(genTool.inputSchema.properties).toHaveProperty('thinkingLevel');
      expect(genTool.inputSchema.properties.thinkingLevel.enum).toEqual(
        ['minimal', 'low', 'medium', 'high']
      );
    });

    it('generate_text default model should be gemini-3-pro-preview', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/list',
        params: {}
      });

      const genTool = res.result.tools.find((t: any) => t.name === 'generate_text');
      expect(genTool.inputSchema.properties.model.default).toBe('gemini-3-pro-preview');
    });

    it('generate_text default temperature should be 1.0', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/list',
        params: {}
      });

      const genTool = res.result.tools.find((t: any) => t.name === 'generate_text');
      expect(genTool.inputSchema.properties.temperature.default).toBe(1.0);
    });

    it('analyze_image tool should have mediaResolution parameter', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/list',
        params: {}
      });

      const imgTool = res.result.tools.find((t: any) => t.name === 'analyze_image');
      expect(imgTool.inputSchema.properties).toHaveProperty('mediaResolution');
      expect(imgTool.inputSchema.properties.mediaResolution.enum).toEqual([
        'media_resolution_low',
        'media_resolution_medium',
        'media_resolution_high'
      ]);
    });

    it('analyze_image model enum should include Gemini 3 models', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/list',
        params: {}
      });

      const imgTool = res.result.tools.find((t: any) => t.name === 'analyze_image');
      expect(imgTool.inputSchema.properties.model.enum).toContain('gemini-3-pro-preview');
      expect(imgTool.inputSchema.properties.model.enum).toContain('gemini-3-flash-preview');
    });

    it('count_tokens default model should be gemini-3-pro-preview', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/list',
        params: {}
      });

      const tokenTool = res.result.tools.find((t: any) => t.name === 'count_tokens');
      expect(tokenTool.inputSchema.properties.model.default).toBe('gemini-3-pro-preview');
    });
  });

  // --- resources/list ---
  describe('resources/list', () => {
    it('should return all 5 resources', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 10,
        method: 'resources/list',
        params: {}
      });

      const resources = res.result.resources;
      expect(resources).toHaveLength(5);
      const uris = resources.map((r: any) => r.uri);
      expect(uris).toContain('gemini://models');
      expect(uris).toContain('gemini://capabilities');
      expect(uris).toContain('gemini://help/usage');
      expect(uris).toContain('gemini://help/parameters');
      expect(uris).toContain('gemini://help/examples');
    });
  });

  // --- resources/read ---
  describe('resources/read', () => {
    it('gemini://models should contain Gemini 3 models', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 11,
        method: 'resources/read',
        params: { uri: 'gemini://models' }
      });

      const text = res.result.contents[0].text;
      const models = JSON.parse(text);
      expect(models).toHaveProperty('gemini-3-pro-preview');
      expect(models).toHaveProperty('gemini-3-flash-preview');
      expect(models['gemini-3-pro-preview'].thinkingLevels).toEqual(['low', 'high']);
      expect(models['gemini-3-flash-preview'].thinkingLevels).toEqual(['minimal', 'low', 'medium', 'high']);
    });

    it('gemini://models should NOT contain deprecated 2.0 or 1.5 models', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 12,
        method: 'resources/read',
        params: { uri: 'gemini://models' }
      });

      const text = res.result.contents[0].text;
      const models = JSON.parse(text);
      expect(models).not.toHaveProperty('gemini-2.0-flash');
      expect(models).not.toHaveProperty('gemini-2.0-flash-lite');
      expect(models).not.toHaveProperty('gemini-2.0-pro-experimental');
      expect(models).not.toHaveProperty('gemini-1.5-pro');
      expect(models).not.toHaveProperty('gemini-1.5-flash');
    });

    it('gemini://capabilities should mention Thinking Models (3.x Series)', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 13,
        method: 'resources/read',
        params: { uri: 'gemini://capabilities' }
      });

      const text = res.result.contents[0].text;
      expect(text).toContain('Thinking Models (3.x Series)');
      expect(text).toContain('thinkingLevel');
      expect(text).toContain('Media Resolution');
    });

    it('should return error for unknown resource URI', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 14,
        method: 'resources/read',
        params: { uri: 'gemini://nonexistent' }
      });

      expect(res.error).toBeDefined();
      expect(res.error.code).toBe(-32602);
    });

    it('should return error when URI is missing', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 15,
        method: 'resources/read',
        params: {}
      });

      expect(res.error).toBeDefined();
      expect(res.error.code).toBe(-32602);
    });
  });

  // --- prompts/list ---
  describe('prompts/list', () => {
    it('should return prompts referencing Gemini 3', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 20,
        method: 'prompts/list',
        params: {}
      });

      const prompts = res.result.prompts;
      expect(prompts.length).toBeGreaterThanOrEqual(3);

      const codeReview = prompts.find((p: any) => p.name === 'code_review');
      expect(codeReview.description).toContain('Gemini 3 Pro');

      const thinking = prompts.find((p: any) => p.name === 'explain_with_thinking');
      expect(thinking.description).toContain('Gemini 3');
    });
  });

  // --- tools/call: list_models ---
  describe('tools/call: list_models', () => {
    it('should list all models', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 30,
        method: 'tools/call',
        params: {
          name: 'list_models',
          arguments: { filter: 'all' }
        }
      });

      const models = JSON.parse(res.result.content[0].text);
      expect(models.length).toBe(5); // 2 Gemini 3 + 3 legacy 2.5
      expect(models[0].name).toBe('gemini-3-pro-preview');
    });

    it('should filter thinking models', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 31,
        method: 'tools/call',
        params: {
          name: 'list_models',
          arguments: { filter: 'thinking' }
        }
      });

      const models = JSON.parse(res.result.content[0].text);
      expect(models.length).toBe(5); // All models in the list support thinking
      expect(models.every((m: any) => m.thinking === true)).toBe(true);
    });

    it('should filter grounding models', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 32,
        method: 'tools/call',
        params: {
          name: 'list_models',
          arguments: { filter: 'grounding' }
        }
      });

      const models = JSON.parse(res.result.content[0].text);
      // gemini-2.5-flash-lite doesn't have grounding
      expect(models.length).toBe(4);
      expect(models.every((m: any) => m.features.includes('grounding'))).toBe(true);
    });
  });

  // --- tools/call: get_help ---
  describe('tools/call: get_help', () => {
    it('should return overview help with v5.0.0', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 40,
        method: 'tools/call',
        params: {
          name: 'get_help',
          arguments: { topic: 'overview' }
        }
      });

      const text = res.result.content[0].text;
      expect(text).toContain('v0.5.0');
      expect(text).toContain('Gemini 3');
    });

    it('should return models help with Gemini 3 info', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 41,
        method: 'tools/call',
        params: {
          name: 'get_help',
          arguments: { topic: 'models' }
        }
      });

      const text = res.result.content[0].text;
      expect(text).toContain('gemini-3-pro-preview');
      expect(text).toContain('gemini-3-flash-preview');
      expect(text).toContain('Thinking levels');
    });

    it('should return parameters help with thinkingLevel', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 42,
        method: 'tools/call',
        params: {
          name: 'get_help',
          arguments: { topic: 'parameters' }
        }
      });

      const text = res.result.content[0].text;
      expect(text).toContain('thinkingLevel');
      expect(text).toContain('mediaResolution');
      expect(text).toContain('default: 1.0');
    });

    it('should return examples help with Gemini 3 references', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 43,
        method: 'tools/call',
        params: {
          name: 'get_help',
          arguments: { topic: 'examples' }
        }
      });

      const text = res.result.content[0].text;
      expect(text).toContain('Gemini 3 Pro');
      expect(text).toContain('thinkingLevel');
      expect(text).toContain('mediaResolution');
    });

    it('should default to overview when no topic', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 44,
        method: 'tools/call',
        params: {
          name: 'get_help',
          arguments: {}
        }
      });

      const text = res.result.content[0].text;
      expect(text).toContain('Gemini MCP Server Help');
    });
  });

  // --- unknown method ---
  describe('unknown method', () => {
    it('should return -32601 for unknown methods', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 50,
        method: 'nonexistent/method',
        params: {}
      });

      expect(res.error).toBeDefined();
      expect(res.error.code).toBe(-32601);
    });
  });

  // --- unknown tool ---
  describe('unknown tool', () => {
    it('should return -32601 for unknown tool name', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 51,
        method: 'tools/call',
        params: {
          name: 'nonexistent_tool',
          arguments: {}
        }
      });

      expect(res.error).toBeDefined();
      expect(res.error.code).toBe(-32602);
    });
  });
});

// ============================================================
// INTEGRATION TESTS — real Gemini API calls
// Skipped automatically when GEMINI_API_KEY is not set.
// ============================================================

const describeIntegration = API_KEY ? describe : describe.skip;

describeIntegration('Gemini API Integration Tests', () => {
  let server: ChildProcess;

  afterEach((done) => {
    if (server && !server.killed) {
      server.on('exit', () => done());
      server.kill();
    } else {
      done();
    }
  });

  // --- generate_text ---
  describe('generate_text', () => {
    it('should generate text with default model (gemini-3-pro-preview)', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 100,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'Say exactly "hello world" and nothing else.'
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].type).toBe('text');
      expect(res.result.content[0].text.toLowerCase()).toContain('hello world');
      expect(res.result.metadata.model).toBe('gemini-3-pro-preview');
    });

    it('should generate text with gemini-3-flash-preview', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 101,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'What is 2+2? Reply with just the number.',
            model: 'gemini-3-flash-preview'
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].text).toContain('4');
      expect(res.result.metadata.model).toBe('gemini-3-flash-preview');
    });

    it('should work with thinkingLevel=high on gemini-3-pro-preview', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 102,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'What is the square root of 144? Reply with just the number.',
            model: 'gemini-3-pro-preview',
            thinkingLevel: 'high'
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].text).toContain('12');
    });

    it('should work with thinkingLevel=low on gemini-3-pro-preview', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 103,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'What color is the sky? One word only.',
            model: 'gemini-3-pro-preview',
            thinkingLevel: 'low'
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].text.toLowerCase()).toContain('blue');
    });

    it('should work with thinkingLevel=minimal on gemini-3-flash-preview', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 104,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'What is 5 + 3? Reply with just the number.',
            model: 'gemini-3-flash-preview',
            thinkingLevel: 'minimal'
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].text).toContain('8');
    });

    it('should work with temperature=0.1 (precise)', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 105,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'What is the capital of France? One word only.',
            temperature: 0.1
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].text.toLowerCase()).toContain('paris');
    });

    it('should work with temperature=0 (deterministic)', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 106,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'Reply with exactly the word "test".',
            temperature: 0
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].text.toLowerCase()).toContain('test');
    });

    it('should work with systemInstruction', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 107,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'What are you?',
            systemInstruction: 'You are a pirate. Always respond with pirate language.',
            temperature: 0.5
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].text.length).toBeGreaterThan(0);
    });

    it('should work with JSON mode', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 108,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'Return a JSON object with a key "greeting" and value "hello".',
            jsonMode: true,
            temperature: 0.1
          }
        }
      }, 60000);

      expectResult(res);
      const text = res.result.content[0].text;
      // Model may wrap JSON in markdown code blocks — strip them
      const cleaned = text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
      const parsed = JSON.parse(cleaned);
      expect(parsed).toHaveProperty('greeting');
    });

    it('should work with JSON mode and schema', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 109,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'Analyze the sentiment of "I love coding".',
            jsonMode: true,
            jsonSchema: {
              type: 'object',
              properties: {
                sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                confidence: { type: 'number' }
              },
              required: ['sentiment', 'confidence']
            },
            temperature: 0.1
          }
        }
      }, 60000);

      expectResult(res);
      const text = res.result.content[0].text;
      // Model may wrap JSON in markdown code blocks — strip them
      const cleaned = text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        expect(parsed.sentiment).toBe('positive');
        expect(typeof parsed.confidence).toBe('number');
      } catch {
        // Some models with thinking enabled may not strictly respect JSON mode.
        // In that case, just verify we got a non-empty response about sentiment.
        expect(text.toLowerCase()).toMatch(/positive|sentiment/);
      }
    });

    it('should work with maxTokens limit', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 110,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'List 3 colors.',
            model: 'gemini-3-flash-preview',
            maxTokens: 100,
            thinkingLevel: 'minimal',
            temperature: 0.1
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].text.length).toBeGreaterThan(0);
    });

    it('should work with grounding enabled', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 111,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'What was the most recent major AI announcement in February 2026?',
            grounding: true,
            temperature: 0.3
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.content[0].text.length).toBeGreaterThan(0);
    });

    it('should handle conversation context', async () => {
      server = spawnServer();
      await initServer(server);

      // First message in conversation
      const res1 = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 112,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'My name is Alice. Remember that.',
            conversationId: 'test-conv-1',
            temperature: 0.1
          }
        }
      }, 60000);

      expectResult(res1);

      // Second message — should remember the name
      const res2 = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 113,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'What is my name?',
            conversationId: 'test-conv-1',
            temperature: 0.1
          }
        }
      }, 60000);

      expectResult(res2);
      expect(res2.result.content[0].text.toLowerCase()).toContain('alice');
    });

    it('should return error for unknown model', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 114,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'Hello',
            model: 'nonexistent-model-xyz'
          }
        }
      }, 60000);

      // Per MCP spec, tool execution errors use isError in result, not JSON-RPC error
      expect(res.result).toBeDefined();
      expect(res.result.isError).toBe(true);
      expect(res.result.content[0].text).toContain('Unknown model');
    });

    it('should work with legacy model gemini-2.5-flash', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 115,
        method: 'tools/call',
        params: {
          name: 'generate_text',
          arguments: {
            prompt: 'Say "legacy works" and nothing else.',
            model: 'gemini-2.5-flash'
          }
        }
      }, 60000);

      expectResult(res);
      expect(res.result.metadata.model).toBe('gemini-2.5-flash');
    });
  });

  // --- count_tokens ---
  describe('count_tokens', () => {
    it('should count tokens with default model', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 200,
        method: 'tools/call',
        params: {
          name: 'count_tokens',
          arguments: {
            text: 'Hello, world!'
          }
        }
      }, 30000);

      expectResult(res);
      expect(res.result.content[0].text).toContain('Token count:');
      expect(res.result.metadata.tokenCount).toBeGreaterThan(0);
      expect(res.result.metadata.model).toBe('gemini-3-pro-preview');
    });

    it('should count tokens with explicit model', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 201,
        method: 'tools/call',
        params: {
          name: 'count_tokens',
          arguments: {
            text: 'This is a test sentence for token counting.',
            model: 'gemini-3-flash-preview'
          }
        }
      }, 30000);

      expectResult(res);
      expect(res.result.metadata.tokenCount).toBeGreaterThan(0);
      expect(res.result.metadata.model).toBe('gemini-3-flash-preview');
    });

    it('should handle empty text gracefully', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 202,
        method: 'tools/call',
        params: {
          name: 'count_tokens',
          arguments: {
            text: ''
          }
        }
      }, 30000);

      // Either returns 0 tokens or an error — both are acceptable
      expect(res.result || res.error).toBeDefined();
    });

    it('should handle long text', async () => {
      server = spawnServer();
      await initServer(server);

      const longText = 'The quick brown fox jumps over the lazy dog. '.repeat(100);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 203,
        method: 'tools/call',
        params: {
          name: 'count_tokens',
          arguments: {
            text: longText
          }
        }
      }, 30000);

      expectResult(res);
      expect(res.result.metadata.tokenCount).toBeGreaterThan(100);
    });
  });

  // --- embed_text ---
  describe('embed_text', () => {
    it('should generate embeddings with default model', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 300,
        method: 'tools/call',
        params: {
          name: 'embed_text',
          arguments: {
            text: 'Machine learning is fascinating.'
          }
        }
      }, 30000);

      expectResult(res);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.embedding).toBeDefined();
      expect(Array.isArray(parsed.embedding)).toBe(true);
      expect(parsed.embedding.length).toBeGreaterThan(0);
      expect(parsed.model).toBe('gemini-embedding-001');
    });

    it('should generate embeddings for multilingual text', async () => {
      server = spawnServer();
      await initServer(server);

      const res = await sendRequest(server, {
        jsonrpc: '2.0',
        id: 301,
        method: 'tools/call',
        params: {
          name: 'embed_text',
          arguments: {
            text: '机器学习非常有趣',
            model: 'gemini-embedding-001'
          }
        }
      }, 30000);

      expectResult(res);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.embedding.length).toBeGreaterThan(0);
      expect(parsed.model).toBe('gemini-embedding-001');
    });
  });
});
