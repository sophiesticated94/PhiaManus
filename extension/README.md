# PhiaManus — VS Code Extension

<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" />
  <img alt="VS Code" src="https://img.shields.io/badge/VS%20Code-≥1.80-007ACC?logo=visual-studio-code" />
  <img alt="Node" src="https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js" />
</p>

The backend **host engine** for the PhiaManus ecosystem. It runs as a native VS Code extension, spinning up a secure WebSocket server that streams your local repository to a connected mobile client (the Expo app).

---

## 📋 Prerequisites

- **VS Code** ≥ 1.80
- **Node.js** ≥ 18
- A **Gemini API Key** — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## 🚀 How to Run & Debug

```bash
cd extension
npm install
npm run compile    # Compiles TypeScript → out/
```

Then press **`F5`** in VS Code (with the `extension/` folder open) to launch the **Extension Development Host**.

In the new VS Code window that opens:

```
Ctrl+Shift+P (or Cmd+Shift+P on Mac) → "PhiaManus: Show Connection QR Code"
```

A webview panel will open showing the pairing QR code. The QR encodes a `phiamanus://pair?...` URL that the mobile app scans to establish a secure WebSocket session.

### Available npm scripts

| Script | Description |
|---|---|
| `npm run compile` | One-shot TypeScript compile to `out/` |
| `npm run watch` | Watch mode — recompile on every save |
| `npm run test` | Run Jest unit tests |
| `npm run package` | Bundle a `.vsix` for manual installation |

---

## 🔑 Gemini API Key Setup

The extension uses VS Code's **`SecretStorage`** API to store the Gemini API key — it is encrypted by the OS keychain and never written to disk or sent over the network.

**First-time setup**: The key is requested automatically the first time you trigger an AI action (code generation or commit message generation). A password input box appears in VS Code:

> *"Enter your Gemini API Key"*

Enter your key once. It is persisted across VS Code restarts. If you need to update it, clear it via the VS Code developer console:
```typescript
context.secrets.delete('gemini_api_key');
```

---

## 🏗️ Source Files

| File | Responsibility |
|---|---|
| `extension.ts` | Extension entry point. Generates `pairId` (UUID) and `authToken` (64-byte random hex) on activation. Starts the WebSocket server and shows the pairing QR webview. |
| `WebSocketServer.ts` | The core message router. Validates auth on WebSocket upgrade, then dispatches all incoming `{ type }` messages to the appropriate service. Manages the in-memory `stagedPatches` Map for the two-phase commit diffing flow. |
| `WorkspaceManager.ts` | Filesystem access layer. Builds the `FileNode` tree, lazy-loads large directories, reads file contents. **Enforces path sanitization** — all requested paths are resolved and validated against `workspaceRoot` to prevent path traversal. |
| `GeminiService.ts` | Wraps `@google/generative-ai`. Exposes `generateStream()` (streams AI code generation token-by-token) and `generateCommitMessage()` (returns `{ title, description }` from a staged diff). Uses `gemini-2.5-flash`. |
| `GitService.ts` | Wraps `simple-git`. Exposes: `getStatus`, `getBranches`, `getLog` (last 50), `stageFile`, `unstageFile`, `commit`, `push`, `pull`, `getDiff` (staged diff). |
| `SupabaseFallback.ts` | Supabase Realtime relay for cross-network scenarios. Bridges the mobile client to the extension when a direct P2P WebSocket isn't reachable. |
| `WebviewRenderer.ts` | Renders the QR code inside a VS Code Webview panel using an HTML canvas. |

---

## 🌐 WebSocket Protocol

The server listens on port `38475` by default and auto-increments if the port is taken (`EADDRINUSE`). All messages are JSON with a `type` field.

### Authentication

On WebSocket upgrade, the server checks the `token` query parameter:
```
ws://<host-ip>:<port>?token=<64-byte-hex>
```
An invalid or missing token closes the socket with `HTTP 401`.

### Incoming Message Types (Client → Extension)

