import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

// Human-friendly invite codes — uppercase, no ambiguous chars (0/O, 1/I).
const inviteCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 280 },
    inviteCode: { type: String, unique: true, default: () => inviteCode() },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model('Workspace', workspaceSchema);
