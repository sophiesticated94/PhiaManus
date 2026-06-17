<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/terminal.svg" width="100" />
  <h1>PhiaManus</h1>
  <p><b>A high-performance remote IDE bridge for native mobile development.</b></p>
  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" />
    <img alt="React Native" src="https://img.shields.io/badge/React%20Native-0.85-61DAFB?logo=react" />
    <img alt="Expo" src="https://img.shields.io/badge/Expo-56-000020?logo=expo" />
    <img alt="VS Code" src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visual-studio-code" />
  </p>
</div>

<br />

PhiaManus is a two-part architecture consisting of a **VS Code Extension** and a **Native React Native / Expo Client**. It transforms your mobile device into a fully-functional, real-time IDE interface for your host machine — with live file browsing, AI pair programming, and native Git operations, all running over a secure WebSocket connection.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Real-Time Workspace Streaming** | View your entire host machine's directory tree rendered via native mobile UI components. Large directories are lazy-loaded on demand. |
| **AI Pair Programming (Gemini)** | Request code changes from your phone. The extension pipes your prompt + active file context through `gemini-2.5-flash`, streaming tokens live. |
| **Two-Phase Commit Diffing** | AI code changes are presented as Unified Diffs natively on your mobile device. Review, Approve, or Reject with one tap. |
| **Native Git Integration** | Stage/unstage files, commit, push, pull, browse commit history and branches — all from the mobile Git screen. |
| **AI Magic Wand** | Tap ✨ to auto-generate a commit title and description by sending your staged diff to Gemini. |
| **Secure QR Pairing** | A one-time 64-byte random token is encoded into a QR code. The mobile client scans it to authenticate. Token is never reused. |
| **Supabase Realtime Fallback** | If P2P WebSocket isn't available (different networks), the app falls back to end-to-end encrypted Supabase Realtime channels automatically. |

---

## 🏗️ Architecture

```
PhiaManus/
├── extension/          # VS Code Extension (TypeScript)
│   └── src/
│       ├── extension.ts          # Activation, QR payload generation
│       ├── WebSocketServer.ts    # WS server + all message routing
│       ├── WorkspaceManager.ts   # Filesystem access & path sanitization
│       ├── GeminiService.ts      # Gemini API streaming & commit msg gen
│       ├── GitService.ts         # simple-git wrapper (status/stage/log...)
│       ├── SupabaseFallback.ts   # Supabase Realtime relay
│       └── WebviewRenderer.ts    # QR code webview panel
│
└── client/             # Expo React Native App (TypeScript / TSX)
    └── src/
        ├── screens/
        │   ├── WorkspaceScreen.tsx   # File tabs + AI streaming panel
        │   └── GitScreen.tsx         # Staging / Commits / Branches views
        ├── components/
        │   ├── TreeView.tsx          # Recursive file tree (lazy-load)
        │   ├── BottomSheetExplorer.tsx  # Draggable bottom sheet file browser
        │   └── DiffViewer.tsx        # Unified diff renderer
        └── hooks/
            ├── usePhiaManusSocket.ts # WS + Supabase connection & QR scan
            ├── SocketContext.tsx     # Global context for shared connection
            └── useGitState.ts        # Git state management hook
```

The extension acts as a **secure backend server** — it never exposes the raw filesystem without authentication, sanitizes all paths against path-traversal attacks, and stores secrets in VS Code's native `SecretStorage`.

---

## 📋 Prerequisites

