import express from 'express';
import Workspace from '../models/Workspace.js';
import File from '../models/File.js';
import { requireAuth } from '../middleware/auth.js';
import { getMemberWorkspace } from '../services/membership.js';

const router = express.Router();
router.use(requireAuth);

// Create a workspace; the creator is owner + first member, and a starter file is seeded.
router.post('/', async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Workspace name is required' });

  const ws = await Workspace.create({
    name,
    description: description || '',
    owner: req.user._id,
    members: [req.user._id],
  });

  await File.create({
    workspace: ws._id,
    name: 'README.md',
    language: 'markdown',
    content: `# ${name}\n\nWelcome to your DevHub workspace. Invite teammates with code **${ws.inviteCode}**.\n`,
    updatedBy: req.user._id,
  });

  res.status(201).json({ workspace: ws });
});

// All workspaces the current user belongs to.
router.get('/', async (req, res) => {
  const list = await Workspace.find({ members: req.user._id }).sort('-updatedAt');
  res.json({ workspaces: list });
});

// Join by invite code.
router.post('/join', async (req, res) => {
  const { inviteCode } = req.body || {};
  if (!inviteCode) return res.status(400).json({ error: 'Invite code is required' });

  const ws = await Workspace.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
  if (!ws) return res.status(404).json({ error: 'No workspace found for that code' });

  if (!ws.members.some((m) => m.equals(req.user._id))) {
    ws.members.push(req.user._id);
    await ws.save();
  }
  res.json({ workspace: ws });
});

// Workspace detail with populated members (used by the workspace screen).
router.get('/:id', async (req, res) => {
  const ws = await getMemberWorkspace(req.params.id, req.user._id);
  if (!ws) return res.status(403).json({ error: 'You are not a member of this workspace' });
  await ws.populate('members', 'name email avatarColor');
  res.json({ workspace: ws });
});

export default router;
