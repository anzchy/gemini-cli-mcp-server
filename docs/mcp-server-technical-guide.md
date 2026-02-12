# MCP Server Technical Guide: What Happens Behind the Scenes

This guide traces every step that occurs when a new user adds this configuration and their MCP client starts for the first time:

```json
"gemini": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "github:anzchy/gemini-cli-mcp-server"],
  "env": {
    "GEMINI_API_KEY": "your_api_key_here"
  }
}
```

---

## 1. Configuration Parsing

When the MCP client (Claude Desktop, Cursor, Claude Code, etc.) starts, it reads its configuration file and parses the `mcpServers` object. Each key becomes a named MCP server. For the `"gemini"` entry, the client extracts five pieces of information:

| Field | Value | Meaning |
|-------|-------|---------|
| `type` | `"stdio"` | Communication via stdin/stdout (as opposed to SSE or WebSocket) |
| `command` | `"npx"` | The executable to spawn |
| `args` | `["-y", "github:anzchy/gemini-cli-mcp-server"]` | Arguments passed to the command |
| `env` | `{"GEMINI_API_KEY": "..."}` | Environment variables injected into the spawned process |

The client will spawn a child process equivalent to running:

```bash
GEMINI_API_KEY=your_api_key_here npx -y github:anzchy/gemini-cli-mcp-server
```

---

## 2. npx Execution

### What is npx?

`npx` is a command-line tool bundled with npm (since npm 5.2+). Its primary purpose is to **execute npm packages without permanently installing them**. It creates a temporary environment, installs the requested package, runs its binary, and (conceptually) cleans up afterward.

### The `-y` Flag

The `-y` (or `--yes`) flag **auto-confirms the installation prompt**. Without it, npx would display:

```
Need to install the following packages:
  github:anzchy/gemini-cli-mcp-server
Ok to proceed? (y)
```

Since MCP servers run as background processes with no interactive terminal, `-y` is mandatory — there's no human to type "y". Without it, npx would hang forever waiting for confirmation, and the MCP client would timeout.

### The `github:` Protocol Specifier

This is the critical part. The string `github:anzchy/gemini-cli-mcp-server` is an **npm package specifier** that tells npm to fetch the package directly from a GitHub repository instead of the npm registry.

npm supports several specifier formats:

```
@anzchy/mcp-server-gemini              → npm registry (by package name)
@anzchy/mcp-server-gemini@5.0.0        → npm registry (specific version)
github:anzchy/gemini-cli-mcp-server        → GitHub repo (default branch)
github:anzchy/gemini-cli-mcp-server#main   → GitHub repo (specific branch)
github:anzchy/gemini-cli-mcp-server#v5.0.0 → GitHub repo (specific tag)
github:anzchy/gemini-cli-mcp-server#abc123 → GitHub repo (specific commit)
```

Under the hood, `github:user/repo` is shorthand for:

```
git+https://github.com/anzchy/gemini-cli-mcp-server.git
```

---

## 3. Package Resolution and Installation (First Run)

This is where the first-time experience differs significantly from subsequent runs. On the first invocation, npx must fetch, build, and cache the package. Here is the full chain:

### Step 3a: npx Creates a Temporary Environment

npx creates (or reuses) a directory under the npm cache for temporary package installs:

```
~/.npm/_npx/<hash>/
```

The `<hash>` is derived from the package specifier. This becomes the working directory for the installation.

### Step 3b: npm Resolves the GitHub URL

npm translates `github:anzchy/gemini-cli-mcp-server` into a Git operation:

```
git ls-remote https://github.com/anzchy/gemini-cli-mcp-server.git
```

This fetches the list of refs (branches, tags) from the remote. Since no ref was specified (no `#branch` or `#tag` suffix), npm resolves to the **default branch** (typically `master` or `main`).

### Step 3c: npm Clones and Checks Out the Repository

npm fetches the repository contents. Depending on npm version, this may be:
- A full `git clone` to a temporary directory
- A shallow clone (`--depth 1`) for efficiency
- A tarball download via GitHub's API (`/repos/anzchy/gemini-cli-mcp-server/tarball/master`)

The result: a local copy of the full source tree, including `src/`, `package.json`, `tsconfig.json`, etc.

### Step 3d: npm Installs Dependencies in the Clone

npm runs `npm install` **inside the cloned repo**. Because the clone is treated as the project root:

- **Both `dependencies` AND `devDependencies` are installed**
- This is critical because `devDependencies` includes TypeScript (`typescript@^5.3.3`), which is needed for the build step

