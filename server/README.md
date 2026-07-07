# Pallanguzhi Online Multiplayer Server

Authoritative, lightweight WebSocket server for online play. It reuses the app's
**deterministic rules engine** (mirrored via `npm run sync`) so every move is
validated server-side with the exact same rules — there is no second ruleset.

## Stack
- Node.js + TypeScript (CommonJS output)
- `ws` for WebSockets, `zod` for message validation
- In-memory room state (no database required)

## Setup
```bash
cd server
npm install
npm run sync     # mirror the app engine into src/engine.ts (auto-runs on dev/build)
```

## Run
```bash
npm run dev      # tsx watch (development)
# or
npm run build && npm run start   # compiled production run
npm run smoke    # end-to-end self-test (server must be running)
```

Health check: `GET /health` → `{ "status": "ok", "rooms": <n> }`.

## Environment variables
| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Port to listen on (Render sets this) | `8080` |
| `CLIENT_ORIGIN` | Reserved for origin allow-listing | empty (allow all) |
| `NODE_ENV` | Runtime mode | `development` |

The **app** points at the server via `EXPO_PUBLIC_SERVER_URL`
(e.g. `wss://your-service.onrender.com`). Defaults to `ws://localhost:8080`.

## Deploy to Render.com
- New **Web Service**, environment **Node**, root directory `server/`.
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check path: `/health`
- WebSockets work over the service's `wss://` URL automatically.

## Protocol (summary)
Client → server: `createRoom`, `joinRoom{code}`, `reconnect{code,token}`,
`ready{ready}`, `move{pit}`, `rematch`, `leave`.

Server → client: `roomCreated`, `joinedRoom`, `roomNotFound`, `roomFull`,
`presence`, `gameStarted{state}`, `state{state}`, `invalidMove{reason}`,
`opponentDisconnected`, `opponentReconnected`, `rematchRequested{by}`,
`rematchAccepted`, `roomClosed{reason}`, `error`.

The server is authoritative: it owns the `GameState`, enforces turn order,
rejects illegal moves, and broadcasts the resulting state to both clients.
Disconnects notify the opponent and start a 30s grace window for reconnect;
abandoned rooms are swept automatically.
