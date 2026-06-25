import mongoose from 'mongoose';

/**
 * A Snapshot is DevHub's scoped take on "Git": instead of a full DAG of commits,
 * a team captures the entire state of a file's content with a message. It's a
 * linear, restorable history — enough for a 36-hour hackathon, without the
 * cognitive overhead of branches and merges that derail teams under time pressure.
 */
const snapshotSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true, index: true },
    fileName: { type: String, required: true },
    message: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Snapshot', snapshotSchema);
