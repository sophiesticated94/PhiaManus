# PhiaManus VS Code Extension

This is the backend "Host" engine for the PhiaManus ecosystem. It runs as a native VS Code extension, securely opening a high-performance WebSocket server to stream your local repository to the connected mobile client.

## Features

- **P2P WebSocket Server**: Spawns an internal HTTP Upgrade server on an available port (`>=8080`) to stream JSON payloads to the mobile client.
- **Supabase Fallback**: If the mobile client isn't on the same local network, it seamlessly fails over to Supabase Realtime using end-to-end encrypted payloads.
- **Git Service**: Wraps `simple-git` to safely perform remote repository operations.
- **Gemini Service**: Connects to the `@google/generative-ai` SDK. Captures file diffs, streams LLM chunks, and creates patch proposals inside the IDE.

## Configuration & Security

The extension takes security very seriously:
- **Secret Storage**: The Gemini API Key (`gemini_api_key`) is stored natively using VS Code's `SecretStorage` API. It is never exposed in plaintext or sent over the network.
- **AES Token Verification**: All connection attempts from the mobile client are validated against a 64-byte randomly generated pairing token.

## How to Run & Debug

1. `npm install` to install all dependencies.
2. Open the `extension/` folder in VS Code.
3. Press `F5` to open the Extension Development Host.
4. In the new VS Code window, hit `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac).
5. Execute: `PhiaManus: Show Connection QR Code`.
6. A terminal view will appear with the QR code. You can now scan this from the mobile client.

To run tests:
```bash
npm run test
```
