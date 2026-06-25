import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    // 'team' = the shared human chat; 'ai' = the AI assistant thread.
    channel: { type: String, enum: ['team', 'ai'], default: 'team' },
    // 'user' for people, 'assistant' for the AI, 'system' for events.
    role: { type: String, enum: ['user', 'assistant', 'system'], default: 'user' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String },
    text: { type: String, required: true, maxlength: 8000 },
  },
  { timestamps: true }
);

messageSchema.index({ workspace: 1, channel: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
