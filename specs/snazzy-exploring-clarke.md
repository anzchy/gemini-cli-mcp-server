# Plan: 将 MCP Server 默认模型升级为 Gemini 3 Pro Preview

## Context

当前 MCP server 基于 Gemini 2.5 系列模型（默认 `gemini-2.5-flash`），Google 已发布 Gemini 3 系列模型，其中 `gemini-3-pro-preview` 在所有主要 AI 基准上显著超越 2.5 Pro。Gemini 2.0 系列将于 2026-03-31 停服。需要全面升级模型列表、默认模型、以及支持 Gemini 3 新引入的 API 参数（`thinkingLevel`、`mediaResolution`）。

### 关键 Gemini 3 模型信息（来自 Google 官方文档）

| 模型 ID | 输入上限 | 输出上限 | 特性 |
|---------|---------|---------|------|
| `gemini-3-pro-preview` | 1,048,576 (1M) | 65,536 (64K) | 最强推理、多模态、agentic、thinking |
| `gemini-3-flash-preview` | 1,048,576 (1M) | 65,536 (64K) | 速度与智能平衡、thinking |

### Gemini 3 新 API 参数

- **`thinkingLevel`**: 控制推理深度 — `minimal`、`low`、`medium`、`high`（默认）。Gemini 3 Pro 仅支持 `low` 和 `high`；Flash 支持全部四档。不能与旧的 `thinkingBudget` 混用。
- **`mediaResolution`**: 控制图片/视频输入的 token 分配 — `media_resolution_low`、`media_resolution_medium`（默认）、`media_resolution_high`。
- **温度默认值**: Google 强烈建议 Gemini 3 保持默认 `1.0`（不再是 0.7）。
- **`@google/genai` SDK**: 当前最新版本 1.41.0，已内置 `ThinkingLevel` 枚举和 `thinkingConfig` 支持。

---

## 修改计划

### Step 1: 更新 `GEMINI_MODELS` 模型列表

**文件**: `src/enhanced-stdio-server.ts` (L12-L61)

- 新增 Gemini 3 系列模型（置顶为最新推荐）：
  ```typescript
  'gemini-3-pro-preview': {
    description: 'Most capable reasoning model, state-of-the-art multimodal and agentic',
    features: ['thinking', 'function_calling', 'json_mode', 'grounding', 'system_instructions'],
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    thinking: true,
    thinkingLevels: ['low', 'high']
  },
  'gemini-3-flash-preview': {
    description: 'Best balance of speed, scale, and frontier intelligence',
    features: ['thinking', 'function_calling', 'json_mode', 'grounding', 'system_instructions'],
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    thinking: true,
    thinkingLevels: ['minimal', 'low', 'medium', 'high']
  }
  ```
- 移除已废弃的 2.0 系列模型（`gemini-2.0-flash`、`gemini-2.0-flash-lite`、`gemini-2.0-pro-experimental`）
- 将 2.5 系列标记为 Legacy models
- 移除 1.5 系列模型

### Step 2: 更新所有默认模型引用

**文件**: `src/enhanced-stdio-server.ts`

将所有 `gemini-2.5-flash` 默认值改为 `gemini-3-pro-preview`：

- `generate_text` tool schema default (L205)
- `analyze_image` tool schema enum + default (L294-295)
- `count_tokens` tool schema default (L319)
- `generateText()` 方法中的 fallback (L506)
- `analyzeImage()` 方法中的 fallback (L621)
- `countTokens()` 方法中的 fallback (L700)

### Step 3: 为 `generate_text` 添加 `thinkingLevel` 参数

**文件**: `src/enhanced-stdio-server.ts`

在 `getAvailableTools()` 的 `generate_text` inputSchema 中新增：
```typescript
thinkingLevel: {
  type: 'string',
  description: 'Thinking depth for Gemini 3 models (low, medium, high, minimal)',
  enum: ['minimal', 'low', 'medium', 'high']
}
```

在 `generateText()` 方法中，当模型支持 thinking 且用户传入 `thinkingLevel` 时，添加 `thinkingConfig` 到请求体：
```typescript
if (args.thinkingLevel && modelInfo.thinking) {
  requestBody.config = {
    ...requestBody.config,
    thinkingConfig: {
      thinkingLevel: args.thinkingLevel
    }
  };
}
```

### Step 4: 为 `analyze_image` 添加 `mediaResolution` 参数

**文件**: `src/enhanced-stdio-server.ts`

在 `analyze_image` inputSchema 中新增：
```typescript
mediaResolution: {
  type: 'string',
  description: 'Token allocation for image/video inputs',
  enum: ['media_resolution_low', 'media_resolution_medium', 'media_resolution_high']
}
```

在 `analyzeImage()` 方法中传入 mediaResolution config。

### Step 5: 更新 `analyze_image` 的 model enum

**文件**: `src/enhanced-stdio-server.ts` (L294)

将 vision 模型的 enum 从 `['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']` 更新为 `['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash']`。

### Step 6: 更新温度默认值

**文件**: `src/enhanced-stdio-server.ts`

- `generate_text` schema 的温度 default 从 `0.7` 改为 `1.0`
- `generateText()` 方法中的 fallback temperature 从 `0.7` 改为 `1.0`

### Step 7: 更新帮助文档和 prompt 描述

**文件**: `src/enhanced-stdio-server.ts`

- `getAvailablePrompts()` (L416): `code_review` 描述从 "Gemini 2.5 Pro" 改为 "Gemini 3 Pro"
- `getAvailablePrompts()` (L431): `explain_with_thinking` 描述更新为 Gemini 3
- `getHelpContent('overview')` (L930-956): 更新版本号、模型名称引用
- `getHelpContent('tools')` (L958-1018): 更新默认模型引用
- `getHelpContent('parameters')` (L1020-1059): 更新默认值说明，新增 thinkingLevel 和 mediaResolution 参数文档
- `getHelpContent('examples')` (L1061-1097): 更新示例中的模型名
- `getHelp()` 中的 'models' case (L1118-1157): 重写模型列表为 Gemini 3 系列

### Step 8: 更新 `gemini://capabilities` 资源内容

**文件**: `src/enhanced-stdio-server.ts` (L842-883)

将 "Thinking Models (2.5 Series)" 更新为 "Thinking Models (3.x Series)"，新增 thinkingLevel 和 mediaResolution 描述。

### Step 9: 更新 `initialize` 中的版本号

**文件**: `src/enhanced-stdio-server.ts` (L111)

将 `version: '4.1.0'` 更新为 `'5.0.0'`（主版本号变更，因为默认模型和 API 参数发生 breaking change）。

### Step 10: 更新 `package.json` 版本

**文件**: `package.json`

- 版本号从 `4.2.2` → `5.0.0`
- 更新 `@google/genai` 依赖到 `^1.41.0`（确保支持 thinkingConfig）

### Step 11: 更新 CLAUDE.md

**文件**: `CLAUDE.md`

更新模型列表和架构描述以反映 Gemini 3 变更。

---

## 验证步骤

1. `npm install` — 确保 `@google/genai` 更新到 >=1.41.0
2. `npm run build` — TypeScript 编译通过
3. `npm run lint` — 代码风格检查通过
4. `npm test` — 测试通过（注：现有测试引用的是 `handlers.ts` 和 `server.ts`，非当前主文件，可能需要适配或跳过）
5. 手动验证：设置 `GEMINI_API_KEY` 后通过 `npm run start` 启动，发送 `tools/list` 请求确认模型列表包含 Gemini 3 系列，发送 `generate_text` 请求确认默认使用 `gemini-3-pro-preview`
