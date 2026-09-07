// Adapter: real B2B2C backend → the dashboard's rich `Client` shape.
//
// The whole point: the Workspace tabs (Briefing/Journey/Sessions/Actions/Notes)
// stay byte-for-byte unchanged. We only change where their `client` object comes
// from — mock → this adapter. Everything is defensive: missing backend data maps
// to safe empty structures so no tab ever crashes.

import { therapistApi } from '../api';
import type {
  Client, BriefingData, JourneyPattern, SessionRecord, ActionItem, TherapistNote,
} from '../types';

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
  b.whatChanged = {
    text: s.intensity_trend ? `Intensity ${s.intensity_trend}.` : (s.main_trigger ? `Mostly around ${s.main_trigger}.` : 'Some between-session activity was captured.'),
    mentionsCount: s.sources?.events || s.event_count || 0,
    journalCount: s.sources?.events || 0,
    conversationsCount: s.sources?.reflections || 0,
    evidenceGroupId: '',
  };
  b.clientWantsToDiscuss = { quote: s.wants_to_discuss || '', context: s.why_flagged || '', conversationEvidenceId: '' };
  if (s.technique_application) {
    b.whatTheyTried = [{ id: 'tech', name: s.technique_application, attempted: 1, completed: 0, clientResponse: '', status: 'mixed' }];
  }
  b.observedPattern = {
    text: s.pattern || '',
    observedCount: s.recurrence_count || 0,
    lastSeen: '',
    evidenceGroupId: '',
    clinicalNoteSeparateFromObservation: '',
  };
  // Worth-exploring + engagement prompt, plain and non-prescriptive.
  const explore: string[] = [];
  if (s.why_flagged) explore.push(`Client chose to bring this in: "${s.why_flagged}"`);
  if (s.engagement?.direction === 'quieter') explore.push('Quieter than their recent baseline — may be worth gently exploring.');
  if (s.engagement?.assigned_not_started > 0) explore.push('An assigned action hasn’t been picked up yet.');
  if (s.wants_to_discuss) explore.push(s.wants_to_discuss);
  b.worthExploring = explore;
  b.context = { previousSessionDate: latestSessionDate, keyPoints: (journey?.goals || []).slice(0, 4), previousSessionId: '' };
  return b;
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

function toSessions(journey: any): SessionRecord[] {
  const real = (journey?.sessions || []).map((s: any, i: number): SessionRecord => ({
    id: s.id,
    sessionNumber: i + 1,
    date: fmtFull(s.occurred_at),
    summary: s.session_summary || 'Session recorded.',
    keyThemes: [],
    interventions: [],
    homework: '',
    therapistObservations: '',
    transcript: [],
  }));
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

// Fetch everything for one client and assemble the Client object the tabs consume.
export async function loadRealClient(clientId: string): Promise<Client> {
  const [ov, jr, br, nt] = await Promise.all([
    therapistApi.overview(clientId).catch(() => ({} as any)),
    therapistApi.journey(clientId).catch(() => ({} as any)),
    therapistApi.briefing(clientId).catch(() => ({} as any)),
    therapistApi.notes(clientId).catch(() => ({} as any)),
  ]);

  const user = ov.client || {};
  const journey = jr.journey || {};
  const briefing = br.briefing?.structured || null;
  const latestDate = fmtFull(ov.latest_session?.occurred_at);
  const hasActivity = (journey.session_count || 0) > 0 || (journey.significant_moments || []).length > 0 || !!briefing;

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
    journeyPatterns: toPatterns(journey),
    sessions: toSessions(journey),
    actions: toActions(ov.exercises),
    notes: toNotes(nt.notes),
    evidenceStore: {},
  };
}
