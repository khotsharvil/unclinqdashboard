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
  ChevronRight
} from 'lucide-react';
import { Client, SessionRecord } from '../../types';

interface SessionsViewProps {
  client: Client;
  selectedSessionId?: string | null;
  onUpdateTherapistObservation?: (sessionId: string, observations: string) => void;
  onAddSession?: (newSession: Partial<SessionRecord>) => void;
  onOpenEvidence?: (evidenceGroupId: string) => void;
}

type SessionFilter = 'all' | 'recent' | 'initial';

export const SessionsView: React.FC<SessionsViewProps> = ({
  client,
  selectedSessionId,
  onUpdateTherapistObservation,
  onAddSession,
  onOpenEvidence,
}) => {
  // Navigation state: null means showing timeline list, or a specific session ID to view full workspace
  const [activeSessionId, setActiveSessionId] = useState<string | null>(selectedSessionId || null);
  const [filterType, setFilterType] = useState<SessionFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [editingObservations, setEditingObservations] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // New session form state
  const [newSessionData, setNewSessionData] = useState<{
    date: string;
    duration: string;
    whatChanged: string;
    whatDiscussed: string;
    therapeuticWork: string;
    clientResponse: string;
    agreedAction: string;
    keyThemes: string;
  }>({
    date: '31 Aug 2026',
    duration: '45 min',
    whatChanged: 'Practiced reframing 3 times; noticed reduced evening sleep latency.',
    whatDiscussed: 'Reviewed cognitive reframing logs and explored boundaries around evening work messages.',
    therapeuticWork: 'Boundary communication scripting & cognitive restructuring',
    clientResponse: '“I feel much more in control when I have a pre-written boundary template.”',
    agreedAction: 'Send boundary email to team and log somatic reactions.',
    keyThemes: 'Work stress, Boundary setting, Sleep',
  });

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

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSessionNum = client.sessions.length + 1;
    const created: Partial<SessionRecord> = {
      id: `session-${nextSessionNum}-${client.id}`,
      sessionNumber: nextSessionNum,
      date: newSessionData.date,
      time: '12:30 PM',
      duration: newSessionData.duration,
      isInitialSession: false,
      keyThemes: newSessionData.keyThemes.split(',').map(t => t.trim()).filter(Boolean),
      summary: newSessionData.whatDiscussed,
      continuity: {
        builtOn: {
          sessionNumber: nextSessionNum - 1,
          summary: client.sessions[0]?.keyThemes?.slice(0, 2).join(' + ') || 'Previous session work',
        },
        ledTo: {
          activityCount: 2,
          description: `Between-session practice → Session ${nextSessionNum + 1}`,
          nextSessionNumber: nextSessionNum + 1,
        },
      },
      beforeSnapshot: {
        whatChanged: newSessionData.whatChanged,
        clientActivity: ['2 reframing attempts', '1 evening check-in'],
        worthExploring: 'Sustaining boundaries under peak sprint deadlines',
      },
      duringWork: {
        whatDiscussed: newSessionData.whatDiscussed,
        therapeuticWork: newSessionData.therapeuticWork,
        clientResponse: newSessionData.clientResponse,
      },
      afterTransition: {
        agreedAction: newSessionData.agreedAction,
        therapistNote: 'Strong alliance; check in on somatic stress levels next week.',
        exercises: [newSessionData.agreedAction],
      },
      interventions: [newSessionData.therapeuticWork],
      homework: newSessionData.agreedAction,
      therapistObservations: 'Client was animated and engaged. Clear shift from passive rumination toward structured problem-solving.',
      transcript: [
        {
          speaker: 'Therapist',
          timestamp: '00:04:15',
          text: `Let us examine how the practice went this past week.`,
        },
        {
          speaker: 'Client',
          timestamp: '00:04:35',
          text: newSessionData.clientResponse,
        },
      ],
    };

    if (onAddSession) {
      onAddSession(created);
    } else {
      // Direct local state simulation
      client.sessions.unshift(created as SessionRecord);
    }

    setIsAddModalOpen(false);
    setActiveSessionId(created.id || null);
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

        {/* Right side: + Add session button */}
        <button
          id="add-session-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="u-btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Add session</span>
        </button>
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
                      {session.duringWork?.whatDiscussed || session.summary || `${client.name.split(' ')[0]} described increasing difficulty disengaging from work after stressful days.`}
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

                    <button
                      onClick={() => setActiveSessionId(session.id)}
                      className="inline-flex items-center space-x-1.5 text-[13px] font-medium text-[#0F766E] hover:text-[#0D9488] transition-colors cursor-pointer group"
                    >
                      <span>View session</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
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

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW SESSION DIALOG                                            */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#ECEFF3] rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-[#F2F5F8] pb-3">
              <div>
                <h3 className="text-lg font-serif font-semibold text-[#10151F]">
                  Log New Session ({client.name})
                </h3>
                <p className="text-xs text-[#6B7686]">
                  Session <span className="font-mono tabular-nums">{client.sessions.length + 1}</span> · Longitudinal care tracking
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#6B7686] hover:text-[#10151F] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs sm:text-sm">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="u-eyebrow block mb-1">Date</label>
                  <input
                    type="text"
                    required
                    value={newSessionData.date}
                    onChange={(e) => setNewSessionData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="u-eyebrow block mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={newSessionData.duration}
                    onChange={(e) => setNewSessionData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full p-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="u-eyebrow block mb-1">Key Themes (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={newSessionData.keyThemes}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, keyThemes: e.target.value }))}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  placeholder="Work stress, Sleep, Rumination"
                />
              </div>

              <div>
                <label className="u-eyebrow block mb-1">1. Before: What Changed Since Last Session</label>
                <textarea
                  rows={2}
                  required
                  value={newSessionData.whatChanged}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, whatChanged: e.target.value }))}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="u-eyebrow block mb-1">2. During: What Was Discussed</label>
                <textarea
                  rows={2}
                  required
                  value={newSessionData.whatDiscussed}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, whatDiscussed: e.target.value }))}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="u-eyebrow block mb-1">Therapeutic Work / Intervention</label>
                <input
                  type="text"
                  required
                  value={newSessionData.therapeuticWork}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, therapeuticWork: e.target.value }))}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="u-eyebrow block mb-1">Client Response (Quote or Formulation)</label>
                <textarea
                  rows={2}
                  required
                  value={newSessionData.clientResponse}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, clientResponse: e.target.value }))}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="u-eyebrow block mb-1">3. After: Agreed Action</label>
                <input
                  type="text"
                  required
                  value={newSessionData.agreedAction}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, agreedAction: e.target.value }))}
                  className="w-full p-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-[#F2F5F8] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="u-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="u-btn-primary"
                >
                  Create Session
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
