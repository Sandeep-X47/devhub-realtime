import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Logo, Avatar } from '../components/Brand.jsx';
import FileTree from '../components/FileTree.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import CommsPanel from '../components/CommsPanel.jsx';
import SnapshotPanel from '../components/SnapshotPanel.jsx';
import { languageForFile } from '../lib/utils.js';

export default function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [ws, setWs] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [teamMessages, setTeamMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [presence, setPresence] = useState([]);
  const [channel, setChannel] = useState('team');
  const [aiThinking, setAiThinking] = useState(false);
  const [typingName, setTypingName] = useState('');
  const [snapOpen, setSnapOpen] = useState(false);
  const [snapMsg, setSnapMsg] = useState(null); // null | string (modal open)
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const typingTimer = useRef(null);

  // ── Load everything for this workspace ────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ workspace }, { files }, team, ai, { snapshots }] = await Promise.all([
          api.getWorkspace(id),
          api.listFiles(id),
          api.listMessages(id, 'team'),
          api.listMessages(id, 'ai'),
          api.listSnapshots(id),
        ]);
        if (!alive) return;
        setWs(workspace);
        setFiles(files);
        setSnapshots(snapshots);
        setTeamMessages(team.messages.map(normalizeMsg));
        setAiMessages(ai.messages.map(normalizeMsg));
        if (files.length) selectFile(files[0]);
      } catch (e) {
        setError(e.message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // ── Join the socket room + subscribe to live events ───────────────────────
  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const join = () => s.emit('workspace:join', id);
    if (connected) join();
    s.on('connect', join);

    s.on('presence:update', setPresence);
    s.on('chat:message', (m) => setTeamMessages((prev) => [...prev, normalizeMsg(m)]));
    s.on('ai:message', (m) => setAiMessages((prev) => [...prev, normalizeMsg(m)]));
    s.on('ai:thinking', setAiThinking);
    s.on('snapshot:created', (snap) => setSnapshots((prev) => [snap, ...prev]));
    s.on('chat:typing', ({ name }) => {
      setTypingName(name);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(''), 2500);
    });

    return () => {
      s.off('connect', join);
      s.off('presence:update', setPresence);
      s.off('chat:message');
      s.off('ai:message');
      s.off('ai:thinking', setAiThinking);
      s.off('snapshot:created');
      s.off('chat:typing');
    };
  }, [id, socket, connected]);

  function selectFile(f) {
    setActiveFile({ ...f, id: f._id });
  }

  // ── File actions ──────────────────────────────────────────────────────────
  async function createFile(name, language) {
    try {
      const { file } = await api.createFile(id, { name, language });
      setFiles((prev) => [...prev, file].sort((a, b) => a.name.localeCompare(b.name)));
      selectFile(file);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(''), 3000);
    }
  }

  async function deleteFile(f) {
    await api.deleteFile(id, f._id);
    setFiles((prev) => prev.filter((x) => x._id !== f._id));
    if (activeFile?._id === f._id) {
      const remaining = files.filter((x) => x._id !== f._id);
      setActiveFile(remaining.length ? { ...remaining[0], id: remaining[0]._id } : null);
    }
  }

  // ── Chat + AI ─────────────────────────────────────────────────────────────
  const onSendChat = useCallback(
    (text) => socket.current?.emit('chat:send', text),
    [socket]
  );
  const onAskAI = useCallback(
    (question, fileId) => {
      setChannel('ai');
      socket.current?.emit('ai:ask', { question, fileId });
    },
    [socket]
  );

  // ── Snapshots ─────────────────────────────────────────────────────────────
  function commitSnapshot() {
    const msg = (snapMsg || '').trim();
    if (!msg || !activeFile) return;
    socket.current?.emit('snapshot:create', { fileId: activeFile._id, message: msg });
    setSnapMsg(null);
  }
  function restoreSnapshot(snap) {
    socket.current?.emit('snapshot:restore', { snapshotId: snap._id });
    setSnapOpen(false);
  }

  function copyInvite() {
    navigator.clipboard?.writeText(ws.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error && !ws) {
    return (
      <div className="h-full grid place-items-center">
        <div className="panel p-8 text-center">
          <p className="text-pink mb-4">{error}</p>
          <button className="btn-ghost" onClick={() => navigate('/')}>Back to dashboard</button>
        </div>
      </div>
    );
  }
  if (!ws) return <div className="h-full grid place-items-center text-muted">Loading workspace…</div>;

  return (
    <div className="h-screen flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-border bg-void flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/')} className="text-muted hover:text-text" title="Dashboard">
            <Logo size={24} />
          </button>
          <div className="min-w-0">
            <h1 className="font-display font-600 text-sm truncate leading-tight">{ws.name}</h1>
            <p className="text-[11px] text-muted truncate">{ws.description || 'Hackathon workspace'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Presence */}
          <div className="flex items-center -space-x-2">
            {presence.slice(0, 5).map((p) => (
              <Avatar key={p.id} name={p.name} color={p.avatarColor} size={28} ring />
            ))}
            {presence.length > 5 && (
              <span className="h-7 w-7 rounded-full bg-surface-2 ring-2 ring-void grid place-items-center text-[11px] text-muted">
                +{presence.length - 5}
              </span>
            )}
          </div>
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald' : 'bg-muted-2'}`} title={connected ? 'Live' : 'Reconnecting'} />

          {/* Invite code */}
          <button
            onClick={copyInvite}
            className="btn-ghost !px-3 !py-1.5 text-xs font-mono"
            title="Copy invite code"
          >
            {copied ? 'Copied!' : ws.inviteCode}
          </button>
        </div>
      </header>

      {/* ── Three-pane deck ─────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-[220px_1fr_360px] min-h-0">
        {/* Left: files */}
        <aside className="border-r border-border bg-surface min-h-0">
          <FileTree
            files={files}
            activeId={activeFile?._id}
            onSelect={selectFile}
            onCreate={createFile}
            onDelete={deleteFile}
          />
        </aside>

        {/* Center: editor */}
        <section className="flex flex-col min-h-0 bg-void">
          {activeFile ? (
            <>
              <div className="h-10 border-b border-border flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-text">{activeFile.name}</span>
                  <span className="text-[11px] text-muted-2 uppercase">{activeFile.language}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => setSnapMsg('')}>
                    Snapshot
                  </button>
                  <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => setSnapOpen(true)}>
                    History
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <CodeEditor file={activeFile} socket={socket} />
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-muted">
              <div className="text-center">
                <p>No file open.</p>
                <p className="text-sm text-muted-2 mt-1">Create one from the Files panel to start coding.</p>
              </div>
            </div>
          )}
        </section>

        {/* Right: comms */}
        <aside className="border-l border-border bg-surface min-h-0">
          <CommsPanel
            channel={channel}
            setChannel={setChannel}
            teamMessages={teamMessages}
            aiMessages={aiMessages}
            aiThinking={aiThinking}
            typingName={typingName}
            activeFile={activeFile}
            onSendChat={onSendChat}
            onAskAI={onAskAI}
          />
        </aside>
      </div>

      {/* Snapshot history drawer */}
      <SnapshotPanel
        open={snapOpen}
        onClose={() => setSnapOpen(false)}
        file={activeFile}
        snapshots={snapshots}
        onRestore={restoreSnapshot}
      />

      {/* Snapshot create modal */}
      {snapMsg !== null && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-void/60 backdrop-blur-sm" onClick={() => setSnapMsg(null)}>
          <div className="panel p-6 w-full max-w-md mx-4 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-600 text-lg mb-1">Save a snapshot</h3>
            <p className="text-sm text-muted mb-4">
              Capture <span className="font-mono text-amber">{activeFile?.name}</span> as it is now.
            </p>
            <input
              autoFocus
              className="input"
              placeholder="e.g. Working auth flow before refactor"
              value={snapMsg}
              onChange={(e) => setSnapMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitSnapshot()}
            />
            <div className="flex gap-2 mt-4">
              <button className="btn-primary" disabled={!snapMsg.trim()} onClick={commitSnapshot}>
                Save snapshot
              </button>
              <button className="btn-ghost" onClick={() => setSnapMsg(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeMsg(m) {
  return {
    id: m.id || m._id,
    role: m.role,
    authorName: m.authorName,
    avatarColor: m.avatarColor,
    text: m.text,
    createdAt: m.createdAt,
  };
}
