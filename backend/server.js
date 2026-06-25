import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import { connectDB } from './src/config/db.js';
import { registerSockets } from './src/sockets/index.js';
import authRoutes from './src/routes/auth.js';
import workspaceRoutes from './src/routes/workspace.js';
import fileRoutes from './src/routes/file.js';

const PORT = process.env.PORT || 5000;
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Health check — useful for deploy platforms.
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'devhub' }));

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
// File/snapshot/message routes are nested under a workspace id.
app.use('/api/ws', fileRoutes);

// Centralised error handler so unexpected throws return clean JSON.
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ORIGIN, methods: ['GET', 'POST'] },
});
registerSockets(io);

async function start() {
  await connectDB(process.env.MONGO_URI);
  server.listen(PORT, () => {
    console.log(`\n  DevHub backend running on http://localhost:${PORT}`);
    console.log(`  Accepting client from ${ORIGIN}\n`);
  });
}

start();