### Extension (Host machine)
- **Node.js** ≥ 18
- **VS Code** ≥ 1.80
- A **Gemini API Key** — get one free at [aistudio.google.com](https://aistudio.google.com)
- The host machine and mobile device **must be on the same local network** for direct P2P WebSocket. If not, configure Supabase (see [Environment Variables](#-environment-variables)).

### Client (Mobile device)
- **Node.js** ≥ 18 (for running Metro bundler on your development machine)
- **Expo Go** app installed on your physical device ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Or an Android/iOS emulator

---

## 🚀 Getting Started

### Step 1 — Install the Extension

```bash
cd extension
npm install
npm run compile
```

Then press **`F5`** in VS Code to open the **Extension Development Host**.

> [!TIP]
> The first time the extension activates, it automatically displays the pairing QR code panel and opens a WebSocket server on port `38475` (auto-increments if taken).

### Step 2 — Get Your Gemini API Key Into the Extension

The first time you trigger an AI action (prompt execution or commit message generation), a secure VS Code input box will appear asking for your **Gemini API Key**. Enter it once — it's stored in VS Code's `SecretStorage` and never written to disk or sent over the network.

Alternatively, trigger the command manually:

```
Ctrl+Shift+P → "PhiaManus: Show Connection QR Code"
```

### Step 3 — Start the Mobile Client

```bash
cd client
npm install
npx expo start
```

Scan the **Expo QR** with Expo Go to launch the app on your phone.

### Step 4 — Pair with QR Code

1. In the VS Code panel (or terminal), you'll see the **PhiaManus pairing QR code**.
2. In the mobile app, tap **Scan Pairing QR** and point your camera at the QR code in VS Code.
3. The app decodes the QR payload:
   ```
   phiamanus://pair?ip=<host-ip>&port=<ws-port>&pairId=<uuid>&token=<64-byte-hex>
   ```
4. The client opens a WebSocket to `ws://<host-ip>:<port>?token=<token>`. The extension validates the token and the session is established.

You're now connected. Your workspace tree will populate in the mobile explorer.

---

## 🌐 WebSocket Protocol

All communication between extension and client is JSON over WebSocket. Messages follow a `{ type, ...payload }` shape.

### Client → Extension (Requests)

| `type` | Additional fields | Description |
|---|---|---|
| `auth` | `token` | Handshake auth (sent on connect) |
| `REQUEST_FS_TREE` | — | Fetch full workspace directory tree |
| `REQUEST_DIR_CHILDREN` | `path` | Lazy-load children of a large directory |
| `REQUEST_FILE_READ` | `path` | Read file contents |
| `PROMPT_EXECUTE` | `prompt`, `path` | Run AI code generation on a file |
| `PATCH_APPROVE` | `patchId` | Apply a staged AI patch to the file |
| `PATCH_REJECT` | `patchId` | Discard a staged AI patch |
| `REQUEST_GIT_STATUS` | — | Get staged/unstaged/modified files |
| `REQUEST_GIT_BRANCHES` | — | List local branches |
| `REQUEST_GIT_LOG` | — | Get recent commit history (last 50) |
| `EXECUTE_GIT_ACTION` | `action`, `file?`, `message?` | Perform `stage`/`unstage`/`commit`/`push`/`pull` |
| `GENERATE_COMMIT_MESSAGE` | — | Generate AI commit title + description from staged diff |

### Extension → Client (Responses)

| `type` | Description |
|---|---|
| `FS_TREE_RESPONSE` | Full `FileNode` tree |
| `DIR_CHILDREN_RESPONSE` | Children of a lazy-loaded directory |
| `FILE_READ_RESPONSE` | File content string |
| `DELTA_CHUNK` | A streaming AI token chunk |
| `PATCH_PROPOSAL` | Structured diff with `patchId` |
| `PATCH_APPLIED` | Result of applying/rejecting a patch |
| `GIT_STATUS_RESPONSE` | `simple-git` status object |
| `GIT_BRANCHES_RESPONSE` | Branch list + current branch |
| `GIT_LOG_RESPONSE` | Array of commit objects |
| `COMMIT_MESSAGE_RESPONSE` | `{ title: string, description: string }` |
| `ERROR` | `{ message: string }` on any failure |

---

## 🔑 Environment Variables

### Client (`client/.env` or `app.config.js`)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Optional* | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Optional* | Your Supabase project anon key |

> [!NOTE]
> \* These are only required if you need the **Supabase Realtime Fallback** (i.e., the extension host and mobile device are on different networks). For same-network P2P usage, they can be left unset.

### Extension
No `.env` file is needed. The Gemini API key is stored securely via VS Code `SecretStorage` at runtime.

---

## 🔐 Security Model

- **Authentication Token**: A fresh 64-byte cryptographically random token (`randomBytes(32).toString('hex')`) is generated every time the extension activates. It is embedded in the QR code and validated on every WebSocket upgrade handshake.
- **Path Sanitization**: `WorkspaceManager` resolves all requested paths to absolute paths and verifies they start with `workspaceRoot` before any filesystem access. Path traversal attacks (e.g., `../../etc/passwd`) are rejected with a `Security Error`.
- **`node_modules` and `.git` are excluded** from all workspace tree traversals automatically.
- **Gemini API Key**: Stored in VS Code `SecretStorage` — encrypted by the OS keychain. Never serialized, never transmitted.
- **Supabase fallback**: All messages routed through Supabase channels include the pairing token inside the payload and are validated on receipt.

---

## 🧪 Running Tests

```bash
# Extension tests
cd extension && npm run test

# Client tests
cd client && npm run test
```

All tests use Jest. The client suite uses `@testing-library/react-native` with Reanimated fully mocked. The extension suite uses `ts-jest` with the `vscode` module mocked.

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| QR code not scanning | Ensure VS Code terminal is zoomed in enough for your camera, or use the Webview panel version |
| "WebSocket timed out, falling back" | The mobile device can't reach the host IP directly. Configure Supabase env vars for cross-network use |
| Gemini key prompt keeps appearing | Check VS Code's `SecretStorage` isn't being cleared by a policy. Try re-entering the key |
| `EADDRINUSE` on port 38475 | The extension will auto-increment to the next available port. The QR code always reflects the actual port |
| Tests fail with "Cannot find module 'vscode'" | Ensure `modulePathIgnorePatterns: ['<rootDir>/out/']` is in `extension/jest.config.js` |
| Reanimated worklet crash in client tests | Ensure `jest.setup.js` mocks `react-native-reanimated` and the Babel plugin is disabled for `NODE_ENV=test` |

---

*PhiaManus v1 — built to demonstrate the boundaries of agentic coding and remote developer tooling.*
