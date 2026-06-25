import express from 'express';
import File from '../models/File.js';
import Snapshot from '../models/Snapshot.js';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';
import { getMemberWorkspace } from '../services/membership.js';

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

// Guard: every route here is scoped to a workspace the user belongs to.
router.use('/:workspaceId', async (req, res, next) => {
  const ws = await getMemberWorkspace(req.params.workspaceId, req.user._id);
  if (!ws) return res.status(403).json({ error: 'Not a member of this workspace' });
  req.workspace = ws;
  next();
});

// ── Files ──────────────────────────────────────────────────────────────────
router.get('/:workspaceId/files', async (req, res) => {
  const files = await File.find({ workspace: req.workspace._id }).sort('name');
  res.json({ files });
});

router.post('/:workspaceId/files', async (req, res) => {
  const { name, language } = req.body || {};
  if (!name) return res.status(400).json({ error: 'File name is required' });
  try {
    const file = await File.create({
      workspace: req.workspace._id,
      name: name.trim(),
      language: language || 'plaintext',
      content: '',
      updatedBy: req.user._id,
    });
    res.status(201).json({ file });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'A file with that name already exists' });
    throw err;
  }
});

router.delete('/:workspaceId/files/:fileId', async (req, res) => {
  await File.deleteOne({ _id: req.params.fileId, workspace: req.workspace._id });
  res.json({ ok: true });
});

// ── Chat history (loaded once on entry; live updates come over the socket) ───
router.get('/:workspaceId/messages', async (req, res) => {
  const channel = req.query.channel === 'ai' ? 'ai' : 'team';
  const messages = await Message.find({ workspace: req.workspace._id, channel })
    .sort('createdAt')
    .limit(200);
  res.json({ messages });
});

// ── Snapshots (the scoped version control) ──────────────────────────────────
router.get('/:workspaceId/snapshots', async (req, res) => {
  const filter = { workspace: req.workspace._id };
  if (req.query.fileId) filter.file = req.query.fileId;
  const snapshots = await Snapshot.find(filter).sort('-createdAt').limit(100);
  res.json({ snapshots });
});

export default router;
