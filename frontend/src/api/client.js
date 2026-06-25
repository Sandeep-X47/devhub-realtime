const API_URL = import.meta.env.VITE_API_URL || '';

let authToken = localStorage.getItem('devhub_token') || null;

export function setToken(token) {
  authToken = token;
  if (token) localStorage.setItem('devhub_token', token);
  else localStorage.removeItem('devhub_token');
}

export function getToken() {
  return authToken;
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // auth
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  me: () => request('/api/auth/me'),

  // workspaces
  listWorkspaces: () => request('/api/workspaces'),
  createWorkspace: (body) => request('/api/workspaces', { method: 'POST', body }),
  joinWorkspace: (body) => request('/api/workspaces/join', { method: 'POST', body }),
  getWorkspace: (id) => request(`/api/workspaces/${id}`),

  // files + snapshots + messages (nested under workspace id)
  listFiles: (wid) => request(`/api/ws/${wid}/files`),
  createFile: (wid, body) => request(`/api/ws/${wid}/files`, { method: 'POST', body }),
  deleteFile: (wid, fid) => request(`/api/ws/${wid}/files/${fid}`, { method: 'DELETE' }),
  listMessages: (wid, channel) => request(`/api/ws/${wid}/messages?channel=${channel}`),
  listSnapshots: (wid, fileId) =>
    request(`/api/ws/${wid}/snapshots${fileId ? `?fileId=${fileId}` : ''}`),
};
