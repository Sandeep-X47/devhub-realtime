import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Wordmark, Avatar } from '../components/Brand.jsx';
import { timeAgo } from '../lib/utils.js';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(null); // 'create' | 'join' | null
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { workspaces } = await api.listWorkspaces();
    setWorkspaces(workspaces);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function createWs() {
    setBusy(true);
    setError('');
    try {
      const { workspace } = await api.createWorkspace({ name, description: desc });
      navigate(`/w/${workspace._id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function joinWs() {
    setBusy(true);
    setError('');
    try {
      const { workspace } = await api.joinWorkspace({ inviteCode: code });
      navigate(`/w/${workspace._id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-void/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted hidden sm:block">{user.name}</span>
            <Avatar name={user.name} color={user.avatarColor} size={32} />
            <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-700 text-3xl tracking-tight">Your workspaces</h1>
            <p className="text-muted mt-1">Each workspace is one team's all-in-one hackathon room.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => { setPanel('join'); setError(''); }}>
              Join with code
            </button>
            <button className="btn-primary" onClick={() => { setPanel('create'); setError(''); }}>
              + New workspace
            </button>
          </div>
        </div>

        {/* Create / Join panel */}
        {panel && (
          <div className="panel p-6 mb-8 animate-fade-up max-w-xl">
            {panel === 'create' ? (
              <>
                <h3 className="font-display font-600 text-lg mb-4">Create a workspace</h3>
                <div className="space-y-3">
                  <input className="input" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
                  <input className="input" placeholder="Short description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display font-600 text-lg mb-4">Join a workspace</h3>
                <input
                  className="input font-mono tracking-widest uppercase"
                  placeholder="INVITE CODE"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </>
            )}
            {error && <p className="text-pink text-sm mt-3">{error}</p>}
            <div className="flex gap-2 mt-5">
              <button
                className="btn-primary"
                disabled={busy || (panel === 'create' ? !name.trim() : code.length < 6)}
                onClick={panel === 'create' ? createWs : joinWs}
              >
                {busy ? 'Working…' : panel === 'create' ? 'Create & open' : 'Join'}
              </button>
              <button className="btn-ghost" onClick={() => setPanel(null)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Workspace grid */}
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : workspaces.length === 0 ? (
          <div className="panel p-12 text-center">
            <p className="text-muted">No workspaces yet. Create one or join your team with a code.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <button
                key={ws._id}
                onClick={() => navigate(`/w/${ws._id}`)}
                className="panel p-5 text-left hover:border-border-bright transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-lg bg-signal grid place-items-center font-display font-700 text-void">
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <span className="font-mono text-xs text-muted bg-void border border-border rounded px-2 py-1">
                    {ws.inviteCode}
                  </span>
                </div>
                <h3 className="font-display font-600 text-lg mt-3 group-hover:text-cyan transition-colors">
                  {ws.name}
                </h3>
                <p className="text-sm text-muted mt-1 line-clamp-2 min-h-[2.5rem]">
                  {ws.description || 'No description.'}
                </p>
                <div className="text-xs text-muted-2 mt-3">
                  {ws.members.length} member{ws.members.length !== 1 ? 's' : ''} · updated{' '}
                  {timeAgo(ws.updatedAt)}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
