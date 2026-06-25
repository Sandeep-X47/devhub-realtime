import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Wordmark, Logo } from '../components/Brand.jsx';

const FEATURES = [
  { k: 'Editor', d: 'Real Monaco editor — the engine inside VS Code.', c: '#22d3ee' },
  { k: 'Team chat', d: 'Talk to your team without leaving the code.', c: '#34d399' },
  { k: 'Snapshots', d: 'Lightweight version history. Restore in one click.', c: '#fbbf24' },
  { k: 'AI doubts', d: 'Ask a Llama model about your actual files.', c: '#a78bfa' },
];

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full grid lg:grid-cols-2">
      {/* ── Hero / thesis ─────────────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(700px 500px at 20% 10%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(600px 500px at 90% 90%, rgba(167,139,250,0.14), transparent 60%)',
          }}
        />
        <div className="relative">
          <Wordmark size={34} />
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display font-700 text-4xl leading-[1.1] tracking-tight">
            One screen for the
            <br />
            whole <span className="gradient-text">hackathon</span>.
          </h1>
          <p className="mt-4 text-muted leading-relaxed">
            Stop alt-tabbing between an editor, a chat app, Git, and an AI tab. DevHub puts your
            code, your team, your versions, and your AI assistant in a single workspace — built for
            student teams who'd rather build than switch apps.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.k} className="panel p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: f.c }} />
                  <span className="font-display font-600 text-sm">{f.k}</span>
                </div>
                <p className="mt-1.5 text-xs text-muted leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-muted-2 font-mono">
          built for hackathon teams · MERN + Socket.IO + Llama
        </div>
      </div>

      {/* ── Auth form ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <Wordmark size={30} />
          </div>

          <div className="panel p-7 shadow-panel animate-fade-up">
            <div className="flex items-center gap-2 mb-1">
              <Logo size={22} />
              <h2 className="font-display font-600 text-xl">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
            </div>
            <p className="text-sm text-muted mb-6">
              {mode === 'login'
                ? 'Sign in to jump back into your workspace.'
                : 'One account for your whole team to collaborate.'}
            </p>

            <form onSubmit={submit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-muted mb-1.5">Name</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Ada Lovelace"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-muted mb-1.5">Email</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@college.edu"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Password</label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-pink bg-pink/10 border border-pink/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-muted">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                className="text-cyan hover:underline font-medium"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