From `package.json`:

```json
{
  "dependencies": {
    "@google/genai": "^1.41.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    ...
  }
}
```

### Step 3e: The `prepare` Lifecycle Script Runs

After installing dependencies, npm automatically runs the `prepare` lifecycle script. This is a special npm lifecycle hook that runs:
- After `npm install` on the local package
- Before `npm pack` (which creates the installable tarball)

From `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  }
}
```

So the chain is: `prepare` → `npm run build` → `tsc`

**This is where TypeScript compilation happens.** The TypeScript compiler reads `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true
  }
}
```

It compiles `src/enhanced-stdio-server.ts` and `src/types.ts` into JavaScript files in `dist/`:

```
src/enhanced-stdio-server.ts  →  dist/enhanced-stdio-server.js
src/types.ts                  →  dist/types.js
```

**Why is this necessary?** The `dist/` directory is listed in `.gitignore`, meaning it is NOT committed to the Git repository. The source repo contains only TypeScript — the JavaScript must be generated during installation.

### Step 3f: npm Packs the Result

After `prepare` completes, npm runs `npm pack` on the built project. The `files` field in `package.json` controls what gets included in the tarball:

```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ]
}
```

The resulting tarball contains:
```
package/
├── package.json
├── dist/
│   ├── enhanced-stdio-server.js    ← compiled server (with #!/usr/bin/env node shebang)
│   ├── enhanced-stdio-server.js.map
│   ├── types.js
│   └── types.js.map
├── README.md
├── LICENSE
└── CHANGELOG.md
```

Note: `node_modules/`, `src/`, `tsconfig.json`, and test files are **excluded** from the tarball.

### Step 3g: npm Installs the Tarball into the npx Cache

npm installs the packed tarball into the npx cache directory (`~/.npm/_npx/<hash>/`). During this install:
- Only `dependencies` are installed (not `devDependencies`), since the package is now a dependency, not the project root
- So only `@google/genai` is installed
- The `bin` field from `package.json` is linked:

```json
{
  "bin": {
    "@anzchy/mcp-server-gemini": "./dist/enhanced-stdio-server.js"
  }
}
```

npm creates a symlink (or cmd shim on Windows):

```
~/.npm/_npx/<hash>/node_modules/.bin/@anzchy/mcp-server-gemini
  → ~/.npm/_npx/<hash>/node_modules/@anzchy/mcp-server-gemini/dist/enhanced-stdio-server.js
```

---

## 4. Binary Execution

### Step 4a: npx Locates and Runs the Binary

npx looks up the binary name from the package's `bin` field and executes it. The entry point is `dist/enhanced-stdio-server.js`, which starts with:

```javascript
#!/usr/bin/env node
```

This **shebang line** tells the OS to execute the file using Node.js. The OS:
1. Reads the shebang: `#!/usr/bin/env node`
2. Runs `/usr/bin/env node` which finds `node` in `$PATH`
3. Node.js loads and executes `enhanced-stdio-server.js`

### Step 4b: Environment Variables Are Injected

Before spawning the process, the MCP client sets the environment variables from the `env` config:

```json
{
  "GEMINI_API_KEY": "your_api_key_here"
}
```

The MCP client calls something equivalent to:

```javascript
const child = spawn('npx', ['-y', 'github:anzchy/gemini-cli-mcp-server'], {
  env: { ...process.env, GEMINI_API_KEY: 'your_api_key_here' },
  stdio: ['pipe', 'pipe', 'pipe']  // stdin, stdout, stderr all piped
});
```

The `GEMINI_API_KEY` is available to the server process via `process.env.GEMINI_API_KEY`.

---

## 5. Server Startup Sequence

Once Node.js begins executing `enhanced-stdio-server.js`, the following happens in order:

### Step 5a: Stdin Encoding Configuration

```javascript
if (process.stdin.setEncoding) {
  process.stdin.setEncoding('utf8');
}
```

Sets stdin to UTF-8 mode so incoming bytes are decoded as strings rather than raw Buffer objects.

### Step 5b: API Key Validation

```javascript
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}
```

If the API key is missing, the server writes an error to **stderr** and exits with code 1. The MCP client would see this as a failed server startup.

### Step 5c: Server Instantiation

```javascript
new EnhancedStdioMCPServer(apiKey);
```

The constructor does two things:

1. **Initializes the Gemini SDK client:**
   ```javascript
   this.genAI = new GoogleGenAI({ apiKey });
   ```

