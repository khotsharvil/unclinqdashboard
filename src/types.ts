export type ClientStatus = 'active' | 'needs_attention' | 'inactive' | 'upcoming';

export type BriefingStatus = 'ready' | 'new_activity' | 'no_activity' | 'pending';

export interface EvidenceItem {
  id: string;
  date: string;
  source: 'Journal' | 'Emora' | 'Check-in' | 'Voice' | 'Exercise';
  snippet: string;
  context?: string;
}

export interface EvidenceGroup {
  id: string;
  title: string;
  subtitle?: string;
  items: EvidenceItem[];
}

export interface BriefingData {
  whatChanged: {
    text: string;
    mentionsCount: number;
    journalCount: number;
    conversationsCount: number;
    evidenceGroupId: string;
  };
  clientWantsToDiscuss: {
    quote: string;
    context: string;
    conversationEvidenceId: string;
  };
  whatTheyTried: Array<{
    id: string;
    name: string;
    attempted: number;
    completed: number;
    clientResponse: string;
    status: 'helpful' | 'difficult' | 'mixed';
  }>;
  observedPattern: {
    text: string;
    observedCount: number;
    lastSeen: string;
    evidenceGroupId: string;
    clinicalNoteSeparateFromObservation: string;
  };
  worthExploring: string[];
  context: {
    previousSessionDate: string;
    keyPoints: string[];
    previousSessionId: string;
  };
}

export interface TherapyWeekStep {
  week: string; // e.g. "Week 1", "Week 2", "Week 3", "Week 4"
  phaseTitle: string; // e.g. "Baseline", "Building awareness", "Applying the technique", "Current integration"
  dateRange?: string;
  therapeuticFocus: {
    title: string;
    detail: string;
  };
  intervention: {
    name: string;
    introducedDate?: string;
    description: string;
  };
  clientApplication: {
    attemptsCount?: number;
    details: string;
  };
  clientResponse: {
    verbatimQuote?: string;
    summary: string;
  };
  observedChange: {
    from?: string;
    to?: string;
    summary: string;
  };
}

export interface JourneyDimensionSynthesis {
  label: string;
  trend: 'up' | 'stable' | 'down' | 'emerging';
  statusText: string;
  description: string;
}

export interface JourneyTrajectorySynthesis {
  dimensions: JourneyDimensionSynthesis[];
  overallTrajectory: string;
  therapeuticImplication: string;
}

export interface TherapyJourneyTrack {
  id: string;
  title: string;
  subtitle?: string;
  evidenceGroupId: string;
  supportingMomentsCount: number;
  observedPeriod: string;
  steps: TherapyWeekStep[];
  synthesis: JourneyTrajectorySynthesis;
}

export interface JourneyPattern {
  id: string;
  name: string;
  firstObserved: string;
  lastObserved: string;
  observedCount: number;
  supportingMomentsCount: number;
  evidenceGroupId: string;
  connectedPatterns?: string[];
  intervention: {
    name: string;
    introducedDate: string;
    description: string;
  };
  applied: {
    attemptsCount: number;
    details: string;
  };
  clientResponse: string;
  timeline: Array<{
    period: string;
    stage: 'pattern_emerged' | 'intervention_introduced' | 'intervention_attempted' | 'client_response';
    label: string;
    description: string;
  }>;
}

export interface SessionContinuity {
  builtOn?: {
    sessionNumber: number;
    summary: string;
  };
  ledTo?: {
    activityCount: number;
    description: string;
    nextSessionNumber?: number;
  };
}

export interface SessionBeforeSnapshot {
  whatChanged: string;
  clientActivity?: string[];
  worthExploring?: string;
  contextNotes?: string;
}

export interface SessionDuringWork {
  whatDiscussed: string;
  discussionPoints?: string[];
  therapeuticWork: string;
  therapeuticDetails?: string;
  clientResponse: string;
  clientResponseNuance?: string;
}

export interface SessionAfterTransition {
  agreedAction: string;
  agreedActionItems?: string[];
  therapistNote?: string;
  exercises?: string[];
}

export interface SessionRecord {
  id: string;
  sessionNumber: number;
  date: string;
  time?: string;
  duration?: string; // e.g. "45 min", "50 min"
  isInitialSession?: boolean;
  
  // Initial session specific fields
  gettingToKnowTitle?: string;
  presentingConcerns?: string[];
  background?: string;
  clientGoals?: string;
  initialDirection?: string;

