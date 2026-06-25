import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    // Language is derived from the extension on the client, stored for the editor.
    language: { type: String, default: 'plaintext' },
    content: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// A workspace can't have two files with the same name.
fileSchema.index({ workspace: 1, name: 1 }, { unique: true });

export default mongoose.model('File', fileSchema);