2. **Sets up the stdio interface** by calling `setupStdioInterface()`.

### Step 5d: Stdio Interface Setup

```javascript
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
  crlfDelay: Infinity
});
```

Node.js `readline` is configured to:
- Read from `process.stdin` (piped from the MCP client)
- `terminal: false` — disables terminal-specific behavior (no prompt, no ANSI escapes)
- `crlfDelay: Infinity` — treats `\r\n` as a single line ending

The server is now **listening for input**. Each line received on stdin is parsed as a JSON-RPC 2.0 message:

```javascript
rl.on('line', (line) => {
  if (line.trim()) {
    const request = JSON.parse(line);
    this.handleRequest(request);
  }
});
```

---

## 6. The MCP Protocol Handshake

At this point the server is running and waiting. The MCP client initiates the protocol handshake by sending the first message.

### Step 6a: Client Sends `initialize`

The MCP client writes a JSON-RPC message to the server's stdin:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"claude-desktop","version":"1.0.0"}}}
```

### Step 6b: Server Responds

The server's `handleRequest` routes to the `initialize` handler, which responds on stdout:

```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","serverInfo":{"name":"@anzchy/mcp-server-gemini-enhanced","version":"5.0.0"},"capabilities":{"tools":{},"resources":{},"prompts":{}}}}
```

### Step 6c: Client Discovers Tools

The client sends `tools/list` to learn what the server offers. The server responds with all 6 tool definitions (generate_text, analyze_image, count_tokens, list_models, embed_text, get_help) including their JSON Schema `inputSchema`.

This is the point where the `oneOf` schema issue would cause problems — Claude's API rejects tool schemas that use `oneOf`/`allOf`/`anyOf` at the top level.

### Step 6d: Ready

After initialization, the server sits idle, waiting for `tools/call` requests on stdin. Each request triggers a Gemini API call, and the result is written back to stdout as a JSON-RPC response.

---

## 7. The stdio Transport in Detail

The `"type": "stdio"` transport is a critical design choice. Here's how data flows:

```
┌──────────────┐          stdin (pipe)          ┌──────────────────┐
│              │  ──── JSON-RPC request ──────>  │                  │
│  MCP Client  │                                 │  MCP Server      │
│  (Claude,    │  <─── JSON-RPC response ──────  │  (this project)  │
│   Cursor)    │          stdout (pipe)          │                  │
│              │                                 │                  │
│              │  <─── debug/error logs ───────  │                  │
│              │          stderr (pipe)          │                  │
└──────────────┘                                 └──────────────────┘
                                                        │
                                                        │ HTTPS
                                                        ▼
                                                 ┌──────────────┐
                                                 │  Gemini API  │
                                                 └──────────────┘
```

**Critical rule**: stdout is exclusively for JSON-RPC protocol messages. Every line must be valid JSON. Any stray output (e.g., a `console.log()`) would corrupt the protocol and crash the connection. That's why the server uses `process.stderr.write()` and `console.error()` for all debug logging — stderr is separate and doesn't interfere with the protocol.

Each message is exactly one line (line-delimited JSON):
- **Request**: `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{...}}\n`
- **Response**: `{"jsonrpc":"2.0","id":1,"result":{...}}\n`

The `sendResponse()` method enforces this:

```javascript
private sendResponse(response: MCPResponse) {
  const responseStr = JSON.stringify(response);
  process.stdout.write(responseStr + '\n');
}
```

`JSON.stringify()` guarantees no internal newlines. The trailing `\n` marks the end of the message.

---

## 8. Subsequent Runs (Caching)

On subsequent MCP client startups, the behavior changes depending on npx's cache state:

### Cache Hit (Common Case)

If the package is already in `~/.npm/_npx/<hash>/`, npx skips the entire download/build process and directly executes the cached binary. Startup is fast — just spawning Node.js and running the script.

### Cache Miss or Staleness

The `github:` specifier without a pinned commit/tag means npm resolves to the **latest commit on the default branch**. Behavior varies by npm version:

- **npm 7-9**: May re-resolve the git ref on each run, triggering a re-fetch if the remote HEAD has changed
- **npm 10+**: More aggressive caching; may reuse a previously resolved commit

This unpredictability is one reason why using the **npm registry** specifier (`npx -y @anzchy/mcp-server-gemini`) is more reliable for end users — npm versions are immutable and cached deterministically.

### Clearing the Cache

If something goes wrong, users can clear the npx cache:

```bash
# Remove all npx cached packages
rm -rf ~/.npm/_npx/

