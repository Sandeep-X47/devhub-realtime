import { useState } from 'react';
import { languageForFile, timeAgo } from '../lib/utils.js';

const FILE_ICON_COLOR = {
  javascript: '#fbbf24', typescript: '#60a5fa', python: '#34d399',
  java: '#f472b6', markdown: '#8a95ad', html: '#fb923c', css: '#22d3ee',
  json: '#a78bfa',
};

export default function FileTree({ files, activeId, onSelect, onCreate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, languageForFile(trimmed));
    setName('');
    setAdding(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 h-10 border-b border-border shrink-0">
        <span className="text-xs font-display font-600 uppercase tracking-wider text-muted">
          Files
        </span>
        <button
          onClick={() => setAdding((v) => !v)}
          className="h-6 w-6 grid place-items-center rounded text-muted hover:text-cyan hover:bg-surface-2"
          title="New file"
        >
          +
        </button>
      </div>

      {adding && (
        <div className="p-2 border-b border-border">
          <input
            autoFocus
            className="input !py-1.5 font-mono text-xs"
            placeholder="filename.js"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') { setAdding(false); setName(''); }
            }}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 && (
          <p className="text-xs text-muted-2 px-3 py-4">No files yet. Add one with +.</p>
        )}
        {files.map((f) => {
          const active = f._id === activeId;
          const color = FILE_ICON_COLOR[f.language] || '#8a95ad';
          return (
            <div
              key={f._id}
              onClick={() => onSelect(f)}
              className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm ${
                active ? 'bg-surface-2 text-text' : 'text-muted hover:bg-surface hover:text-text'
              }`}
            >
              <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: color }} />
              <span className="font-mono text-[13px] truncate flex-1">{f.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(f); }}
                className="opacity-0 group-hover:opacity-100 text-muted-2 hover:text-pink text-xs px-1"
                title="Delete file"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
