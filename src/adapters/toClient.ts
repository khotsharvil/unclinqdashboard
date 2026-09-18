// Adapter: real B2B2C backend → the dashboard's rich `Client` shape.
//
// The whole point: the Workspace tabs (Briefing/Journey/Sessions/Actions/Notes)
// stay byte-for-byte unchanged. We only change where their `client` object comes
// from — mock → this adapter. Everything is defensive: missing backend data maps
// to safe empty structures so no tab ever crashes.

import { therapistApi } from '../api';
import type {
  Client, BriefingData, JourneyPattern, SessionRecord, ActionItem, TherapistNote,
  ActivityItem, ScheduledSession,
} from '../types';

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function msToTs(ms?: number): string {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function initials(name = ''): string {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'C';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}
function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function fmtFull(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ACTION_STATUS: Record<string, ActionItem['status']> = {
  assigned: 'in_progress', in_progress: 'in_progress', done: 'completed', skipped: 'needs_discussion',
};

function emptyBriefing(): BriefingData {
  return {
    whatChanged: { text: '', mentionsCount: 0, journalCount: 0, conversationsCount: 0, evidenceGroupId: '' },
    clientWantsToDiscuss: { quote: '', context: '', conversationEvidenceId: '' },
    whatTheyTried: [],
    observedPattern: { text: '', observedCount: 0, lastSeen: '', evidenceGroupId: '', clinicalNoteSeparateFromObservation: '' },
    worthExploring: [],
    context: { previousSessionDate: '', keyPoints: [], previousSessionId: '' },
  };
}

// Build the client-facing BriefingData from the backend's structured briefing.
function toBriefing(structured: any, journey: any, latestSessionDate: string): BriefingData {
  const b = emptyBriefing();
  if (!structured) {
    // Still surface goals as context so the tab isn't empty for a freshly-seeded client.
    b.context.keyPoints = (journey?.goals || []).slice(0, 4);
    b.context.previousSessionDate = latestSessionDate;
    return b;
  }
  const s = structured;
  // Lead with a plain-language statement of the week's main development — NEVER a
  // bare intensity number. Intensity is shown as a secondary metric below.
  const changedText =
    s.current_focus ||
    (s.main_trigger ? `Main theme: ${s.main_trigger}.` : '') ||
    s.pattern ||
    (s.key_event?.trigger ? `Came up: ${s.key_event.trigger}.` : '') ||
    (s.reflection ? `In their words: “${s.reflection}”.` : '') ||
    // Reflect whatever we have: even a short check-in with no structured event.
    (s.check_in?.insight ? `Checked in with Emora: ${s.check_in.insight}` : '') ||
    (s.check_in?.count
      ? `${s.check_in.count} between-session check-in${s.check_in.count > 1 ? 's' : ''} so far — early days; more will surface as they keep using it.`
      : '') ||
    'Some between-session activity was captured.';
  // Accurate per-source capture counts (no double-counting). by_source is a map
  // like { emora: 2, journal: 1, voice: 1 }; fall back to the total event count.
  const bySource = s.sources?.by_source || {};
  b.whatChanged = {
    text: changedText,
    // Repurpose the three count slots as: Emora chats · journal/voice notes · check-ins(reflections).
    mentionsCount: bySource.emora || s.check_in?.count || 0,
    journalCount: (bySource.journal || 0) + (bySource.voice || 0),
    conversationsCount: s.sources?.conversations || s.sources?.reflections || 0,
    momentCount: s.sources?.events || s.event_count || 0,
    bySource,
    evidenceGroupId: 'ev-changed',
  } as any;
  // "Wants to discuss" prefers an explicit prepare-reflection; otherwise surface the
  // client's own verbatim words from the moment (better than an empty quote).
  b.clientWantsToDiscuss = {
    quote: s.wants_to_discuss || s.reflection || s.key_event?.trigger || '',
    context: s.why_flagged || (s.wants_to_discuss ? '' : (s.reflection ? 'From what they shared with Emora' : '')),
    conversationEvidenceId: 'ev-discuss',
  };
  if (s.technique_application) {
    b.whatTheyTried = [{ id: 'tech', name: s.technique_application, attempted: 1, completed: 0, clientResponse: '', status: 'mixed' }];
  }
  b.observedPattern = {
    text: s.pattern || '',
    observedCount: s.recurrence_count || 0,
    lastSeen: '',
    evidenceGroupId: 'ev-pattern',
    clinicalNoteSeparateFromObservation: '',
  };
  // Worth-exploring + engagement prompt, plain and non-prescriptive.
  const explore: string[] = [];
  if (s.why_flagged) explore.push(`Client chose to bring this in: "${s.why_flagged}"`);
  if (s.engagement?.direction === 'quieter') explore.push('Quieter than their recent baseline — may be worth gently exploring.');
  if (s.engagement?.assigned_not_started > 0) explore.push('An assigned action hasn’t been picked up yet.');
  if (s.wants_to_discuss) explore.push(s.wants_to_discuss);
  // Fallbacks so this is never empty — but as genuine, gentle EXPLORATION PROMPTS,
  // NOT a copy of the observed pattern (§04) or the quote (§02). Kept short and
  // phrased as an opening the therapist might take in-session.
  if (explore.length === 0) {
    const shortTrigger = (t: any) => { const x = String(t || '').split(/[;→]/)[0].trim(); return x.length > 64 ? x.slice(0, 64) + '…' : x; };
    if (s.recurrence_count > 1) {
      explore.push(`This has recurred ${s.recurrence_count} times — worth exploring what keeps bringing it back.`);
    } else if (s.recurrence_of) {
      explore.push(`Worth exploring what sits underneath “${shortTrigger(s.recurrence_of)}”.`);
    } else if (s.main_trigger) {
      explore.push(`Worth exploring what makes “${shortTrigger(s.main_trigger)}” land so hard.`);
    } else if (s.reflection) {
      explore.push('Worth gently unpacking what they shared this week.');
    }
  }
  b.worthExploring = explore;
  b.context = { previousSessionDate: latestSessionDate, keyPoints: (journey?.goals || []).slice(0, 4), previousSessionId: '' };
  return b;
}

const SRC: Record<string, 'Journal' | 'Emora' | 'Check-in' | 'Voice' | 'Exercise'> = {
  journal: 'Journal', emora: 'Emora', check_in: 'Check-in', manual: 'Check-in', exercise: 'Exercise', voice: 'Voice',
};

// Build the evidence store so "View supporting moments" resolves to real, dated
// moments in the client's own words. Every AI claim on the dashboard drills to this.
function buildEvidenceStore(journey: any): Record<string, any> {
  // id → EvidenceItem, from the raw events + significant moments the model carries.
  const byId: Record<string, any> = {};
  for (const e of journey?.events || []) {
    if (!e.id) continue;
    byId[e.id] = { id: e.id, date: fmtDate(e.occurred_at), source: SRC[e.source] || 'Check-in', snippet: e.reflection || e.trigger || 'A logged moment' };
  }
  for (const m of journey?.significant_moments || []) {
    if (!m.id) continue;
    byId[m.id] = { id: m.id, date: fmtDate(m.at), source: SRC[m.source] || byId[m.id]?.source || 'Check-in', snippet: m.reflection || m.trigger || 'A significant moment', context: m.share_reason || undefined };
  }
  const item = (r: any) => byId[r.id] || { id: r.id || Math.random().toString(36).slice(2), date: fmtDate(r.at), source: 'Check-in' as const, snippet: r.trigger || 'A logged moment' };
  const group = (id: string, title: string, refs: any[]) => ({ id, title, items: (refs || []).map(item) });

  const store: Record<string, any> = {};
  const patterns = journey?.patterns || [];
  const changes = journey?.observed_changes || [];
  const sig = journey?.significant_moments || [];

  store['ev-pattern'] = group('ev-pattern', patterns[0]?.trigger ? `“${patterns[0].trigger}” — supporting moments` : 'Supporting moments', patterns[0]?.evidence || []);
  store['ev-changed'] = group('ev-changed', 'What changed — supporting moments', (changes.flatMap((c: any) => c.evidence || [])).slice(0, 8));
  store['ev-discuss'] = group('ev-discuss', 'In the client’s words', sig.slice(0, 5).map((m: any) => ({ id: m.id, at: m.at, trigger: m.trigger })));
  patterns.forEach((p: any, i: number) => { store[`pat-${i}`] = group(`pat-${i}`, p.trigger || p.chain || 'Recurring pattern', p.evidence || []); });
  // Fallbacks so a group is never totally empty when we do have moments.
  const allSig = sig.map((m: any) => ({ id: m.id, at: m.at, trigger: m.trigger }));
  for (const k of ['ev-changed', 'ev-discuss', 'ev-pattern']) if (!store[k].items.length) store[k] = group(k, store[k].title, allSig);
  return store;
}

function toPatterns(journey: any): JourneyPattern[] {
  return (journey?.patterns || []).map((p: any, i: number): JourneyPattern => ({
    id: `pat-${i}`,
    name: p.trigger || p.chain || 'Recurring pattern',
    firstObserved: '',
    lastObserved: fmtDate(p.last_at),
    observedCount: p.count || 0,
    supportingMomentsCount: (p.evidence || []).length,
    evidenceGroupId: '',
    intervention: { name: '', introducedDate: '', description: '' },
    applied: { attemptsCount: 0, details: '' },
    clientResponse: p.chain || '',
    timeline: [],
  }));
}

// Seeded history → a synthetic "initial session" record so the therapist sees the
// starting context inside the existing Sessions tab (which already renders
// isInitialSession with presentingConcerns / background / clientGoals).
function seededInitialSession(journey: any): SessionRecord | null {
  const care = journey?.care_context;
  const concerns = (journey?.themes || []); // themes include client_concern for therapist audience
  const goals = journey?.goals || [];
  if (!care && !concerns.length && !goals.length) return null;
  return {
    id: 'seed-initial',
    sessionNumber: 0,
    date: fmtFull(care?.started_at) || 'Before Unclinq',
    isInitialSession: true,
    gettingToKnowTitle: 'History before Unclinq',
    presentingConcerns: concerns.slice(0, 6),
    background: care?.prior_sessions ? `${care.prior_sessions} prior session${care.prior_sessions === 1 ? '' : 's'} before joining Unclinq.` : '',
    clientGoals: goals.join('; '),
    initialDirection: journey?.current_focus || '',
    summary: care?.client_summary || journey?.current_focus || 'Seeded starting context.',
    keyThemes: concerns.slice(0, 6),
    interventions: (journey?.interventions || []).map((x: any) => x.label).slice(0, 6),
    homework: '',
    therapistObservations: '',
    transcript: [],
  };
}

const MEM_INTERVENTION = ['intervention', 'therapist_guidance', 'agreed_action'];

// Full session records — fetches each session's detail (transcript + memory +
// exercises) in parallel and maps into the Sessions tab shape.
async function buildSessions(clientId: string, journey: any): Promise<SessionRecord[]> {
  // ALL sessions (draft + approved + still-processing) — NOT just the approved
  // ones in the journey model — so a freshly recorded session appears immediately
  // with an Approve action, instead of vanishing until it's approved.
  let list: any[] = [];
  try { const r = await therapistApi.sessions(clientId); list = r.sessions || []; }
  catch { list = journey?.sessions || []; }
  list = list
    .filter((s: any) => s.status !== 'failed')
    .slice()
    .sort((a: any, b: any) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
  // Fetch detail (transcript/memory/exercises) only for finished sessions.
  const details = await Promise.all(list.map((s: any) => (s.status === 'ready' ? therapistApi.session(s.id).catch(() => null) : Promise.resolve(null))));
  const real = list.map((s: any, i: number): SessionRecord => {
    const d = details[i] || {};
    const mem = d.memory || [];
    const segs = d.transcript || [];
    const ready = s.status === 'ready';
    const secs = d.session?.duration_seconds || s.duration_seconds;
    return {
      id: s.id,
      sessionNumber: i + 1,
      date: fmtFull(s.occurred_at),
      duration: secs ? `${Math.round(secs / 60)} min` : undefined,
      summary: d.session?.session_summary || s.session_summary || (ready ? 'Session recorded.' : 'Transcribing & summarising…'),
      processing: !ready,
      summaryStatus: s.summary_status,
      needsApproval: ready && s.summary_status === 'draft',
      keyThemes: mem.filter((m: any) => m.kind === 'theme').map((m: any) => m.content).slice(0, 8),
      interventions: mem.filter((m: any) => MEM_INTERVENTION.includes(m.kind)).map((m: any) => m.content).slice(0, 8),
      homework: (d.exercises || []).map((e: any) => e.description).filter(Boolean).join('; '),
      therapistObservations: '',
      transcript: segs.map((t: any) => ({
        speaker: (t.speaker === 'therapist' ? 'Therapist' : 'Client') as 'Therapist' | 'Client',
        timestamp: msToTs(t.start_ms),
        text: t.text || '',
      })),
    };
  });
  const seed = seededInitialSession(journey);
  return seed ? [seed, ...real] : real;
}

function toActions(exercises: any[]): ActionItem[] {
  return (exercises || []).map((e: any): ActionItem => ({
    id: e.id,
    title: e.description || 'Action',
    assignedDate: '',
    attempts: 0,
    lastAttemptedDate: e.feedback ? 'Reported' : 'Pending',
    clientResponse: e.feedback || 'Pending client attempt.',
    status: ACTION_STATUS[e.status] || 'in_progress',
  }));
}

function toNotes(notes: any[]): TherapistNote[] {
  return (notes || []).map((n: any): TherapistNote => ({
    id: n.id,
    date: fmtFull(n.created_at),
    content: n.body || '',
    isPrivate: true,
    category: 'clinical_impression',
  }));
}

// Lightweight stub for the caseload LIST (no per-client fetch). Hydrated fully via
// loadRealClient when the therapist opens the client.
export function toClientStub(row: any): Client {
  const b = emptyBriefing();
  return {
    id: row.client_id || row.id,
    name: row.name || 'Client',
    avatarInitials: initials(row.name),
    email: row.email,
    contactEmail: row.email,
    portalStatus: 'active',
    status: (row.open_signals > 0 ? 'needs_attention' : 'active'),
    briefingStatus: row.new_activity_since_briefing ? 'new_activity' : (row.latest_briefing_at ? 'ready' : 'no_activity'),
    nextSession: row.next_session_at
      ? { display: fmtDate(row.next_session_at), time: '', date: String(row.next_session_at).slice(0, 10), isToday: false }
      : null,
    lastSession: row.latest_session_at
      ? { display: fmtDate(row.latest_session_at), date: String(row.latest_session_at).slice(0, 10) }
      : null,
    briefing: b,
    journeyPatterns: [],
    sessions: [],
    actions: [],
    notes: [],
    evidenceStore: {},
    _real: true,
  } as Client & { _real?: boolean };
}

// Real journey → the JourneyView track shape. Built ENTIRELY from the backend
// journey spine (starting / session / between-session nodes) + observed_changes.
// No hardcoded clinical phrases — fields with no real data are left empty.
function toTherapyJourneys(journey: any): any[] {
  const spine: any[] = journey?.spine || [];
  const steps = spine.filter((n) => n && n.type !== 'now').map((n: any) => {
    if (n.type === 'starting') {
      return {
        week: 'Start', phaseTitle: n.label || 'Where they started', dateRange: n.started_at ? fmtFull(n.started_at) : '',
        therapeuticFocus: { title: 'Starting context', detail: n.summary || '—' },
        intervention: { name: '', description: n.prior_sessions ? `${n.prior_sessions} prior session${n.prior_sessions === 1 ? '' : 's'} before Unclinq.` : '' },
        clientApplication: { attemptsCount: 0, details: '' },
        clientResponse: { verbatimQuote: '', summary: '' },
        observedChange: { summary: '' },
      };
    }
    if (n.type === 'session') {
      return {
        week: `Session ${n.n}`, phaseTitle: 'Session', dateRange: n.at ? fmtFull(n.at) : '',
        therapeuticFocus: { title: 'In the session', detail: n.summary || 'Session recorded.' },
        intervention: { name: n.intervention || '', description: '' },
        clientApplication: { attemptsCount: 0, details: '' },
        clientResponse: { verbatimQuote: '', summary: '' },
        observedChange: { summary: '' },
      };
    }
    // between-session period
    const intens = n.intensity ? `${n.intensity.from} → ${n.intensity.to}/10` : '';
    return {
      week: n.label || 'Between sessions', phaseTitle: n.label || 'Between sessions', dateRange: n.from ? fmtFull(n.from) : '',
      therapeuticFocus: { title: 'What came up', detail: n.top_trigger || 'Between-session activity' },
      intervention: { name: n.tried?.technique || '', description: n.tried?.outcome ? `Outcome: ${n.tried.outcome}` : '' },
      clientApplication: { attemptsCount: n.count || 0, details: n.count ? `${n.count} moment${n.count === 1 ? '' : 's'} captured` : '' },
      clientResponse: { verbatimQuote: n.quote || '', summary: '' },
      observedChange: { summary: intens ? `Intensity ${intens}` : '' },
    };
  });
  if (!steps.length) return [];
  const oc: any[] = journey?.observed_changes || [];
  const track: any = {
    id: 'real-journey',
    title: journey?.current_focus || 'Therapy journey',
    subtitle: 'Built from real sessions and between-session activity.',
    observedPeriod: '',
    steps,
  };
  if (oc.length) {
    const dimensions = oc.slice(0, 3).map((c: any) => {
      if (c.kind === 'intensity') {
        const easing = typeof c.from === 'number' && typeof c.to === 'number' && c.from > c.to;
        const rising = typeof c.from === 'number' && typeof c.to === 'number' && c.from < c.to;
        return { label: 'Intensity', statusText: easing ? 'Easing' : rising ? 'Rising' : 'Holding', trend: easing ? 'up' : rising ? 'down' : 'stable', description: c.text || '' };
      }
      return { label: 'Pattern', statusText: 'Recognised', trend: 'emerging', description: c.text || '' };
    });
    track.synthesis = {
      dimensions,
      overallTrajectory: dimensions.some((d) => d.trend === 'up') ? 'Improving' : 'In progress',
      therapeuticImplication: oc.map((c: any) => c.text).filter(Boolean).join(' · '),
    };
  }
  return [track];
}

// Fetch everything for one client and assemble the Client object the tabs consume.
export async function loadRealClient(clientId: string): Promise<Client> {
  const [ov, jr, br, nt] = await Promise.all([
    therapistApi.overview(clientId).catch(() => ({} as any)),
    therapistApi.journey(clientId).catch(() => ({} as any)),
    therapistApi.briefing(clientId).catch(() => ({} as any)),
    therapistApi.notes(clientId).catch(() => ({} as any)),
  ]);

  const user = ov.client || {};
  // The journey endpoint returns the model plus raw sessions/events/milestones at the
  // TOP level — merge them onto the model so the mappers can read journey.events etc.
  const journey = jr.journey || {};
  journey.events = jr.events || journey.events || [];
  journey.sessions = jr.sessions || journey.sessions || [];
  journey.milestones = jr.milestones || journey.milestones || [];
  const briefing = br.briefing?.structured || null;
  const latestDate = fmtFull(ov.latest_session?.occurred_at);
  const hasActivity = (journey.session_count || 0) > 0 || (journey.significant_moments || []).length > 0
    || (journey.events || []).length > 0 || (briefing?.check_in?.count || 0) > 0 || !!briefing;

  return {
    id: user.id || clientId,
    name: user.name || 'Client',
    avatarInitials: initials(user.name),
    email: user.email,
    contactEmail: user.email,
    portalStatus: 'active',
    status: 'active',
    briefingStatus: hasActivity ? 'ready' : 'no_activity',
    nextSession: ov.next_session_at
      ? { display: fmtDate(ov.next_session_at), time: '', date: String(ov.next_session_at).slice(0, 10), isToday: false }
      : null,
    lastSession: ov.latest_session?.occurred_at
      ? { display: fmtDate(ov.latest_session.occurred_at), date: String(ov.latest_session.occurred_at).slice(0, 10) }
      : null,
    briefing: toBriefing(briefing, journey, latestDate),
    briefingId: br.briefing?.id,
    briefingFeedback: br.briefing?.feedback ?? null,
    journeyPatterns: toPatterns(journey),
    therapyJourneys: toTherapyJourneys(journey),
    sessions: await buildSessions(clientId, journey),
    actions: toActions(ov.exercises),
    notes: toNotes(nt.notes),
    evidenceStore: buildEvidenceStore(journey),
    assessments: ov.assessments || [],
  };
}

// ── Home + Calendar + pending invites, derived from the real caseload rows ──
// (rows = the /therapist/clients payload; no extra per-client fetch needed.)

// Home activity feed: most-recent between-session activity across clients.
export function toActivities(rows: any[]): ActivityItem[] {
  return (rows || [])
    .filter((r) => r.latest_activity_at)
    .sort((a, b) => new Date(b.latest_activity_at).getTime() - new Date(a.latest_activity_at).getTime())
    .slice(0, 12)
    .map((r) => ({
      id: `act-${r.client_id}`,
      clientId: r.client_id,
      clientName: r.name || 'Client',
      action: r.new_activity_since_briefing ? 'New activity since the last briefing' : 'Logged a between-session moment',
      timeAgo: timeAgo(r.latest_activity_at),
      type: 'journal',
    }));
}

// Calendar: one scheduled session per client with a next_session_at.
export function toScheduledSessions(rows: any[]): ScheduledSession[] {
  return (rows || [])
    .filter((r) => r.next_session_at)
    .map((r) => {
      const dt = new Date(r.next_session_at);
      return {
        id: `sess-${r.client_id}`,
        clientId: r.client_id,
        clientName: r.name || 'Client',
        avatarInitials: initials(r.name),
        clientStatus: (r.open_signals > 0 ? 'needs_attention' : 'active') as Client['status'],
        briefingStatus: (r.new_activity_since_briefing ? 'new_activity' : 'ready') as ScheduledSession['briefingStatus'],
        date: dt.toISOString().slice(0, 10),
        dayOfWeek: DOW[dt.getDay()],
        time: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        duration: '50 min',
        location: 'telehealth',
        isRecurring: false,
        recurringCadence: 'weekly',
        status: 'scheduled',
      };
    });
}

// Pending invitations → non-clickable caseload rows with a "pending" badge.
export function pendingInviteStubs(invitations: any[]): Client[] {
  return (invitations || [])
    .filter((i) => i.status === 'pending')
    .map((i) => {
      const name = i.client_name || i.client_email || 'Invited client';
      return {
        id: `invite:${i.id}`,
        name,
        avatarInitials: initials(name),
        email: i.client_email,
        portalStatus: 'invited',
        status: 'upcoming',
        briefingStatus: 'pending',
        nextSession: null,
        lastSession: null,
        briefing: emptyBriefing(),
        journeyPatterns: [],
        sessions: [],
        actions: [],
        notes: [],
        evidenceStore: {},
        _pending: true,
      } as Client & { _pending: boolean };
    });
}
