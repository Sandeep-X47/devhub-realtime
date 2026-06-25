# DevHub — Backend

Express + Socket.IO API server. Handles auth, workspace/file CRUD over REST, and all real-time collaboration over WebSocket.

## Run

```bash
npm install
cp .env.example .env     # fill in MONGO_URI, JWT_SECRET, (optional) GROQ_API_KEY
npm run dev              # nodemon, http://localhost:5000
npm start                # production
```

Requires Node 18+ and a reachable MongoDB.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | no | Server port (default 5000) |
| `CLIENT_ORIGIN` | no | Allowed CORS origin (default `http://localhost:5173`) |
| `MONGO_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | Secret for signing auth tokens |
| `JWT_EXPIRES_IN` | no | Token lifetime (default `7d`) |
| `GROQ_API_KEY` | no | Free key for the AI panel. Without it, AI returns a "not configured" notice |
| `GROQ_MODEL` | no | Llama model id (default `llama-3.3-70b-versatile`) |

## REST API

All protected routes require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account → `{ token, user }` |
| POST | `/api/auth/login` | Sign in → `{ token, user }` |
| GET | `/api/auth/me` | Current user |
| GET | `/api/workspaces` | List my workspaces |
| POST | `/api/workspaces` | Create workspace (seeds a README file) |
| POST | `/api/workspaces/join` | Join by invite code |
| GET | `/api/workspaces/:id` | Workspace detail + members |
| GET | `/api/ws/:id/files` | List files |
| POST | `/api/ws/:id/files` | Create file |
| DELETE | `/api/ws/:id/files/:fileId` | Delete file |
| GET | `/api/ws/:id/messages?channel=team\|ai` | Chat history |
| GET | `/api/ws/:id/snapshots?fileId=` | Snapshot history |

## Socket events

Authenticated via the JWT in the handshake (`auth.token`).

**Client → server:** `workspace:join`, `file:edit`, `file:save`, `chat:send`, `chat:typing`, `ai:ask`, `snapshot:create`, `snapshot:restore`.

**Server → client:** `presence:update`, `file:edit`, `file:saved`, `file:restored`, `chat:message`, `chat:typing`, `ai:message`, `ai:thinking`, `snapshot:created`.

## Data models

- **User** — name, email, bcrypt password hash, avatar color.
- **Workspace** — name, description, unique invite code, owner, members.
- **File** — workspace ref, name, language, content. Unique per `(workspace, name)`.
- **Message** — workspace ref, channel (`team`/`ai`), role, author, text.
- **Snapshot** — full file content captured with a message; the version history.

## Notes

- Membership is enforced centrally (`services/membership.js`) on every REST route and socket event — a user can only touch workspaces they belong to.
- Route handlers live inside the route files rather than a separate controller layer. For an app this size that's a deliberate simplicity choice; the service layer (tokens, membership, LLM) is where shared logic lives.
