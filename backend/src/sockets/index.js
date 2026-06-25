import { verifyToken } from '../services/token.js';
import User from '../models/User.js';
import File from '../models/File.js';
import Message from '../models/Message.js';
import Snapshot from '../models/Snapshot.js';
import { getMemberWorkspace } from '../services/membership.js';
import { askAI } from '../services/llm.js';

// In-memory presence: workspaceId -> Map(socketId -> { id, name, avatarColor })
const presence = new Map();

function roomMembers(workspaceId) {
  const map = presence.get(workspaceId);
  if (!map) return [];
  // De-duplicate by user id (a user may have two tabs open).
  const byUser = new Map();
  for (const u of map.values()) byUser.set(u.id, u);
  return [...byUser.values()];
}

export function registerSockets(io) {
  // ── Authenticate every socket via the JWT in the handshake ────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error('Unknown user'));
      socket.user = user.toSafeJSON();
      next();
    } catch {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    // ── Join a workspace room ───────────────────────────────────────────────
    socket.on('workspace:join', async (workspaceId) => {
      const ws = await getMemberWorkspace(workspaceId, socket.user.id);
      if (!ws) return socket.emit('error:message', 'Not a member of this workspace');

      socket.join(workspaceId);
      socket.data.workspaceId = workspaceId;

      if (!presence.has(workspaceId)) presence.set(workspaceId, new Map());
      presence.get(workspaceId).set(socket.id, {
        id: socket.user.id,
        name: socket.user.name,
        avatarColor: socket.user.avatarColor,
      });

      io.to(workspaceId).emit('presence:update', roomMembers(workspaceId));
    });

    // ── Live code editing: broadcast keystrokes to everyone else ─────────────
    // We do NOT persist on every keystroke (that would hammer Mongo). Edits are
    // broadcast live for collaboration; durable state is written on explicit save.
    socket.on('file:edit', ({ fileId, content, cursor }) => {
      const wsId = socket.data.workspaceId;
      if (!wsId) return;
      socket.to(wsId).emit('file:edit', {
        fileId,
        content,
        cursor,
        by: { id: socket.user.id, name: socket.user.name, color: socket.user.avatarColor },
      });
    });

    // ── Persist file content (debounced on the client) ───────────────────────
    socket.on('file:save', async ({ fileId, content, language }) => {
      const wsId = socket.data.workspaceId;
      if (!wsId) return;
      const file = await File.findOneAndUpdate(
        { _id: fileId, workspace: wsId },
        { content, ...(language ? { language } : {}), updatedBy: socket.user.id },
        { new: true }
      );
      if (file) io.to(wsId).emit('file:saved', { fileId, at: file.updatedAt });
    });

    // ── Team chat ────────────────────────────────────────────────────────────
    socket.on('chat:send', async (text) => {
      const wsId = socket.data.workspaceId;
      if (!wsId || !text?.trim()) return;
      const msg = await Message.create({
        workspace: wsId,
        channel: 'team',
        role: 'user',
        author: socket.user.id,
        authorName: socket.user.name,
        text: text.trim(),
      });
      io.to(wsId).emit('chat:message', serializeMessage(msg, socket.user.avatarColor));
    });

    // ── Typing indicator ─────────────────────────────────────────────────────
    socket.on('chat:typing', () => {
      const wsId = socket.data.workspaceId;
      if (wsId) socket.to(wsId).emit('chat:typing', { name: socket.user.name });
    });

    // ── AI assistant: question -> Llama -> shared AI thread ──────────────────
    socket.on('ai:ask', async ({ question, fileId }) => {
      const wsId = socket.data.workspaceId;
      if (!wsId || !question?.trim()) return;

      // Persist + broadcast the human question so the whole team sees it.
      const userMsg = await Message.create({
        workspace: wsId,
        channel: 'ai',
        role: 'user',
        author: socket.user.id,
        authorName: socket.user.name,
        text: question.trim(),
      });
      io.to(wsId).emit('ai:message', serializeMessage(userMsg, socket.user.avatarColor));
      io.to(wsId).emit('ai:thinking', true);

      // Pull the current file as context, plus recent AI-thread history.
      const codeContext = fileId ? await File.findOne({ _id: fileId, workspace: wsId }) : null;
      const history = await Message.find({ workspace: wsId, channel: 'ai' })
        .sort('-createdAt')
        .limit(8)
        .lean();
      history.reverse();

      const result = await askAI({
        question: question.trim(),
        codeContext: codeContext
          ? { name: codeContext.name, language: codeContext.language, content: codeContext.content }
          : null,
        history,
      });

      const aiMsg = await Message.create({
        workspace: wsId,
        channel: 'ai',
        role: 'assistant',
        authorName: 'DevHub AI',
        text: result.text,
      });
      io.to(wsId).emit('ai:thinking', false);
      io.to(wsId).emit('ai:message', serializeMessage(aiMsg, '#a78bfa'));
    });

    // ── Snapshot (commit) ────────────────────────────────────────────────────
    socket.on('snapshot:create', async ({ fileId, message }) => {
      const wsId = socket.data.workspaceId;
      if (!wsId || !fileId || !message?.trim()) return;
      const file = await File.findOne({ _id: fileId, workspace: wsId });
      if (!file) return;

      const snap = await Snapshot.create({
        workspace: wsId,
        file: file._id,
        fileName: file.name,
        message: message.trim(),
        content: file.content,
        author: socket.user.id,
        authorName: socket.user.name,
      });
      io.to(wsId).emit('snapshot:created', snap);
    });

    // ── Restore a snapshot into the live file ────────────────────────────────
    socket.on('snapshot:restore', async ({ snapshotId }) => {
      const wsId = socket.data.workspaceId;
      if (!wsId) return;
      const snap = await Snapshot.findOne({ _id: snapshotId, workspace: wsId });
      if (!snap) return;
      const file = await File.findOneAndUpdate(
        { _id: snap.file, workspace: wsId },
        { content: snap.content, updatedBy: socket.user.id },
        { new: true }
      );
      if (file) {
        io.to(wsId).emit('file:restored', { fileId: file._id, content: file.content });
      }
    });

    // ── Disconnect: clean up presence ────────────────────────────────────────
    socket.on('disconnect', () => {
      const wsId = socket.data.workspaceId;
      if (wsId && presence.has(wsId)) {
        presence.get(wsId).delete(socket.id);
        io.to(wsId).emit('presence:update', roomMembers(wsId));
      }
    });
  });
}

function serializeMessage(msg, avatarColor) {
  return {
    id: msg._id,
    channel: msg.channel,
    role: msg.role,
    author: msg.author,
    authorName: msg.authorName,
    avatarColor,
    text: msg.text,
    createdAt: msg.createdAt,
  };
}
