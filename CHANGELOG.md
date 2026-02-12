# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0] - 2026-02-12

### Added
- **Gemini 3 series models**: `gemini-3-pro-preview` (default) and `gemini-3-flash-preview`
- `thinkingLevel` parameter for `generate_text` — configurable thinking depth (minimal/low/medium/high)
- `mediaResolution` parameter for `analyze_image` — control token allocation for images (low/medium/high)
- `gemini-embedding-001` as the new default embedding model
- Comprehensive test suite (46 tests) with real Gemini API integration tests covering all tools and parameter combinations

### Changed
- **BREAKING**: Default model changed from `gemini-2.5-flash` to `gemini-3-pro-preview`
- **BREAKING**: Default temperature changed from `0.7` to `1.0` (Google's recommendation for Gemini 3)
- **BREAKING**: Default embedding model changed from `text-embedding-004` to `gemini-embedding-001`
- Updated `@google/genai` dependency from `^1.8.0` to `^1.41.0` (required for `thinkingConfig` support)
- Server version bumped to `5.0.0`
- All help content, resources, and prompts updated for Gemini 3
- `analyze_image` vision model enum now includes Gemini 3 models
- Temperature fallback uses nullish coalescing (`??`) to allow explicit `temperature: 0`

### Removed
- Deprecated Gemini 2.0 series models (`gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-2.0-pro-experimental`) — EOL 2026-03-31
- Deprecated Gemini 1.5 series models (`gemini-1.5-pro`, `gemini-1.5-flash`)
- Old dead test files referencing removed `handlers.ts` and `server.ts` modules

## [4.2.2] - 2025-07-08

### Fixed
- Fixed image truncation issue by adding crlfDelay: Infinity to readline interface
- Added proper UTF-8 encoding for stdin to handle large Base64 data
- Improved error handling and debugging for image analysis
- Added logging for Base64 data size to help diagnose issues

### Changed
- Enhanced error messages for image analysis failures
- Added input validation for image analysis parameters

## [4.2.1] - 2025-07-08

### Fixed
- Fixed conversation context role validation error by adding 'user' role to all user messages
- Added proper role field to generate_text, analyze_image, and count_tokens API calls
- Resolved "Invalid role" error when using conversation_id feature

## [4.2.0] - 2025-07-08

### Changed
- Cleaned up repository by removing legacy WebSocket implementation files
- Removed unused dependencies (ws and @types/ws)
- Streamlined codebase to only include stdio-based MCP implementation

### Security
- Performed comprehensive security audit
- Verified no exposed secrets or API keys
- Confirmed all dependencies are vulnerability-free
- API keys only accessed via environment variables

### Removed
- `src/server.ts` - Legacy WebSocket server
- `src/index.ts` - Old entry point
- `src/handlers.ts` - Unused handler functions
- `src/protocol.ts` - Legacy protocol definitions
- `src/stdio-server.ts` - Superseded by enhanced-stdio-server
- WebSocket dependencies

## [4.1.0] - 2025-07-07

### Added
- Self-documenting `get_help` tool for discovering features within MCP clients
- New MCP resources for documentation access:
  - `gemini://help/usage` - Usage guide
  - `gemini://help/parameters` - Parameters reference  
  - `gemini://help/examples` - Example usage patterns
- Support for `resources/read` to access documentation programmatically
- Updated documentation to support all MCP clients (not just Claude Desktop)

### Changed
- Updated README to include setup instructions for multiple MCP clients
- Enhanced documentation with comprehensive parameter references

## [4.0.0] - 2025-07-07

### Added
- Support for all latest Gemini models (as of July 2025):
  - Gemini 2.5 series with thinking capabilities
  - Gemini 2.0 series including pro-experimental
  - Legacy 1.5 models for compatibility
- 5 powerful tools:
  - `generate_text` - Advanced text generation with all features
  - `analyze_image` - Vision analysis capabilities
  - `count_tokens` - Token counting for cost estimation
  - `list_models` - Model discovery with filtering
  - `embed_text` - Text embeddings for semantic search
- Advanced features:
  - JSON mode with schema validation
  - Google Search grounding for current information
  - System instructions for behavior control
  - Conversation memory with session IDs
  - Customizable safety settings
  - Temperature, topK, topP controls
- 3 MCP prompts for common tasks
- 2 MCP resources for model and capability information

### Changed
- Complete rewrite to use stdio-based MCP protocol
- Switched to newline-delimited JSON (not Content-Length headers)
- Updated to new @google/genai SDK

## [3.0.0] - 2025-07-07

### Changed
- Migrated from WebSocket to stdio-based communication
- Fixed MCP protocol implementation based on official spec

## [2.0.0] - 2025-07-07

### Changed
- Updated from deprecated @google/generative-ai to @google/genai SDK
- Fixed TypeScript ESM configuration
- Added proper .js extensions to imports

## [1.0.0] - 2024-12-15

### Added
- Initial release with WebSocket-based MCP server
- Basic Gemini text generation support
- TypeScript implementation