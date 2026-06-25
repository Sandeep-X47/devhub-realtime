# DevHub

**One workspace for the whole hackathon.** Code, talk to your team, version your files, and ask an AI for help — without ever switching tabs.

DevHub is a full-stack, real-time collaboration app built for student hackathon teams. It folds the four tools a team juggles during a 36-hour sprint — a code editor, a chat app, version control, and an AI helper — into a single focused screen.

---

## The problem it solves

During a hackathon, a typical team has VS Code open, Discord/WhatsApp on a phone, GitHub in a browser tab, and ChatGPT in another. Every context switch costs focus and time you don't have. DevHub's thesis: **put all four in one room, sharing one login and one database, so the team stays in flow.**

This is intentionally *small-scale* — it does not try to out-feature VS Code or GitHub. It takes the 20% of each tool a hackathon team actually uses and makes them work together in real time.

---

## What's inside

| Pillar | What it does | Powered by |
| --- | --- | --- |
| **Editor** | A real code editor with syntax highlighting and per-file undo history. Edits sync live between teammates. | Monaco (the engine inside VS Code) |
| **Team chat** | A persistent team channel with presence ("who's online") and typing indicators. | Socket.IO + MongoDB |
| **Snapshots** | A scoped take on version control: save a file's state with a message, browse history, restore in one click. | MongoDB |
| **AI assistant** | Ask a free Llama model about your *actual* open file. Answers land in a shared AI thread the whole team sees. | Groq (Llama 3.3) |

Everything updates in real time. Open the same workspace in two browsers and watch edits, messages, snapshots, and AI replies appear instantly in both.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (React)                        │
│                                                               │
│   Monaco editor   Team chat   AI panel   Snapshot history     │
│        │              │           │            │              │
│        └──────────────┴─────┬─────┴────────────┘              │
│                  REST (auth, load)   WebSocket (live)         │
└──────────────────────────┬───────────────┬───────────────────┘
                           │               │
                    HTTP / JWT       Socket.IO (JWT handshake)
                           │               │
┌──────────────────────────┴───────────────┴───────────────────┐
│                    Node.js + Express server                   │
│                                                               │
│   /api/auth      /api/workspaces     /api/ws/:id/...          │
│   Socket events: file:edit · file:save · chat:send ·          │
│                  ai:ask · snapshot:create · presence          │
│                           │                                   │
│        ┌──────────────────┼───────────────────┐              │
│        │                  │                   │              │
│     MongoDB           Groq API           In-memory           │
│   (Mongoose)        (Llama 3.3)          presence map        │
└──────────────────────────────────────────────────────────────┘
```

**Why this shape:**

- **REST for setup, sockets for live.** Loading history, auth, and CRUD go over plain REST (cacheable, easy to reason about). Anything that must feel *instant* — keystrokes, messages, AI replies — goes over a single Socket.IO connection. Mixing them is a deliberate trade, not laziness: one transport per job.
- **The AI key never touches the browser.** Every AI call is proxied through the backend. That keeps the secret server-side, lets us inject the current file as context, and logs the exchange so the whole team benefits from one person's question.
- **Live edits are broadcast, not saved per keystroke.** Saving to Mongo on every character would melt the database. Instead keystrokes broadcast peer-to-room over the socket, and a debounced `file:save` writes durable state ~700ms after typing stops.
- **Snapshots instead of Git.** A full commit DAG with branches and merges is the wrong tool for a 36-hour sprint — it derails teams under pressure. Snapshots give linear, restorable history: the 20% of version control a hackathon actually needs.

---

## Tech stack

**Frontend:** React 18, Vite, Tailwind CSS, Monaco Editor, Socket.IO client, React Router, React Markdown.
**Backend:** Node.js, Express, Socket.IO, Mongoose (MongoDB), JWT auth, bcrypt.
**AI:** Llama 3.3 via Groq's free, OpenAI-compatible API.
**Database:** MongoDB (local or free Atlas cluster).

---

## Run it locally

You'll need **Node 18+** and **MongoDB** (local install or a free [Atlas](https://www.mongodb.com/atlas) URI).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit .env
npm run dev               # starts on http://localhost:5000
```

In `.env`, set at minimum `MONGO_URI` and a long random `JWT_SECRET`.
For the AI panel, add a free `GROQ_API_KEY` from <https://console.groq.com/keys>. Without it, the app runs fine — the AI panel just shows a "not configured" notice.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # starts on http://localhost:5173
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` and the socket to the backend, so no extra config is needed for local dev.

### 3. Try the real-time bit

1. Register an account and create a workspace.
2. Copy the 6-character invite code.
3. Open a second browser (or incognito), register a second account, and **Join with code**.
4. Edit a file in one window — watch it update live in the other. Send chat. Ask the AI. Take a snapshot.

---

## Project structure

```
devhub/
├── README.md            ← you are here
├── backend/             ← Express + Socket.IO API server
│   ├── README.md
│   ├── server.js
│   └── src/
│       ├── config/      ← database connection
│       ├── models/      ← Mongoose schemas
│       ├── middleware/  ← JWT auth guard
│       ├── routes/      ← REST endpoints
│       ├── services/    ← tokens, membership, AI/LLM
│       └── sockets/     ← real-time event handlers
└── frontend/            ← React + Vite client
    ├── README.md
    └── src/
        ├── api/         ← REST client
        ├── context/     ← auth + socket providers
        ├── components/  ← editor, file tree, chat, snapshots
        ├── pages/       ← login, dashboard, workspace
        └── lib/         ← helpers
```

---

## Honest limitations (and how you'd fix them)

Being able to name these matters more than hiding them:

- **Live edits use last-write-wins, not OT/CRDT.** Two people typing the same line simultaneously can clobber each other. The correct fix is a CRDT like [Yjs](https://github.com/yjs/yjs); it was deliberately out of scope for a hackathon-scale build. Snapshots act as the safety net.
- **Monaco loads from a CDN by default.** The editor needs internet on first load. For an offline demo, configure the Monaco loader to bundle locally.
- **No file folders.** Files are flat within a workspace — enough for a hackathon repo, not a large codebase.
- **Presence is in-memory.** It lives in the server process, so it won't survive horizontal scaling without moving to Redis. Fine for a single instance.

---

Built as a focused ecosystem, not a clone of four apps. The point was never to rebuild VS Code — it was to stop teams from leaving it.

--- 

# 📄 License

Licensed under the MIT License.

---

# 👨‍💻 Author

## Sandeep Kumar

Software Engineer • AI Builder • Full Stack Developer

📍 Chennai, India

---

# 🌐 Connect With Me

<p align="left">

<a href="https://github.com/sandeep-x47" target="_blank">
  <img src="https://skillicons.dev/icons?i=github" height="45" />
</a>

<a href="https://www.linkedin.com/in/sandeep-kumar-b7a8012bb/" target="_blank">
  <img src="https://skillicons.dev/icons?i=linkedin" height="45" />
</a>

<a href="https://www.instagram.com/x.sandeepkumar" target="_blank">
  <img src="https://skillicons.dev/icons?i=instagram" height="45" />
</a>

<a href="https://x.com/Sandeep_X47" target="_blank">
  <img src="https://cdn.simpleicons.org/x/white" height="45" />
</a>

</p>

---

