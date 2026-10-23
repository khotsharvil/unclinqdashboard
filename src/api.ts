// Minimal API client for the therapist dashboard → B2B2C backend.
// Shares the backend with the client app: auth (OTP), invitations, and (later)
// clients/sessions/briefings. Token is stored in localStorage('unclinq_token').

// API base. In production (static host, no dev proxy) this MUST be the absolute
// backend URL, set at build time via VITE_API_URL (e.g.
// https://unclinq-backend-production.up.railway.app/api). Falls back to the
// relative '/api' so local dev keeps using the Vite proxy.
const BASE: string = (import.meta as any).env?.VITE_API_URL || '/api';

// Public legal pages served by the backend at /legal/<slug>.
export const LEGAL_BASE = BASE.replace(/\/api\/?$/, '') + '/legal';
export const legalUrl = (slug: string) => `${LEGAL_BASE}/${slug}`;

export function getToken(): string | null {
  try { return localStorage.getItem('unclinq_token'); } catch { return null; }
}
export function getUser(): any {
  try { return JSON.parse(localStorage.getItem('unclinq_user') || 'null'); } catch { return null; }
}
export function setAuth(_token: string, user: any) {
  // #11 flip: the JWT now lives in the httpOnly cookie the backend set on the
  // login response — never store it in localStorage (XSS can't read a cookie it
  // can read localStorage). We keep only the user object as the logged-in flag.
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
  if (MUTATING.has(method.toUpperCase())) {
    const csrf = getCsrf();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    credentials: 'include', // auth rides on the httpOnly cookie (#11)
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    onUnauthorized(res.status, path);
    throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status, data });
  }
  return data;
}

// A 401 on an AUTHENTICATED request means the session expired — clear it and
// reload so the app falls back to the login screen. Auth endpoints (bad OTP,
// etc.) are excluded so login errors surface inline instead of reloading.
function onUnauthorized(status: number, path: string) {
  // "Was logged in" is now signalled by the cached user, not a JS-visible token.
  if (status === 401 && getUser() && !path.startsWith('/auth/')) {
    clearAuth();
    if (typeof window !== 'undefined') window.location.reload();
  }
}

// Multipart (image upload) — do NOT set Content-Type; the browser sets the boundary.
async function requestForm(path: string, form: FormData) {
  const headers: Record<string, string> = {};
  const csrf = getCsrf();
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const res = await fetch(BASE + path, { method: 'POST', headers, credentials: 'include', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    onUnauthorized(res.status, path);
    throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status, data });
  }
  return data;
}

export const api = {
  get: (p: string) => request('GET', p),
  post: (p: string, b?: any) => request('POST', p, b),
  patch: (p: string, b?: any) => request('PATCH', p, b),
  del: (p: string) => request('DELETE', p),
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
  recordConsent: (payload: any) => api.post('/auth/consent', payload),
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
  free_text?: string;
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
    // WhatsApp invite: a phone number makes the backend send the invite on WhatsApp
    // and return a join link (wa.me) the therapist can also share themselves.
    client_phone?: string;
    client_language?: string;
    client_gender?: string;
  }) => api.post('/invitations', data),
  list: () => api.get('/invitations'),
  revoke: (id: string) => api.post(`/invitations/${id}/revoke`),
  resend: (id: string): Promise<{ wa_status: string; wa_error?: string | null; join_link?: string | null }> =>
    api.post(`/invitations/${id}/resend`, {}),
};

// Languages a client can use with Emora (code = the language code the backend expects).
export const CLIENT_LANGUAGES: { code: string; label: string }[] = [
  { code: 'hi-IN', label: 'Hindi · हिन्दी' },
  { code: 'mr-IN', label: 'Marathi · मराठी' },
  { code: 'en-IN', label: 'English' },
  { code: 'bn-IN', label: 'Bengali · বাংলা' },
  { code: 'te-IN', label: 'Telugu · తెలుగు' },
  { code: 'ta-IN', label: 'Tamil · தமிழ்' },
  { code: 'gu-IN', label: 'Gujarati · ગુજરાતી' },
  { code: 'ur-IN', label: 'Urdu · اردو' },
  { code: 'kn-IN', label: 'Kannada · ಕನ್ನಡ' },
  { code: 'od-IN', label: 'Odia · ଓଡ଼ିଆ' },
  { code: 'ml-IN', label: 'Malayalam · മലയാളം' },
];
export const CLIENT_GENDERS: { code: string; label: string }[] = [
  { code: 'female', label: 'Woman' },
  { code: 'male', label: 'Man' },
  { code: 'non_binary', label: 'Non-binary' },
  { code: 'prefer_not_to_say', label: 'Prefer not to say' },
];

