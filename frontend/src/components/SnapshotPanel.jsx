import { timeAgo } from '../lib/utils.js';
import { Avatar } from './Brand.jsx';

export default function SnapshotPanel({ open, onClose, file, snapshots, onRestore }) {
  if (!open) return null;
  const fileSnaps = file ? snapshots.filter((s) => s.file === file._id) : [];

  return (
    <div className="fixed inset-0 z-30 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-void/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md h-full bg-surface border-l border-border shadow-panel animate-fade-up overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-border">
          <div>
            <h3 className="font-display font-600">Snapshots</h3>
            {file && <p className="text-xs text-muted font-mono">{file.name}</p>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-text">✕</button>
        </div>

        <div className="px-5 py-3 border-b border-border bg-amber/5">
          <p className="text-xs text-muted leading-relaxed">
            A snapshot saves this file's current content with a message. Restore one to roll the live
            file back — everyone in the workspace sees the change instantly.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {fileSnaps.length === 0 ? (
            <p className="text-sm text-muted text-center py-10">
              No snapshots for this file yet. Use “Snapshot” in the editor toolbar to save one.
            </p>
          ) : (
            fileSnaps.map((s, i) => (
              <div key={s._id} className="panel p-3 hover:border-border-bright transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-amber/15 text-amber grid place-items-center text-xs font-mono shrink-0">
                    {fileSnaps.length - i}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text break-words">{s.message}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted">
                      <Avatar name={s.authorName} size={18} color="#fbbf24" />
                      <span>{s.authorName}</span>
                      <span className="text-muted-2">· {timeAgo(s.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRestore(s)}
                    className="btn-ghost !px-2.5 !py-1 text-xs shrink-0"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
