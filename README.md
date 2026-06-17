<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/terminal.svg" width="100" />
  <h1>PhiaManus</h1>
  <p><b>A high-performance remote IDE bridge for native mobile development.</b></p>
</div>

<br />

PhiaManus is a revolutionary two-part architecture consisting of a **VS Code Extension** and a **Native React Native Client**. It allows you to transform your mobile phone or tablet into a fully-functional, real-time IDE interface for your host machine.

Forget clunky web-based IDEs on mobile browsers. PhiaManus uses native gesture handlers, Bottom Sheets, and custom WebSockets to stream your workspace securely and instantly.

## ✨ Features

- **Real-Time Workspace Streaming**: View your entire host machine's directory tree remotely, rendered via native mobile UI components.
- **AI Pair Programming (Gemini)**: Request code changes right from your phone. The PhiaManus extension pipes your prompt and the active file context through the Google Gemini API, streaming the LLM response live to your mobile screen.
- **Two-Phase Commit Diffing**: AI code changes are presented natively on your mobile device as Unified Diffs. Review, Approve, or Reject.
- **Native Git Integration**: Review commits, switch branches, stage files, and use the "AI Magic Wand" to auto-generate commit messages based on your staged diffs.
- **Secure Pair Routing**: Authentication is enforced via AES encryption and single-use WebSockets, falling back to Supabase Realtime when P2P isn't available.

## 🏗️ Architecture overview

The repository is structured as a monolithic pair of projects:

- `/extension`: A VS Code Extension built with TypeScript. It binds to the host's filesystem, Git repository, and VS Code secret storage to act as the backend server.
- `/client`: An Expo React Native application. It consumes the WebSocket stream to render native IDE interfaces.

## 🚀 Getting Started (The Pairing Process)

PhiaManus uses a completely seamless QR code pairing process to securely link your mobile client to your VS Code session.

### 1. Setup the Extension
1. Navigate to the `extension` folder.
2. Run `npm install` and `npm run compile`.
3. Press `F5` in VS Code to launch the Extension Development Host.
4. Run the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and trigger **PhiaManus: Show Connection QR Code**.
5. *Note:* A terminal will display the QR code directly in the VS Code terminal. Ensure you configure your Gemini API key when prompted!

### 2. Setup the Client
1. Navigate to the `client` folder.
2. Run `npm install`.
3. Run `npx expo start`.
4. Scan the Expo QR code using the Expo Go app on your phone.
5. When the PhiaManus Client launches, tap the **Scan Pairing QR** button and point your phone at your VS Code terminal!

You are now connected securely. Your mobile screen will populate with the Workspace viewer.

---
*PhiaManus was built to demonstrate the boundaries of agentic coding and remote developer tooling.*