# Or clear the entire npm cache
npm cache clean --force
```

---

## 9. Comparison: `github:` vs npm Registry

| Aspect | `github:anzchy/gemini-cli-mcp-server` | `@anzchy/mcp-server-gemini` |
|--------|----------------------------------------|---------------------|
| **Source** | Git repository (GitHub) | npm registry |
| **First-run speed** | Slow (clone + install devDeps + compile TypeScript) | Fast (download pre-built tarball) |
| **Build step** | Required (`prepare` script compiles TS → JS) | Not needed (pre-built `dist/` included) |
| **DevDependencies** | Must be installed for build | Never installed |
| **Version pinning** | Defaults to latest commit; pin with `#tag` | Exact version via `@5.0.0` |
| **Reproducibility** | Can change between runs (new commits) | Immutable once published |
| **Offline** | Fails (needs git access) | Works if cached |
| **Use case** | Development, bleeding-edge | Production, end users |

### Recommendation for End Users

For the most reliable experience, use the npm package name:

```json
{
  "args": ["-y", "@anzchy/mcp-server-gemini"]
}
```

For pinning to a specific GitHub version:

```json
{
  "args": ["-y", "github:anzchy/gemini-cli-mcp-server#v5.0.0"]
}
```

---

## 10. Failure Modes

Understanding what can go wrong at each stage:

| Stage | Failure | Symptom |
|-------|---------|---------|
| npx install | No internet / GitHub down | MCP client reports "server failed to start" |
| git clone | Repository is private or renamed | npm error: "Could not resolve" |
| npm install (devDeps) | npm registry down | `prepare` script fails (tsc not found) |
| prepare (tsc) | TypeScript compilation error | Build fails, no `dist/` output |
| Binary execution | Wrong Node.js version | Syntax errors (ES2022 features unsupported) |
| API key | Missing or invalid `GEMINI_API_KEY` | Server exits with code 1 |
| Protocol | `oneOf`/`allOf`/`anyOf` in tool schema | Client rejects tool definitions (400 error) |
| Runtime | Gemini API quota exceeded | Tool call returns error response |

---

## 11. Full Timeline Summary

Here's the complete sequence from config to first API call:

```
1.  MCP client starts
2.  Reads config file → finds "gemini" server entry
3.  Spawns: GEMINI_API_KEY=... npx -y github:anzchy/gemini-cli-mcp-server
4.  npx checks cache → miss on first run
5.  npm resolves github:anzchy/gemini-cli-mcp-server → git URL
6.  npm clones the repository (shallow)
7.  npm install in clone (dependencies + devDependencies)
8.  npm runs prepare → npm run build → tsc
9.  TypeScript compiles: src/*.ts → dist/*.js
10. npm packs dist/ + package.json into tarball
11. npm installs tarball in ~/.npm/_npx/<hash>/
12. npm installs production dependency: @google/genai
13. npx resolves bin → dist/enhanced-stdio-server.js
14. OS reads shebang: #!/usr/bin/env node
15. Node.js starts executing the server
16. Server reads GEMINI_API_KEY from process.env
17. Server initializes GoogleGenAI client
18. Server creates readline interface on stdin
19. Server is now listening for JSON-RPC messages
20. MCP client sends: {"method": "initialize", ...}
21. Server responds with protocol version and capabilities
22. MCP client sends: {"method": "tools/list"}
23. Server responds with 6 tool definitions
24. Handshake complete — server is ready for tool calls
25. User asks a question → client sends: {"method": "tools/call", ...}
26. Server calls Gemini API via @google/genai SDK
27. Server writes JSON-RPC response to stdout
28. MCP client receives the result and displays it to the user
```

---

## 12. Publishing to npm

For end users to install via `npx -y @anzchy/mcp-server-gemini` (the fast, reliable path), the package must be published to the npm registry. Here's the full process.

### Prerequisites

1. **Create an npm account** at https://www.npmjs.com/signup (if you don't have one)
2. **Log in** from the terminal:
   ```bash
   npm login
   ```
   This stores an auth token in `~/.npmrc`.

3. **Verify your identity**:
   ```bash
   npm whoami
   # Should print your npm username
   ```

### What Gets Published

The `files` field in `package.json` controls exactly what ends up in the npm tarball:

```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ]
}
```

Additionally, `.npmignore` explicitly excludes source files, tests, docs, and config:

