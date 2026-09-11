// Minimal API client for the therapist dashboard → B2B2C backend.
// Shares the backend with the client app: auth (OTP), invitations, and (later)
// clients/sessions/briefings. Token is stored in localStorage('unclinq_token').

// API base. In production (static host, no dev proxy) this MUST be the absolute
// backend URL, set at build time via VITE_API_URL (e.g.
// https://unclinq-backend-production.up.railway.app/api). Falls back to the
// relative '/api' so local dev keeps using the Vite proxy.
const BASE: string = (import.meta as any).env?.VITE_API_URL || '/api';

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

// Read the readable (non-httpOnly) CSRF cookie the backend sets on login (#11).
function getCsrf(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)uc_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function request(method: string, path: string, body?: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (MUTATING.has(method.toUpperCase())) {
    const csrf = getCsrf();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    credentials: 'include', // send the httpOnly auth cookie (#11)
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    onUnauthorized(res.status, token, path);
    throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status, data });
  }
  return data;
}

// A 401 on an AUTHENTICATED request means the session expired — clear it and
// reload so the app falls back to the login screen. Auth endpoints (bad OTP,
// etc.) are excluded so login errors surface inline instead of reloading.
function onUnauthorized(status: number, token: string | null, path: string) {
  if (status === 401 && token && !path.startsWith('/auth/')) {
    clearAuth();
    if (typeof window !== 'undefined') window.location.reload();
  }
}

// Multipart (image upload) — do NOT set Content-Type; the browser sets the boundary.
async function requestForm(path: string, form: FormData) {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const csrf = getCsrf();
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const res = await fetch(BASE + path, { method: 'POST', headers, credentials: 'include', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    onUnauthorized(res.status, token, path);
    throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status, data });
  }
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
  // Branch the sign-in UI new-vs-returning before sending a code.
  emailExists: (email: string): Promise<{ exists: boolean }> => api.post('/auth/email-exists', { email }),
  sendOtp: (email: string, purpose = 'login') => api.post('/auth/send-otp', { email, purpose }),
  verifyOtp: (email: string, code: string, purpose = 'login', name?: string) =>
    api.post('/auth/verify-otp', { email, code, purpose, name, role: 'therapist' }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'), // revokes all tokens (token_version bump)

  // Two-factor auth (TOTP)
  twoFactorStatus: (): Promise<{ enabled: boolean }> => api.get('/auth/2fa/status'),
  twoFactorSetup: (): Promise<{ otpauth_url: string; secret: string }> => api.post('/auth/2fa/setup'),
  twoFactorActivate: (code: string) => api.post('/auth/2fa/activate', { code }),
  twoFactorDisable: (code: string) => api.post('/auth/2fa/disable', { code }),
  twoFactorLogin: (pre_auth_token: string, code: string) => api.post('/auth/2fa/login', { pre_auth_token, code }),
};

// A test/assessment the therapist recorded (any type; all freeform). `context`
// is the therapeutic meaning — it attunes Emora and anchors the briefing.
export interface Assessment {
  instrument: string;
  score?: string;
  context?: string;
  taken_at?: string;
  notes?: string;
}

// History captured for an "ongoing" client at invite time (applied on redeem).
export interface SeedContext {
  client_summary?: string;
  wanted_help_with?: string;
  experiencing?: string[];
  focus?: string;
  goals?: string[];
  techniques?: string[];
  concerns?: string[];
  risk_note?: string;
  prior_sessions?: number;
  started_at?: string;
  assessments?: Assessment[];
}

export const invitationsApi = {
  create: (data: {
    client_name?: string;
    client_email?: string;
    expires_in_days?: number;
    relationship_type?: 'new' | 'ongoing';
    seed_context?: SeedContext;
  }) => api.post('/invitations', data),
  list: () => api.get('/invitations'),
  revoke: (id: string) => api.post(`/invitations/${id}/revoke`),
};

export const therapistApi = {
  clients: () => api.get('/therapist/clients'),
  overview: (id: string) => api.get(`/therapist/clients/${id}/overview`),
  journey: (id: string) => api.get(`/therapist/clients/${id}/journey`),
  briefing: (id: string) => api.get(`/therapist/clients/${id}/briefing`),
  notes: (id: string) => api.get(`/therapist/clients/${id}/notes`),
  session: (sessionId: string) => api.get(`/sessions/${sessionId}`),
  // Therapist records/uploads a session FOR a client (backend resolves client_id
  // against an active consent link). Audio streams to transcription, never stored.
  uploadSession: (clientId: string, file: Blob, filename = 'session.webm', occurredAt?: string) => {
    const f = new FormData();
    f.append('audio', file, filename);
    f.append('client_id', clientId);
    if (occurredAt) f.append('occurred_at', occurredAt);
    return api.postForm('/sessions', f);
  },
  sessions: (clientId: string) => api.get(`/sessions?client_id=${encodeURIComponent(clientId)}`),
  addNote: (id: string, body: string) => api.post(`/therapist/clients/${id}/notes`, { body }),
  profile: () => api.get('/therapist/profile'),

  // Seed an existing client's history (see backend migration 010).
  seedContext: (id: string, data: any) => api.post(`/therapist/clients/${id}/context/seed`, data),

  // Assessments / tests (any type; freeform).
  assessments: (id: string) => api.get(`/therapist/clients/${id}/assessments`),
  addAssessment: (id: string, data: Assessment) => api.post(`/therapist/clients/${id}/assessments`, data),
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