// Unclinq-team admin (Admin tab). The backend only answers for ADMIN_EMAILS accounts.
export const consoleApi = {
  me: () => api.get('/console/me'),
  therapists: () => api.get('/console/therapists'),
  addTherapist: (b: { name: string; email: string; seats?: number }) => api.post('/console/therapists', b),
};

export const therapistApi = {
  clients: () => api.get('/therapist/clients'),
  overview: (id: string) => api.get(`/therapist/clients/${id}/overview`),
  journey: (id: string) => api.get(`/therapist/clients/${id}/journey`),
  briefing: (id: string) => api.get(`/therapist/clients/${id}/briefing`),
  // Pilot metric B — one-tap "did this briefing help you prepare?" (note only after 👎).
  briefingFeedback: (id: string, body: { briefing_id: string; useful: boolean; note?: string }) =>
    api.post(`/therapist/clients/${id}/briefing/feedback`, body),
  notes: (id: string) => api.get(`/therapist/clients/${id}/notes`),
  session: (sessionId: string) => api.get(`/sessions/${sessionId}`),
  // Therapist records/uploads a session FOR a client (backend resolves client_id
  // against an active consent link). Audio streams to transcription, never stored.
  // levels: optional per-source loudness timeline from an online recording (no audio content).
  uploadSession: (clientId: string, file: Blob, filename = 'session.webm', occurredAt?: string, levels?: string | null) => {
    const f = new FormData();
    f.append('audio', file, filename);
    f.append('client_id', clientId);
    if (occurredAt) f.append('occurred_at', occurredAt);
    if (levels) f.append('levels', levels);
    return api.postForm('/sessions', f);
  },
  sessions: (clientId: string) => api.get(`/sessions?client_id=${encodeURIComponent(clientId)}`),
  // Approve a draft session's AI understanding → activates memory, releases actions.
  approveSession: (sessionId: string) => api.post(`/sessions/${sessionId}/approve-summary`, {}),
  editSessionSummary: (sessionId: string, session_summary: string) => api.patch(`/sessions/${sessionId}/summary`, { session_summary }),
  addNote: (id: string, body: string) => api.post(`/therapist/clients/${id}/notes`, { body }),
  editNote: (noteId: string, body: string) => api.patch(`/therapist/notes/${noteId}`, { body }),
  deleteNote: (noteId: string) => api.del(`/therapist/notes/${noteId}`),
  profile: () => api.get('/therapist/profile'),
  // How Emora addresses a client: language + gender (therapist-set; never guessed).
  clientProfile: (id: string): Promise<{ gender: string | null; language: string | null }> => api.get(`/therapist/clients/${id}/profile`),
  updateClientProfile: (id: string, body: { gender?: string | null; language?: string | null }) =>
    api.patch(`/therapist/clients/${id}/profile`, body),

  // Journey/memory items — free-text add + inline edit + soft-delete (everything editable).
  addMemory: (id: string, content: string, kind?: string) => api.post(`/therapist/clients/${id}/memory`, { content, kind }),
  editMemory: (id: string, memId: string, body: { content?: string; active?: boolean }) =>
    api.patch(`/therapist/clients/${id}/memory/${memId}`, body),
  deleteMemory: (id: string, memId: string) => api.del(`/therapist/clients/${id}/memory/${memId}`),

  // Actions / exercises — assign + edit + delete.
  assignExercise: (id: string, description: string, extra?: { rationale?: string; cadence?: string; review_next?: boolean }) =>
    api.post(`/therapist/clients/${id}/exercises`, { description, ...(extra || {}) }),
  // AI-tailored, client-specific action suggestions (grounded in real context).
  // modalities = the therapist's ways of working, so ideas fit their approach.
  suggestActions: (id: string, modalities?: string[]): Promise<{ suggestions: { title: string; cadence: string; rationale: string }[] }> =>
    api.post(`/therapist/clients/${id}/suggest-actions`, { modalities }),
  editExercise: (id: string, exId: string, body: { description?: string; status?: string }) =>
    api.patch(`/therapist/clients/${id}/exercises/${exId}`, body),
  deleteExercise: (id: string, exId: string) => api.del(`/therapist/clients/${id}/exercises/${exId}`),

  // Seed an existing client's history (see backend migration 010).
  seedContext: (id: string, data: any) => api.post(`/therapist/clients/${id}/context/seed`, data),

  // Assessments / tests (any type; freeform).
  assessments: (id: string) => api.get(`/therapist/clients/${id}/assessments`),
  addAssessment: (id: string, data: Assessment) => api.post(`/therapist/clients/${id}/assessments`, data),
  editAssessment: (id: string, aid: string, data: Partial<Assessment>) => api.patch(`/therapist/clients/${id}/assessments/${aid}`, data),
  deleteAssessment: (id: string, aid: string) => api.del(`/therapist/clients/${id}/assessments/${aid}`),
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