  // Ongoing session lifecycle fields (Before -> During -> After)
  beforeSnapshot?: SessionBeforeSnapshot;
  duringWork?: SessionDuringWork;
  afterTransition?: SessionAfterTransition;
  continuity?: SessionContinuity;

  // Core & Transcript
  summary: string;
  keyThemes: string[];
  interventions: string[];
  homework: string;
  therapistObservations: string;
  transcript: Array<{
    speaker: 'Therapist' | 'Client';
    timestamp: string;
    text: string;
  }>;
}

export interface ActionItem {
  id: string;
  title: string;
  assignedDate: string;
  attempts: number;
  lastAttemptedDate: string;
  clientResponse: string;
  status: 'in_progress' | 'needs_discussion' | 'completed';
  frequency?: string;
}

export interface TherapistNote {
  id: string;
  date: string;
  title?: string;
  content: string;
  isPrivate: true;
  category?: 'clinical_impression' | 'supervision' | 'next_session_prompt';
}

export type RecurrenceCadence = 'weekly' | 'biweekly' | 'monthly' | 'one_time';
export type SessionLocation = 'telehealth' | 'in_person';

export interface NextSessionInfo {
  display: string; // e.g. "Today · 12:30 PM"
  time: string;
  date: string; // YYYY-MM-DD e.g. "2026-08-27"
  isToday: boolean;
  dayOfWeek?: string; // "Thursday"
  duration?: string; // "50 min"
  isRecurring?: boolean;
  cadence?: RecurrenceCadence;
  location?: SessionLocation;
}

export interface Client {
  id: string;
  name: string;
  avatarInitials: string;
  preferredPronouns?: string;
  email?: string;
  phone?: string;
  contactEmail?: string;
  contactPhone?: string;
  portalStatus?: 'active' | 'invited' | 'not_invited';
  invitationSentDate?: string;
  invitationToken?: string;
  status: ClientStatus;
  briefingStatus: BriefingStatus;
  nextSession: NextSessionInfo | null;
  recurringSchedule?: {
    dayOfWeek: string;
    time: string;
    duration: string;
    cadence: RecurrenceCadence;
    location: SessionLocation;
  };
  lastSession: {
    display: string; // e.g. "24 Aug"
    date: string;
  } | null;
  needsAttentionReason?: {
    summary: string;
    worthExploring: string;
  };
  briefing: BriefingData;
  journeyPatterns: JourneyPattern[];
  therapyJourneys?: TherapyJourneyTrack[];
  sessions: SessionRecord[];
  actions: ActionItem[];
  notes: TherapistNote[];
  evidenceStore: Record<string, EvidenceGroup>;
  assessments?: ClientAssessment[];
}

// A test/assessment the therapist recorded (any type; freeform).
export interface ClientAssessment {
  id: string;
  instrument: string;
  score?: string | null;
  context?: string | null;
  taken_at?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface ActivityItem {
  id: string;
  clientId: string;
  clientName: string;
  action: string;
  timeAgo: string;
  type: 'summary' | 'action' | 'journal' | 'checkin';
}

export interface TherapistProfile {
  name: string;
  title: string;
  credentials: string;
  licenseNumber: string;
  email: string;
  phone?: string;
  practiceName: string;
  logoUrl?: string;
  modalities: string[];
  specializations: string[];
  defaultSessionDuration: string;
  briefingPrepTime: string;
  separateInterpretation: boolean;
  somaticEmphasis: boolean;
  onboardingCompleted: boolean;
  onboardingStep?: number;
}

export interface ClientInvitation {
  id: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  preferredPronouns?: string;
  portalLink: string;
  status: 'pending' | 'accepted' | 'expired';
  sentDate: string;
  forms: string[];
  checkInCadence: string;
  customWelcomeNote?: string;
  // Session Day, Time & Recurrence
  sessionDay?: string; // e.g. "Thursday"
  sessionDate?: string; // e.g. "2026-08-27"
  sessionTime?: string; // e.g. "12:30 PM"
  duration?: string; // e.g. "50 min"
  isRecurring?: boolean;
  recurringCadence?: RecurrenceCadence;
  location?: SessionLocation;
}

export interface ScheduledSession {
  id: string;
  clientId: string;
  clientName: string;
  avatarInitials: string;
  clientStatus: ClientStatus;
  briefingStatus: BriefingStatus;
  date: string; // "YYYY-MM-DD" e.g. "2026-08-27"
  dayOfWeek: string; // "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
  time: string; // "12:30 PM"
  duration: string; // "50 min"
  location: SessionLocation;
  isRecurring: boolean;
  recurringCadence: RecurrenceCadence;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  focusTheme?: string;
}
