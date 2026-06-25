# DevHub — Frontend

React + Vite client. A dark "signal deck" UI with three panes: files, the Monaco editor, and a comms panel (team chat + AI).

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build
```

In dev, Vite proxies `/api` and the socket to `http://localhost:5000`, so you don't need to set env vars locally. The backend must be running.

## Environment

For production deploys (when frontend and backend are on different origins):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend, e.g. `https://api.yourapp.com` |
| `VITE_SOCKET_URL` | Socket origin (usually the same as the API) |

Leave both blank for local dev.

## Structure

```
src/
├── main.jsx              ← entry; mounts router + auth provider
├── App.jsx               ← routes + auth gating + socket provider
├── api/client.js         ← typed-ish fetch wrapper, token storage
├── context/
│   ├── AuthContext.jsx   ← login/register/logout, current user
│   └── SocketContext.jsx ← single shared Socket.IO connection
├── pages/
│   ├── Login.jsx         ← split hero + auth form
│   ├── Dashboard.jsx     ← create / join / list workspaces
│   └── Workspace.jsx     ← the three-pane deck; wires all sockets
├── components/
│   ├── Brand.jsx         ← logo, wordmark, avatar
│   ├── FileTree.jsx      ← file list + create/delete
│   ├── CodeEditor.jsx    ← Monaco + live collaborative sync
│   ├── CommsPanel.jsx    ← team chat + AI tabs
│   └── SnapshotPanel.jsx ← version history drawer
├── lib/utils.js          ← language detection, time/format helpers
└── styles/index.css      ← Tailwind layers + design tokens
```

## Design system

Defined in `tailwind.config.js`. A deep navy base (`#0a0e1a`) with a cyan→violet "signal" gradient as the signature — cyan for people/chat, violet for AI. Typefaces: Space Grotesk (display), Inter (body), JetBrains Mono (code). The Monaco theme is matched to the deck so the editor doesn't feel bolted on.

## How real-time sync works (client side)

`CodeEditor.jsx` throttles outgoing `file:edit` broadcasts to ~10/s and debounces durable `file:save` to ~700ms after you stop typing. Incoming remote edits are applied with a suppress flag so they don't echo back out as new local edits. Each file is a separate Monaco model (keyed by file id), so switching files preserves per-file undo history.
