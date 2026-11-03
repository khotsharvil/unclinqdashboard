import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  ArrowRight,
  Plus, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  CornerDownRight, 
  Calendar, 
  User, 
  Target, 
  Compass, 
  BookOpen, 
  Quote, 
  Search, 
  X, 
  Check,
  Tag,
  Activity,
  Layers,
  ChevronRight,
  Pencil
} from 'lucide-react';
import { Client, SessionRecord } from '../../types';
import { therapistApi } from '../../api';
import { SessionReview } from './SessionReview';

interface SessionsViewProps {
  client: Client;
  selectedSessionId?: string | null;
  onUpdateTherapistObservation?: (sessionId: string, observations: string) => void;
  onUpdateSession?: (updated: SessionRecord) => void;
  onLogActivity?: (sessionId: string, activity: string, response: string) => void;
  onOpenEvidence?: (evidenceGroupId: string) => void;
  onSetNextSession?: (clientId: string, iso: string | null) => Promise<void>;
  onReviewed?: () => void;
}

type SessionFilter = 'all' | 'recent' | 'initial';

export const SessionsView: React.FC<SessionsViewProps> = ({
  client,
  selectedSessionId,
  onUpdateTherapistObservation,
  onUpdateSession,
  onLogActivity,
  onOpenEvidence,
  onSetNextSession,
  onReviewed,
}) => {
  const [reviewId, setReviewId] = useState<string | null>(null);
  // Inline edit of a session card's fields (free-text; no fixed schema). draft is a
  // deep copy of the session being edited; Save writes the whole record back.
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const startEditCard = (s: SessionRecord) => { setEditCardId(s.id); setDraft(JSON.parse(JSON.stringify(s))); };
  const cancelEditCard = () => { setEditCardId(null); setDraft(null); };
  const saveEditCard = () => {
    if (draft && onUpdateSession) {
      if (typeof draft.__agreedItems === 'string') {
        draft.afterTransition = draft.afterTransition || {};
        draft.afterTransition.agreedActionItems = draft.__agreedItems.split('\n').map((x: string) => x.trim()).filter(Boolean);
        delete draft.__agreedItems;
      }
      onUpdateSession(draft as SessionRecord);
    }
    setEditCardId(null); setDraft(null);
  };
  // Small helpers to update nested draft fields immutably.
  const dset = (path: string, val: string) => setDraft((d: any) => {
    const n = { ...d };
    if (path === 'summaryWhatDiscussed') { n.duringWork = { ...(n.duringWork || {}) }; n.duringWork.whatDiscussed = val; }
    else if (path === 'therapeuticWork') { n.duringWork = { ...(n.duringWork || {}) }; n.duringWork.therapeuticWork = val; }
    else if (path === 'therapeuticDetails') { n.duringWork = { ...(n.duringWork || {}) }; n.duringWork.therapeuticDetails = val; }
    else if (path === 'clientResponse') { n.duringWork = { ...(n.duringWork || {}) }; n.duringWork.clientResponse = val; }
    else if (path === 'clientResponseNuance') { n.duringWork = { ...(n.duringWork || {}) }; n.duringWork.clientResponseNuance = val; }
    else if (path === 'agreedAction') { n.afterTransition = { ...(n.afterTransition || {}) }; n.afterTransition.agreedAction = val; }
    else if (path === 'agreedItems') { n.__agreedItems = val; }
    return n;
  });
  const fieldCls = 'w-full p-2.5 bg-white border border-[#0D9488] rounded-lg text-[13px] sm:text-sm text-[#10151F] leading-relaxed focus:outline-none';
  // Navigation state: null means showing timeline list, or a specific session ID to view full workspace
  const [activeSessionId, setActiveSessionId] = useState<string | null>(selectedSessionId || null);
  const [filterType, setFilterType] = useState<SessionFilter>('all');
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [editingObservations, setEditingObservations] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  // Draft-session approval (a fresh recording is a draft until the therapist approves it).
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  // New session form state

  useEffect(() => {
    if (selectedSessionId) {
      setActiveSessionId(selectedSessionId);
    }
  }, [selectedSessionId]);

  const handleObservationChange = (sessionId: string, text: string) => {
    setEditingObservations(prev => ({
      ...prev,
      [sessionId]: text,
    }));
  };

  const handleSaveObservations = (sessionId: string) => {
    const text = editingObservations[sessionId];
    if (text !== undefined && onUpdateTherapistObservation) {
      onUpdateTherapistObservation(sessionId, text);
      setSavedSuccess(sessionId);
      setTimeout(() => setSavedSuccess(null), 2500);
    }
  };


  // Date range synthesis
  const sortedSessions = [...client.sessions].sort((a, b) => b.sessionNumber - a.sessionNumber);
  const oldestSession = sortedSessions[sortedSessions.length - 1];
  const newestSession = sortedSessions[0];
  const dateRangeDisplay = oldestSession && newestSession
    ? `${oldestSession.date.split(' ').slice(0, 2).join(' ')} – ${newestSession.date.split(' ').slice(0, 2).join(' ')}`
    : 'Aug 10 – Aug 24';

  // Filtered sessions
  const filteredSessions = sortedSessions.filter(session => {
    if (filterType === 'all') return true;
    if (filterType === 'recent') return session.sessionNumber === newestSession?.sessionNumber;
    if (filterType === 'initial') return session.isInitialSession || session.sessionNumber === 1;
    return true;
  });

  const activeSession = client.sessions.find(s => s.id === activeSessionId);

  // -------------------------------------------------------------
  // VIEW 1: INDIVIDUAL SESSION TRANSCRIPT WORKSPACE
  // -------------------------------------------------------------
  if (activeSession) {
    const isInitial = activeSession.isInitialSession || activeSession.sessionNumber === 1;

    const filteredTranscript = (activeSession.transcript || []).filter(turn => 
      transcriptSearch === '' || 
      turn.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      turn.speaker.toLowerCase().includes(transcriptSearch.toLowerCase())
    );

    return (
      <div className="space-y-6 w-full pb-12">
        {reviewId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(16,21,31,0.45)' }}>
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#ECEFF3] shadow-[0_24px_64px_rgba(16,21,31,0.18)] overflow-hidden max-h-[92vh] flex flex-col">
              <div className="px-6 py-4 border-b border-[#F2F5F8]">
                <h2 className="text-[17px] font-serif font-semibold text-[#10151F]">Review session</h2>
                <p className="text-[12px] text-[#6B7686]">with {client.name}</p>
              </div>
              <div className="px-6 py-5 overflow-y-auto">
                <SessionReview
                  sessionId={reviewId}
                  clientId={client.id}
                  clientName={client.name}
                  nextSessionAt={client.nextSession?.at}
                  onSetNextSession={onSetNextSession}
                  onLater={() => setReviewId(null)}
                  onApproved={() => { setApprovedIds((prev) => new Set(prev).add(reviewId)); setReviewId(null); onReviewed?.(); }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Back Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-[#ECEFF3]">
          <div className="flex items-center space-x-3">
            <button
              id="back-to-sessions-btn"
              onClick={() => setActiveSessionId(null)}
              className="u-btn-ghost"
            >
              <ArrowLeft className="w-4 h-4 text-[#6B7686]" />
              <span>Back to Sessions</span>
            </button>
            <span className="text-[#C3CBD6]">/</span>
            <span className="text-[13px] sm:text-sm font-medium text-[#10151F]">
              Session <span className="font-mono tabular-nums">{activeSession.sessionNumber}</span> Transcript
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-mono text-[#6B7686] bg-[#F7F9FB] border border-[#ECEFF3] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
              {activeSession.date}
            </span>
            <span className="text-xs font-mono text-[#6B7686] flex items-center gap-1.5 bg-[#F7F9FB] border border-[#ECEFF3] px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
              {activeSession.duration || '45 min'}
            </span>
          </div>
        </div>

        {(activeSession as any).therapistView && (
          <div className="p-5 sm:p-6 rounded-2xl border border-[#E6E3F5] bg-[#FAFAFE] space-y-1.5">
            <span className="text-[12px] font-semibold text-[#5B54A6]">Your take · only you see this</span>
            <p className="text-[14px] text-[#3A4453] leading-relaxed whitespace-pre-line">{(activeSession as any).therapistView}</p>
          </div>
        )}

        {/* Your notes on this session — editable free-text (no fixed fields) */}
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#ECEFF3] space-y-3">
          <div className="flex items-center justify-between">
            <span className="u-eyebrow">Your notes on this session</span>
            {savedSuccess === activeSession.id && (
              <span className="text-xs text-[#0F766E] font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Saved</span>
            )}
          </div>
          <textarea
            rows={4}
            value={editingObservations[activeSession.id] ?? activeSession.therapistObservations ?? ''}
            onChange={(e) => handleObservationChange(activeSession.id, e.target.value)}
            placeholder="Write anything about this session, in your own words — reflections, what stood out, what to pick up next time. No format needed."
            className="w-full p-3.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] leading-relaxed placeholder-[#9AA4B2] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
          />
          <div className="flex justify-end">
            <button onClick={() => handleSaveObservations(activeSession.id)} className="u-btn-primary text-sm">
              <Check className="w-4 h-4" /> Save notes
            </button>
          </div>
        </div>

        {/* Draft recording → review & approve */}
        {activeSession.processing && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl border border-[#E7EFF0] bg-[#F5FAFA] text-[13px] text-[#0F766E]">
            <Sparkles className="w-4 h-4" />
            <span>This recording is transcribing and summarising — check back in a moment.</span>
          </div>
        )}
        {activeSession.needsApproval && !approvedIds.has(activeSession.id) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border border-[#F3E2C0] bg-[#FCF7EC]">
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-[#B45309] mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-[#8A5A12]">Waiting for your review</p>
                <p className="text-[12px] text-[#9A7B45] mt-0.5">Check the summary and homework. Nothing reaches the client until you approve.</p>
              </div>
            </div>
            <button
              onClick={() => setReviewId(activeSession.id)}
              className="inline-flex items-center gap-1.5 text-[13px] px-3.5 py-2 rounded-lg text-white font-medium cursor-pointer shrink-0"
              style={{ background: '#0D9488' }}
            >
              <Check className="w-4 h-4" />
              Review &amp; send homework
            </button>
          </div>
        )}
        {activeSession.needsApproval && approvedIds.has(activeSession.id) && (
          <div className="flex items-center gap-2 p-4 rounded-2xl border border-[#CDEBE4] bg-[#F0FAF8] text-[13px] text-[#0F766E]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Approved. It now feeds the briefing, and its homework goes to the client.</span>
          </div>
        )}

        {/* Session Transcript View */}
        <div className="p-6 sm:p-8 bg-white rounded-2xl border border-[#ECEFF3] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F2F5F8] pb-5">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="u-chip u-chip-accent text-xs">
                  Verbatim Audio Recording
                </span>
                <span className="text-xs text-[#6B7686]">
                  <span className="font-mono tabular-nums">{activeSession.transcript?.length || 0}</span> spoken turns recorded
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F] mt-2">
                Session {activeSession.sessionNumber} Transcript
              </h3>
              <p className="text-[13px] sm:text-sm text-[#6B7686] mt-1">
                {isInitial
                  ? (activeSession.gettingToKnowTitle || `Getting to know ${client.name.split(' ')[0]}`)
                  : (activeSession.keyThemes?.join(' · ') || 'Work-Related Stress · Sleep')}
              </p>
            </div>

            {/* Transcript Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA4B2]" />
              <input
                type="text"
                placeholder="Search transcript..."
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-[13px] bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] placeholder-[#9AA4B2] focus:outline-hidden focus:border-[#0D9488] focus:bg-white transition-colors"
              />
              {transcriptSearch && (
                <button
                  onClick={() => setTranscriptSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AA4B2] hover:text-[#10151F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Transcript Turns */}
          <div className="space-y-4">
            {filteredTranscript.length === 0 ? (
              <div className="p-8 text-center text-[13px] sm:text-sm text-[#6B7686] bg-[#F7F9FB] rounded-xl border border-[#F2F5F8]">
                No transcript turns found matching "{transcriptSearch}"
              </div>
            ) : (
              filteredTranscript.map((turn, idx) => {
                const isTherapist = turn.speaker === 'Therapist';
                return (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 rounded-xl border text-xs sm:text-sm transition-colors ${
                      isTherapist
                        ? 'bg-[#F7F9FB] border-[#ECEFF3]'
                        : 'bg-white border-[#ECEFF3] border-l-2 border-l-[#0D9488]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-[#6B7686] mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isTherapist ? 'text-[#3A4453]' : 'text-[#0F766E]'}`}>
                          {turn.speaker} {isTherapist && '(You)'}
                        </span>
                        {!isTherapist && (
                          <span className="u-chip u-chip-accent text-[10px]">
                            Client
                          </span>
                        )}
                      </div>
                      <span className="text-[#9AA4B2] font-mono">{turn.timestamp}</span>
                    </div>
                    <p className="text-[#3A4453] text-xs sm:text-sm leading-relaxed font-sans">
                      {turn.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: SESSIONS TIMELINE LIST (Therapist History)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 w-full pb-12">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-[#ECEFF3]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">
            Sessions
          </h2>
          <p className="text-[13px] sm:text-sm text-[#6B7686] mt-1">
            <span className="font-mono tabular-nums">{client.sessions.length}</span> sessions · <span className="font-mono">{dateRangeDisplay}</span>
          </p>
        </div>

      </div>

      {/* Simple Filter Bar: All · Recent · Initial */}
      <div className="flex items-center gap-2 overflow-x-auto text-[13px] sm:text-sm">
        {[
          { id: 'all' as SessionFilter, label: `All (${client.sessions.length})` },
          { id: 'recent' as SessionFilter, label: 'Recent' },
          { id: 'initial' as SessionFilter, label: 'Initial' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors border cursor-pointer ${
              filterType === tab.id
                ? 'bg-[#10151F] border-[#10151F] text-white'
                : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:text-[#10151F] hover:border-[#DCE2EA]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Today Marker Banner */}
      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#ECEFF3]" />
        </div>
        <div className="relative px-4 py-1 bg-white border border-[#ECEFF3] rounded-full u-eyebrow">
          Today · Active therapy timeline
        </div>
      </div>

      {/* Vertical Timeline of Sessions */}
      <div className="relative pl-6 sm:pl-8 space-y-8 border-l border-[#ECEFF3] ml-3 sm:ml-4">
        
        {filteredSessions.map((session, index) => {
          const isInitial = session.isInitialSession || session.sessionNumber === 1;

          return (
            <div key={session.id} id={`session-timeline-card-${session.id}`} className="relative space-y-4">
              
              {/* Timeline Dot Marker */}
              <div
                className={`absolute -left-[29px] sm:-left-[37px] top-6 w-4 h-4 rounded-full border-4 border-white flex items-center justify-center ${
                  isInitial ? 'bg-[#0D9488]' : 'bg-[#10151F]'
                }`}
              />

              {/* Date & Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-[#10151F]">{session.date}</span>
                  <span className="text-[#C3CBD6]">·</span>
                  <span className="text-[#6B7686]">
                    Session <span className="font-mono">{session.sessionNumber}</span> · <span className="font-mono">{session.duration || '45 min'}</span>
                  </span>
                  {session.processing && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#F1FAF9] text-[#0F766E] border border-[#D6EDEA]">Processing…</span>
                  )}
                  {session.needsApproval && !approvedIds.has(session.id) && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#FCF7EC] text-[#8A5A12] border border-[#F3E2C0]">Draft · review</span>
                  )}
                </div>

                {isInitial ? (
                  <span className="u-chip u-chip-accent text-xs">
                    Initial session
                  </span>
                ) : (
                  <span className="text-xs text-[#6B7686]">
                    {session.keyThemes?.slice(0, 2).join(' · ')}
                  </span>
                )}
              </div>

              {/* Built-On Continuity Header (for ongoing sessions) */}
              {!isInitial && session.continuity?.builtOn && (
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#F7F9FB] border border-[#F2F5F8] text-xs text-[#6B7686]">
                  <CornerDownRight className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span className="font-medium text-[#10151F]">Built on</span>
                  <span>Session <span className="font-mono">{session.continuity.builtOn.sessionNumber}</span> · {session.continuity.builtOn.summary}</span>
                </div>
              )}

              {/* Main Session Content Card */}
              {isInitial ? (
                /* ------------------------------------------------------------- */
                /* SESSION 1: INITIAL SESSION CARD (Starting point of therapy)   */
                /* ------------------------------------------------------------- */
                <div className="p-6 sm:p-7 bg-white rounded-2xl border border-[#ECEFF3] space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="u-eyebrow">
                        {session.gettingToKnowTitle || `Getting to know ${client.name.split(' ')[0]}`}
                      </div>
                      <h3 className="text-lg sm:text-xl font-serif font-semibold text-[#10151F] mt-1">
                        Intake Assessment & Formulation
                      </h3>
                    </div>
                    <span className="u-chip u-chip-accent text-xs shrink-0">
                      Starting Point
                    </span>
                  </div>

                  {/* Presenting Concerns */}
                  <div className="space-y-1.5">
                    <div className="u-eyebrow">
                      Presenting Concerns
                    </div>
                    <p className="text-[13px] sm:text-sm font-medium text-[#10151F]">
                      {(session.presentingConcerns || session.keyThemes || ['Work stress', 'Rumination', 'Sleep']).join(' · ')}
                    </p>
                  </div>

                  {/* Background */}
                  <div className="space-y-1.5 pt-2 border-t border-[#F2F5F8]">
                    <div className="u-eyebrow">
                      Background
                    </div>
                    <p className="text-[13px] sm:text-sm text-[#3A4453] leading-relaxed">
                      {session.background || session.summary || 'Client presented with ongoing work-related pressure causing sleep disruptions and somatic strain.'}
                    </p>
                  </div>

                  {/* Client Goals */}
                  <div className="space-y-1.5 pt-2 border-t border-[#F2F5F8]">
                    <div className="u-eyebrow">
                      Client Goals
                    </div>
                    <p className="text-[15px] font-serif italic text-[#10151F] pl-3.5 border-l-2 border-[#0D9488] leading-[1.6]">
                      {session.clientGoals || '“I want to stop thinking about work all the time.”'}
                    </p>
                  </div>

                  {/* Initial Direction */}
                  <div className="space-y-1.5 pt-2 border-t border-[#F2F5F8]">
                    <div className="u-eyebrow">
                      Initial Direction
                    </div>
                    <p className="text-[13px] sm:text-sm text-[#10151F] leading-relaxed">
                      {session.initialDirection || 'Explore relationship between work stress and nighttime rumination'}
                    </p>
                  </div>

                  {/* Led-To Continuity & View Session Button */}
                  <div className="pt-4 border-t border-[#F2F5F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="inline-flex items-center space-x-2 text-xs text-[#6B7686]">
                      <span className="font-medium text-[#10151F]">Led to</span>
                      <span className="u-chip text-xs">
                        {session.continuity?.ledTo?.description || '3 between-session activities → Session 2'}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveSessionId(session.id)}
                      className="inline-flex items-center space-x-1.5 text-[13px] font-medium text-[#0F766E] hover:text-[#0D9488] transition-colors cursor-pointer group"
                    >
                      <span>View session</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ) : (
                /* ------------------------------------------------------------- */
                /* SESSION 2 ONWARD: LONGITUDINAL ONGOING SESSION CARD           */
                /* ------------------------------------------------------------- */
                <div className="p-6 sm:p-7 bg-white rounded-2xl border border-[#ECEFF3] space-y-5">

                  {/* What was discussed */}
                  <div className="space-y-2">
                    <div className="u-eyebrow">
                      What was discussed
                    </div>
                    <p className="text-[13px] sm:text-sm text-[#3A4453] leading-relaxed">
                      {session.duringWork?.whatDiscussed || session.summary || 'No summary for this session.'}
                    </p>

                    {session.duringWork?.discussionPoints && session.duringWork.discussionPoints.length > 0 && (
                      <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-[#ECEFF3]">
                        {session.duringWork.discussionPoints.map((point, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-xs text-[#6B7686]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{point}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Therapeutic Work */}
                  <div className="space-y-2 pt-3 border-t border-[#F2F5F8]">
                    <div className="u-eyebrow">
                      Therapeutic work
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="u-chip u-chip-accent text-xs">
                        <Target className="w-3.5 h-3.5" />
                        <span>{session.duringWork?.therapeuticWork || session.interventions?.[0] || 'Cognitive reframing'}</span>
                      </span>
                    </div>
                    {session.duringWork?.therapeuticDetails && (
                      <p className="text-xs text-[#3A4453] leading-relaxed pt-1">
                        {session.duringWork.therapeuticDetails}
                      </p>
                    )}
                  </div>

                  {/* Client response */}
                  <div className="space-y-2 pt-3 border-t border-[#F2F5F8]">
                    <div className="u-eyebrow">
                      Client response
                    </div>
                    <blockquote className="pl-3.5 border-l-2 border-[#0D9488] space-y-1.5">
                      <p className="text-[15px] font-serif italic text-[#10151F] leading-[1.6]">
                        {session.duringWork?.clientResponse || '“I understand the thought is probably exaggerated, but changing it is difficult.”'}
                      </p>
                      {session.duringWork?.clientResponseNuance && (
                        <p className="text-xs text-[#6B7686] pt-1.5">
                          <span className="font-medium text-[#10151F]">Context:</span> {session.duringWork.clientResponseNuance}
                        </p>
                      )}
                    </blockquote>
                  </div>

                  {/* Agreed action */}
                  <div className="space-y-2 pt-3 border-t border-[#F2F5F8]">
                    <div className="u-eyebrow">
                      Agreed action
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F9FB] border border-[#ECEFF3] space-y-2">
                      <div className="flex items-center space-x-2 text-[13px] sm:text-sm font-medium text-[#10151F]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                        <span>{session.afterTransition?.agreedAction || session.homework || 'Practice reframing once daily.'}</span>
                      </div>
                      {session.afterTransition?.agreedActionItems && session.afterTransition.agreedActionItems.length > 0 && (
                        <div className="pt-2 border-t border-[#F2F5F8] space-y-1 font-sans text-xs text-[#3A4453]">
                          {session.afterTransition.agreedActionItems.map((item, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <span className="font-mono text-[#9AA4B2]">{idx + 1}.</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Led-To Continuity & View Session Button */}
                  <div className="pt-4 border-t border-[#F2F5F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="inline-flex items-center space-x-2 text-xs text-[#6B7686]">
                      <span className="font-medium text-[#10151F]">Led to</span>
                      <span className="u-chip u-chip-accent text-xs">
                        {session.continuity?.ledTo?.description || `Between-session activity → Session ${session.sessionNumber + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {onUpdateSession && (
                        <button
                          onClick={() => (editCardId === session.id ? cancelEditCard() : startEditCard(session))}
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B7686] hover:text-[#0F766E] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{editCardId === session.id ? 'Close' : 'Edit'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setActiveSessionId(session.id)}
                        className="inline-flex items-center space-x-1.5 text-[13px] font-medium text-[#0F766E] hover:text-[#0D9488] transition-colors cursor-pointer group"
                      >
                        <span>View session</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Inline edit — free-text boxes BELOW the content, every field editable */}
                  {editCardId === session.id && draft && (
                    <div className="mt-4 pt-4 border-t border-[#F2F5F8] space-y-3">
                      <p className="u-eyebrow">Edit this session — free text, no fixed format</p>
                      <div><label className="text-[11px] text-[#6B7686] mb-1 block">What was discussed</label>
                        <textarea rows={3} className={fieldCls} value={draft.duringWork?.whatDiscussed || ''} onChange={(e) => dset('summaryWhatDiscussed', e.target.value)} /></div>
                      <div><label className="text-[11px] text-[#6B7686] mb-1 block">Therapeutic work</label>
                        <input className={fieldCls} value={draft.duringWork?.therapeuticWork || ''} onChange={(e) => dset('therapeuticWork', e.target.value)} /></div>
                      <div><label className="text-[11px] text-[#6B7686] mb-1 block">Therapeutic detail</label>
                        <textarea rows={2} className={fieldCls} value={draft.duringWork?.therapeuticDetails || ''} onChange={(e) => dset('therapeuticDetails', e.target.value)} /></div>
                      <div><label className="text-[11px] text-[#6B7686] mb-1 block">Client response</label>
                        <textarea rows={2} className={fieldCls} value={draft.duringWork?.clientResponse || ''} onChange={(e) => dset('clientResponse', e.target.value)} /></div>
                      <div><label className="text-[11px] text-[#6B7686] mb-1 block">Context</label>
                        <textarea rows={2} className={fieldCls} value={draft.duringWork?.clientResponseNuance || ''} onChange={(e) => dset('clientResponseNuance', e.target.value)} /></div>
                      <div><label className="text-[11px] text-[#6B7686] mb-1 block">Agreed action</label>
                        <input className={fieldCls} value={draft.afterTransition?.agreedAction || ''} onChange={(e) => dset('agreedAction', e.target.value)} /></div>
                      <div><label className="text-[11px] text-[#6B7686] mb-1 block">Action items (one per line)</label>
                        <textarea rows={3} className={fieldCls} value={draft.__agreedItems ?? (draft.afterTransition?.agreedActionItems || []).join('\n')} onChange={(e) => dset('agreedItems', e.target.value)} /></div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={cancelEditCard} className="u-btn-ghost text-sm">Cancel</button>
                        <button onClick={saveEditCard} className="u-btn-primary text-sm"><Check className="w-4 h-4" /> Save</button>
                      </div>
                    </div>
                  )}

                  {/* In-session activities + client response (auto-detected when recorded; add more here) */}
                  <InSessionActivities session={session} onLog={onLogActivity} onUpdate={onUpdateSession} />

                  {/* Free-text notes — below the content, not inside the fields */}
                  <div className="mt-4 pt-4 border-t border-[#F2F5F8] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="u-eyebrow">Your notes on this session</span>
                      {savedSuccess === session.id && <span className="text-xs text-[#0F766E] font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Saved</span>}
                    </div>
                    <textarea rows={3}
                      value={editingObservations[session.id] ?? session.therapistObservations ?? ''}
                      onChange={(e) => handleObservationChange(session.id, e.target.value)}
                      placeholder="Write anything about this session, in your own words…"
                      className="w-full p-3 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] leading-relaxed placeholder-[#9AA4B2] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors" />
                    <div className="flex justify-end">
                      <button onClick={() => handleSaveObservations(session.id)} className="u-btn-ghost text-sm"><Check className="w-4 h-4 text-[#0D9488]" /> Save notes</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtle Between-Session Continuity Loop Connector */}
              {index < filteredSessions.length - 1 && (
                <div className="py-2 pl-2 flex items-center space-x-2 text-xs text-[#6B7686]">
                  <div className="w-2 h-2 rounded-full bg-[#DCE2EA]" />
                  <span className="text-[#6B7686]">
                    Between-session period · Client exercises & reflections
                  </span>
                </div>
              )}

            </div>
          );
        })}

      </div>


    </div>
  );
};

// In-session activities & client response — auto-detected on the recorded path
// (session-understanding extracts the intervention + response); therapists can log
// more here. Each entry feeds the same `intervention` memory the engine reads.
const InSessionActivities: React.FC<{
  session: SessionRecord;
  onLog?: (sessionId: string, activity: string, response: string) => void;
  onUpdate?: (updated: SessionRecord) => void;
}> = ({ session, onLog, onUpdate }) => {
  const list: { activity: string; response: string }[] = ((session as any).inSessionActivities) || [];
  const [activity, setActivity] = useState('');
  const [response, setResponse] = useState('');
  const auto = session.duringWork?.therapeuticWork
    ? { activity: session.duringWork.therapeuticWork, response: session.duringWork.clientResponse || '' }
    : null;

  const add = () => {
    if (!activity.trim() || !onLog) return;
    onLog(session.id, activity.trim(), response.trim());
    setActivity(''); setResponse('');
  };
  const removeAt = (i: number) => {
    if (!onUpdate) return;
    onUpdate({ ...(session as any), inSessionActivities: list.filter((_, idx) => idx !== i) } as SessionRecord);
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#F2F5F8] space-y-3">
      <span className="u-eyebrow">In-session activities &amp; client response</span>

      {auto && (
        <div className="rounded-lg bg-[#F1FAF9] border border-[#D6EDEA] p-3 text-[13px]">
          <span className="inline-block text-[10px] font-semibold text-[#0F766E] uppercase tracking-wide mb-1">Auto-detected from session</span>
          <p className="text-[#10151F] font-medium">{auto.activity}</p>
          {auto.response && <p className="text-[#6B7686] italic mt-1">“{auto.response}”</p>}
        </div>
      )}

      {list.map((a, i) => (
        <div key={i} className="rounded-lg border border-[#ECEFF3] p-3 text-[13px] flex items-start justify-between gap-2">
          <div>
            <p className="text-[#10151F] font-medium">{a.activity}</p>
            {a.response && <p className="text-[#6B7686] italic mt-1">“{a.response}”</p>}
          </div>
          {onUpdate && (
            <button onClick={() => removeAt(i)} aria-label="Remove" className="text-[#9AA4B2] hover:text-[#B0332F] shrink-0"><X className="w-4 h-4" /></button>
          )}
        </div>
      ))}

      {onLog && (
        <div className="space-y-2 rounded-lg bg-[#FBFCFD] border border-dashed border-[#DCE2EA] p-3">
          <input value={activity} onChange={(e) => setActivity(e.target.value)}
            placeholder="Activity you ran in session (e.g. breathing exercise, thought record, role-play)…"
            className="w-full px-3 py-2 bg-white border border-[#ECEFF3] rounded-lg text-[13px] text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488]" />
          <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={2}
            placeholder="How the client responded (optional)…"
            className="w-full px-3 py-2 bg-white border border-[#ECEFF3] rounded-lg text-[13px] text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488]" />
          <div className="flex justify-end">
            <button onClick={add} disabled={!activity.trim()} className="u-btn-primary text-sm disabled:opacity-50">
              <Plus className="w-4 h-4" /> Log activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
