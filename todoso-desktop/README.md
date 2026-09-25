# toDoSo Desktop

A desktop application built with Electron, React, and TypeScript that helps you focus. 
It integrates with the toDoSo backend and features an OS-level website blocker to keep distractions away during focus sessions.

## Architecture

The app is built using a strict 3-layer Electron architecture:
- **Main Process** (`src/main/`): Node.js environment. Handles OS-level APIs, window management, system tray, notifications, and the crucial `HostsBlocker`.
- **Preload Script** (`src/preload/`): Exposes a typed, secure `contextBridge` to the renderer. The renderer *never* accesses Node.js directly.
- **Renderer Process** (`src/renderer/`): The React application, built with Vite. It uses `TanStack Query` for server state, `Zustand` for local state, and `shadcn/ui` + `Tailwind CSS` for styling.

### Communication (IPC)
All communication between the main process and the renderer happens via strongly-typed IPC channels defined in `src/shared/ipc.ts`. This ensures end-to-end type safety and prevents "magic strings".

### Blocker Cycle & Failsafes
The app blocks websites by modifying the OS `hosts` file.
1. When a focus session starts, the renderer calls the main process via IPC.
2. The main process uses `HostsBlocker` to append domain entries, wrapped in `# >>> toDoSo start` and `# <<< toDoSo end` markers.
3. When the session ends, the blocker removes *only* its own marked entries.

**Failsafes Implemented:**
- **Startup Cleanup**: On app launch, `cleanup.ts` scans the hosts file and removes any orphaned entries from previous crashes.
- **Watchdog Service**: Periodically checks health. If the app exits unexpectedly (SIGINT, SIGTERM, etc.), emergency handlers ensure the hosts file is reverted.
- **Kiosk Mode**: An optional strict mode that locks the app. It has a mandatory 2-hour hard limit and an escape hatch, ensuring the user is never permanently locked out.

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start the app in development mode
npm run dev
```

### Environment Variables
Create a `.env` file in the root based on `.env.example`:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws
```

## Packaging

```bash
# Build the React app and Electron code
npm run build

# Package for your current platform
npm run dist

# Or package for specific platforms:
npm run dist:win
npm run dist:mac
npm run dist:linux
```

## Permissions
Modifying the `hosts` file requires elevated privileges (Administrator on Windows, `sudo` on macOS/Linux). The app will prompt for these permissions when a focus session is started.
