const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const auth = {
  register: (body: { email: string; password: string; name: string }) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  googleLogin: (credential: string) =>
    apiFetch('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  googleCodeLogin: (code: string) =>
    apiFetch('/api/auth/google/code', { method: 'POST', body: JSON.stringify({ code }) }),
  googleConfig: () => apiFetch('/api/auth/google/config'),
  me: () => apiFetch('/api/auth/me'),
};

export const endpoints = {
  list: () => apiFetch('/api/endpoints'),
  get: (id: string) => apiFetch(`/api/endpoints/${id}`),
  create: (body: any) => apiFetch('/api/endpoints', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) =>
    apiFetch(`/api/endpoints/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch(`/api/endpoints/${id}`, { method: 'DELETE' }),
  duplicate: (id: string) => apiFetch(`/api/endpoints/${id}/duplicate`, { method: 'POST' }),
};

export const groups = {
  list: () => apiFetch('/api/groups'),
  create: (body: { name: string; color?: string }) => apiFetch('/api/groups', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; color?: string }) => apiFetch(`/api/groups/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch(`/api/groups/${id}`, { method: 'DELETE' }),
};

export const sharedFunctions = {
  list: () => apiFetch('/api/shared-functions'),
  get: (id: string) => apiFetch(`/api/shared-functions/${id}`),
  create: (body: any) => apiFetch('/api/shared-functions', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch(`/api/shared-functions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch(`/api/shared-functions/${id}`, { method: 'DELETE' }),
};
