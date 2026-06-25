import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Workspace from './pages/Workspace.jsx';

function Loader() {
  return (
    <div className="h-full grid place-items-center text-muted">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-signal animate-pulse-signal" />
        Loading DevHub…
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated: a single socket connection wraps the whole app.
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/w/:id" element={<Workspace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}