| `type` | Fields | Action |
|---|---|---|
| `auth` | `token` | Initial handshake (validated on upgrade; this message is a no-op) |
| `REQUEST_FS_TREE` | — | Returns the full `FileNode` tree (`FS_TREE_RESPONSE`) |
| `REQUEST_DIR_CHILDREN` | `path: string` | Lazy-loads a large directory's children (`DIR_CHILDREN_RESPONSE`) |
| `REQUEST_FILE_READ` | `path: string` | Reads and returns file contents (`FILE_READ_RESPONSE`) |
| `PROMPT_EXECUTE` | `prompt: string`, `path: string` | Streams AI code generation (`DELTA_CHUNK` events), then sends `PATCH_PROPOSAL` |
| `PATCH_APPROVE` | `patchId: string` | Writes the approved patch to the file via `vscode.WorkspaceEdit` |
| `PATCH_REJECT` | `patchId: string` | Discards the staged patch |
| `REQUEST_GIT_STATUS` | — | Returns `simple-git` status object |
| `REQUEST_GIT_BRANCHES` | — | Returns local branches + current branch |
| `REQUEST_GIT_LOG` | — | Returns last 50 commits |
| `EXECUTE_GIT_ACTION` | `action: 'stage'\|'unstage'\|'commit'\|'push'\|'pull'`, `file?: string`, `message?: string` | Executes the git action; always sends an updated `GIT_STATUS_RESPONSE` afterward |
| `GENERATE_COMMIT_MESSAGE` | — | Reads staged diff, calls Gemini, returns `COMMIT_MESSAGE_RESPONSE` |

### Outgoing Message Types (Extension → Client)

| `type` | Description |
|---|---|
| `FS_TREE_RESPONSE` | `{ payload: FileNode }` — full workspace tree |
| `DIR_CHILDREN_RESPONSE` | `{ path, payload: FileNode[] }` — lazy-loaded children |
| `FILE_READ_RESPONSE` | `{ path, content: string }` |
| `DELTA_CHUNK` | `{ chunk: string }` — one streaming AI token |
| `PATCH_PROPOSAL` | `{ patchId, path, diff: DiffLine[] }` — structured diff for review |
| `PATCH_APPLIED` | `{ patchId, success: boolean }` |
| `GIT_STATUS_RESPONSE` | `{ payload: StatusResult }` from `simple-git` |
| `GIT_BRANCHES_RESPONSE` | `{ payload: BranchSummary }` |
| `GIT_LOG_RESPONSE` | `{ payload: LogResult }` |
| `COMMIT_MESSAGE_RESPONSE` | `{ payload: { title: string, description: string } }` |
| `ERROR` | `{ message: string }` — sent on any unhandled exception |

---

## 🤖 AI: Two-Phase Commit Diffing

When a `PROMPT_EXECUTE` message is received:

1. The original file is read from disk.
2. `GeminiService.generateStream()` streams the new file content token-by-token (`DELTA_CHUNK` events) to the client.
3. When streaming completes, `diffLines(original, newContent)` computes a structured diff.
4. If changes exist, a `patchId` (UUID) is stored in the in-memory `stagedPatches` Map alongside the absolute file path and new content.
5. `PATCH_PROPOSAL` is sent to the client with the structured diff.
6. The client renders the diff and presents **Approve / Reject** buttons.
7. `PATCH_APPROVE` → `vscode.WorkspaceEdit` applies the full file rewrite and saves. `PATCH_REJECT` → patch is dropped.

---

## 🔐 Security

- **Token validation**: 64-byte random hex token, generated fresh on every extension activation, validated on every WebSocket upgrade handshake.
- **Path traversal protection**: `WorkspaceManager` resolves all paths with `path.resolve()` and checks `absolutePath.startsWith(workspaceRoot)` before any read.
- **`node_modules` and `.git` excluded**: Automatically skipped during all workspace tree traversals.
- **Gemini key in SecretStorage**: Never serialized to disk, never transmitted over any connection.

---

## 🧪 Testing

```bash
npm run test
```

Uses **Jest** + **`ts-jest`** with the `vscode` module mocked.

| File | What it covers |
|---|---|
| `src/WorkspaceManager.test.ts` | Tree building, path sanitization (traversal rejection), large directory detection, file read |
| `src/GitService.test.ts` | All `GitService` methods with mocked `simple-git` |
| `src/GeminiService.test.ts` | `generateStream` token streaming, `generateCommitMessage` JSON parsing + fallback |

> [!NOTE]
> `jest.config.js` sets `modulePathIgnorePatterns: ['<rootDir>/out/']` to prevent Jest from accidentally picking up the compiled JavaScript output instead of the TypeScript source.

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `ws` | WebSocket server |
| `@google/generative-ai` | Gemini API SDK (streaming + one-shot) |
| `simple-git` | Git operations |
| `diff` | Unified diff generation (`diffLines`) |
| `vscode` (peer) | VS Code Extension API |
