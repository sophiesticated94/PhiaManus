# PhiaManus — Mobile Client

<p>
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-0.85-61DAFB?logo=react" />
  <img alt="Expo" src="https://img.shields.io/badge/Expo-56-000020?logo=expo" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6.x-blue?logo=typescript" />
</p>

The React Native / Expo frontend for the PhiaManus ecosystem. Provides a premium native mobile IDE experience — real-time file browsing, live AI code generation, and full Git workflow management — all communicating with the VS Code extension running on your host machine.

---

## 📋 Prerequisites

- **Node.js** ≥ 18
- **Expo Go** installed on your physical device ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)), or an emulator
- The **PhiaManus VS Code Extension** running on your host machine (see [`../extension/README.md`](../extension/README.md))

---

## 🚀 How to Run

```bash
cd client
npm install
npx expo start
```

Scan the **Expo QR code** printed in your terminal with Expo Go to launch the app.

> [!IMPORTANT]
> Make sure the extension is already running in VS Code before pairing. The extension prints its own pairing QR code — this is **separate** from the Expo QR code. The Expo QR opens the app; the PhiaManus QR connects the app to your VS Code.

---

## 🔑 Environment Variables

Create a `.env` file in the `client/` directory for Supabase Realtime fallback (only needed when host and mobile are on **different networks**):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

If these are not set, the app defaults to direct P2P WebSocket only (which works fine on the same Wi-Fi network).

---

## 📱 QR Pairing Flow

1. The VS Code extension generates a one-time pairing URL:
   ```
   phiamanus://pair?ip=<host-ip>&port=<ws-port>&pairId=<uuid>&token=<64-byte-hex>
   ```
2. In the PhiaManus app, tap **Scan Pairing QR** and scan the QR displayed in VS Code.
3. The app parses the URL and opens a WebSocket to `ws://<host-ip>:<port>?token=<token>`.
4. If the WebSocket times out after 3 seconds (cross-network scenario), the app automatically falls back to **Supabase Realtime** using the same `pairId`.
5. Your connection credentials (IP, port, pairId, token) are saved in `expo-secure-store` so the app can **auto-reconnect** on next launch.

---

## 🏗️ Architecture

### Screens

| Screen | File | Description |
|---|---|---|
| **Workspace** | `src/screens/WorkspaceScreen.tsx` | VS Code-style horizontal file tabs. The Agent tab streams live AI token output. The file tab shows the selected file's contents. |
| **Git** | `src/screens/GitScreen.tsx` | Vertical icon sidebar with three sub-views: Staging, Commits, Branches. |

### Components

| Component | File | Description |
|---|---|---|
| **TreeView** | `src/components/TreeView.tsx` | Recursive file tree with lazy-loading support for large directories (directories marked `isLarge` trigger a `REQUEST_DIR_CHILDREN` message on first expand). |
| **BottomSheetExplorer** | `src/components/BottomSheetExplorer.tsx` | Draggable bottom sheet built on `@gorhom/bottom-sheet` + Reanimated. Snap points at 10% (hidden), 50% (half screen), 90% (full screen). Houses the `TreeView`. |
| **DiffViewer** | `src/components/DiffViewer.tsx` | Renders structured unified diffs received as `PATCH_PROPOSAL` events. Added lines in green, removed in red, context lines in grey. Approve/Reject buttons send `PATCH_APPROVE` / `PATCH_REJECT`. |

### Hooks

| Hook | File | Description |
|---|---|---|
| `usePhiaManusSocket` | `src/hooks/usePhiaManusSocket.ts` | Core connection hook. Manages the WebSocket lifecycle, 3-second timeout + Supabase fallback, credential persistence via `expo-secure-store`, and exposes `connect`, `sendMessage`, `restoreConnection`, `lastMessage`. |
| `SocketContext` | `src/hooks/SocketContext.tsx` | React Context wrapping `usePhiaManusSocket`. Ensures a **single shared WebSocket** across `WorkspaceScreen` and `GitScreen` without reconnecting on tab switch. |
| `useGitState` | `src/hooks/useGitState.ts` | Manages all Git-related state (status, log, branches, commitMessage). Sends/receives the Git WebSocket messages and exposes action functions: `requestStatus`, `stageFile`, `unstageFile`, `commit`, `push`, `pull`, `generateCommitMessage`. |

---

## 🌿 Git Screen In Detail

The Git screen has a **vertical icon sidebar** (like GitLab) with three views:

### 📁 Staging View
- **Staged Changes** list — tap any file to **unstage** it
- **Unstaged Changes** list — tap any file to **stage** it
- **✨ Generate** button — sends `GENERATE_COMMIT_MESSAGE` to the extension; Gemini reads your staged diff and returns a `{ title, description }` pair which auto-fills the commit form
- **Commit Title** and **Description** text inputs
- **Commit** button — sends the message as `EXECUTE_GIT_ACTION { action: 'commit' }`
- **Pull / Push** buttons for one-tap sync

### 🕐 Commits View
Scrollable timeline of the last 50 commits, each showing:
- Commit message
- Author name + date
- Short hash (7 chars)

### 🌿 Branches View
Full list of local branches. The active branch is highlighted in blue with a **Current** badge.

---

## 🧪 Testing

The client test suite uses **Jest** + **`@testing-library/react-native`**.

```bash
npm run test
```

### Test files

| File | What it covers |
|---|---|
| `src/components/TreeView.test.tsx` | Renders root children, triggers `onFilePress`, triggers `onLazyLoad` for large dirs. All `fireEvent` calls wrapped in `await act(async () => {})` to handle async state updates cleanly. |
| `src/components/BottomSheetExplorer.test.tsx` | Loading state, file press callback forwarding |
| `src/components/DiffViewer.test.tsx` | Patch parsing, add/remove line rendering |
| `src/hooks/useGitState.test.ts` | State transitions (status, log, branches, commitMessage) over a mocked WebSocket |

### Test configuration details

- **`babel.config.js`** disables the `react-native-reanimated` Babel plugin for `NODE_ENV=test` to avoid worklet compilation errors.
- **`jest.setup.js`** mocks `@gorhom/bottom-sheet` to a simple `View` wrapper to prevent native animated helper crashes.
- **`jest.config.js`** uses `jest-expo` preset.

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `expo` ~56 | Expo framework & Managed Workflow |
| `react-native` 0.85 | Core native framework |
| `@gorhom/bottom-sheet` ^5 | Native gesture-driven bottom sheet |
| `react-native-reanimated` 4.x | Animations for bottom sheet |
| `react-native-gesture-handler` ~2.31 | Native gesture recognition |
| `lucide-react-native` | Icon set |
| `@supabase/supabase-js` | Supabase Realtime fallback |
| `expo-secure-store` | Encrypted credential persistence |
| `expo-camera` | QR code scanning |
