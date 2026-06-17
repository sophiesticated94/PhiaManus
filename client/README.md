# PhiaManus Mobile Client

This is the React Native (Expo) frontend for the PhiaManus ecosystem. It provides a stunning, high-performance mobile UI designed to let you interact natively with your host IDE, codebase, and Git repository.

## Mobile Architecture

The client has been heavily modularized into several core components:
- `SocketContext.tsx`: Manages the global WebSocket/Supabase Realtime state to ensure connection persistence across the entire app.
- `WorkspaceScreen.tsx`: The primary coding environment. It houses the VS Code style file tabs and the PhiaManus terminal (Agent) UI.
- `GitScreen.tsx`: A dedicated view for repository management. Offers split views for Staging, Commits, and Branches.
- `BottomSheetExplorer.tsx`: A fluid, gesture-based component built using `@gorhom/bottom-sheet` and Reanimated. It allows you to drag up the repository tree from the bottom of your screen.
- `DiffViewer.tsx`: Natively renders Two-Phase Patch Proposals (unified diffs) created by the Gemini AI.

## How to Run

1. `npm install` inside the `client` directory.
2. Ensure you have the [Expo Go](https://expo.dev/go) app installed on your physical mobile device.
3. Start the Metro bundler:
```bash
npx expo start
```
4. Scan the QR code displayed in your terminal using the Expo Go app.

## Testing

The client includes unit tests using Jest and `@testing-library/react-native`.

To run tests:
```bash
npm run test
```

*Note: The test suite runs with Babel properly configured to mock out native Reanimated worklets automatically.*