```
src/            ← TypeScript source (not needed — dist/ has compiled JS)
*.ts            ← Type definitions
docs/           ← Documentation
__tests__/      ← Test files
tsconfig.json   ← Build config
jest.config.*   ← Test config
.github/        ← CI/CD
```

The published package is small and self-contained: just the compiled JavaScript, the Gemini SDK dependency, and essential docs.

### Publishing Steps

```bash
# 1. Make sure you're on a clean, up-to-date branch
git status  # should be clean

# 2. Run tests to verify everything works
npm test

# 3. Build the project (also runs automatically via "prepare")
npm run build

# 4. Preview what will be published (dry run)
npm pack --dry-run
```

The `npm pack --dry-run` output shows exactly which files will be in the tarball:

```
npm notice Tarball Contents
npm notice 42.1kB dist/enhanced-stdio-server.js
npm notice 1.2kB  dist/types.js
npm notice 5.0kB  README.md
npm notice ...
npm notice Tarball Details
npm notice name:          @anzchy/mcp-server-gemini
npm notice version:       5.0.0
npm notice package size:  12.3 kB
npm notice total files:   6
```

**Review this carefully.** Make sure:
- No `.env`, credentials, or secrets are included
- `dist/` files are present (build succeeded)
- `src/` and test files are excluded
- Package size is reasonable

```bash
# 5. Publish to npm
npm publish
```

If this is the first time publishing this package name, it will be created on the registry. If the version already exists, npm will reject the publish — you must bump the version first.

### Version Bumping

npm follows [semver](https://semver.org/). Use `npm version` to bump and create a git tag:

```bash
# Patch release (5.0.0 → 5.0.1): bug fixes
npm version patch

# Minor release (5.0.0 → 5.1.0): new features, backwards compatible
npm version minor

# Major release (5.0.0 → 6.0.0): breaking changes
npm version major
```

`npm version` does three things:
1. Updates `version` in `package.json`
2. Creates a git commit: `v5.0.1`
3. Creates a git tag: `v5.0.1`

Then publish:

```bash
npm publish
git push && git push --tags
```

### The Full Release Workflow

```bash
# 1. Ensure all changes are committed and tests pass
git status
npm test
npm run lint

# 2. Bump version (choose patch/minor/major as appropriate)
npm version patch -m "release: %s"

# 3. Publish to npm
npm publish

# 4. Push commits and tags to GitHub
git push && git push --tags
```

After publishing, users immediately get the new version:

```bash
# Users run this — npm fetches the latest published version
npx -y @anzchy/mcp-server-gemini
```

### Verifying the Published Package

```bash
# Check the latest version on npm
npm view @anzchy/mcp-server-gemini version

# See all published versions
npm view @anzchy/mcp-server-gemini versions --json

# See what's in the published package
npm pack @anzchy/mcp-server-gemini --dry-run

# Install and test locally (simulates what users get)
npx -y @anzchy/mcp-server-gemini --help
```

### How npm Registry Differs from GitHub Install

When a user runs `npx -y @anzchy/mcp-server-gemini`:

```
1. npx asks npm to resolve "@anzchy/mcp-server-gemini"
2. npm queries https://registry.npmjs.org/@anzchy/mcp-server-gemini
3. npm downloads the pre-built tarball (contains dist/, no src/)
4. npm installs it in ~/.npm/_npx/<hash>/
5. npm installs only production dependencies (@google/genai)
6. npx runs the binary immediately
```

No git clone. No TypeScript compilation. No devDependencies. This is why the npm registry path is faster and more reliable than `github:`.

### Scoped vs Unscoped Package Names

The current package name is **unscoped**: `@anzchy/mcp-server-gemini`. This means anyone with an npm account can install it without a namespace prefix.

If the name were taken, you could publish under a scope:

```json
{
  "name": "@anzchy/@anzchy/mcp-server-gemini"
}
```

Scoped packages default to **private** on npm. To publish publicly:

```bash
npm publish --access public
```

### Automating Releases with GitHub Actions (Optional)

For automated publishing on git tag push:

```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Set `NPM_TOKEN` in your GitHub repository secrets (Settings → Secrets → Actions). Generate the token at https://www.npmjs.com/settings/~/tokens (choose "Automation" type).

### Updating the Docs After Publishing

Once the package is on npm, update the recommended install command in all documentation from:

```json
"args": ["-y", "github:anzchy/gemini-cli-mcp-server"]
```

to:

```json
"args": ["-y", "@anzchy/mcp-server-gemini"]
```

Keep the `github:` URL as a secondary option for developers who want the bleeding-edge version.
