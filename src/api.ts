// Minimal API client for the therapist dashboard → B2B2C backend.
// Shares the backend with the client app: auth (OTP), invitations, and (later)
// clients/sessions/briefings. Token is stored in localStorage('unclinq_token').

const BASE = '/api';

export function getToken(): string | null {
  try { return localStorage.getItem('unclinq_token'); } catch { return null; }
}
export function getUser(): any {
  try { return JSON.parse(localStorage.getItem('unclinq_user') || 'null'); } catch { return null; }
}
export function setAuth(token: string, user: any) {
  localStorage.setItem('unclinq_token', token);
  localStorage.setItem('unclinq_user', JSON.stringify(user));
}
export function clearAuth() {
  localStorage.removeItem('unclinq_token');
  localStorage.removeItem('unclinq_user');
}

async function request(method: string, path: string, body?: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status, data });
  return data;
}

// Multipart (image upload) — do NOT set Content-Type; the browser sets the boundary.
async function requestForm(path: string, form: FormData) {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method: 'POST', headers, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status, data });
  return data;
}

export const api = {
  get: (p: string) => request('GET', p),
  post: (p: string, b?: any) => request('POST', p, b),
  patch: (p: string, b?: any) => request('PATCH', p, b),
  postForm: (p: string, f: FormData) => requestForm(p, f),
};

// Client app origin for building invitation links the client opens.
export const CLIENT_APP_URL =
  (import.meta as any).env?.VITE_CLIENT_APP_URL || 'http://localhost:5173';

export const authApi = {
  sendOtp: (email: string, purpose = 'login') => api.post('/auth/send-otp', { email, purpose }),
  verifyOtp: (email: string, code: string, purpose = 'login', name?: string) =>
    api.post('/auth/verify-otp', { email, code, purpose, name, role: 'therapist' }),
  me: () => api.get('/auth/me'),
};

export const invitationsApi = {
  create: (data: { client_name?: string; client_email?: string; expires_in_days?: number }) =>
    api.post('/invitations', data),
  list: () => api.get('/invitations'),
  revoke: (id: string) => api.post(`/invitations/${id}/revoke`),
};

export const therapistApi = {
  clients: () => api.get('/therapist/clients'),
  overview: (id: string) => api.get(`/therapist/clients/${id}/overview`),
  journey: (id: string) => api.get(`/therapist/clients/${id}/journey`),
  briefing: (id: string) => api.get(`/therapist/clients/${id}/briefing`),
  notes: (id: string) => api.get(`/therapist/clients/${id}/notes`),
  addNote: (id: string, body: string) => api.post(`/therapist/clients/${id}/notes`, { body }),
  profile: () => api.get('/therapist/profile'),

  // Seed an existing client's history (see backend migration 010).
  seedContext: (id: string, data: any) => api.post(`/therapist/clients/${id}/context/seed`, data),
  extractContextText: (id: string, text: string) => api.post(`/therapist/clients/${id}/context/extract`, { text }),
  extractContextImage: (id: string, file: File) => {
    const f = new FormData(); f.append('image', file);
    return api.postForm(`/therapist/clients/${id}/context/extract`, f);
  },
  scanNotes: (id: string, file: File) => {
    const f = new FormData(); f.append('image', file);
    return api.postForm(`/therapist/clients/${id}/notes/scan`, f);
  },
};

export function inviteLink(code: string) {
  return `${CLIENT_APP_URL}/#/onboarding?code=${code}`;
}
