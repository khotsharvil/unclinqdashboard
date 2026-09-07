import React, { useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  ChevronLeft, 
  FileText, 
  CheckCircle2, 
  Lock,
  GitCommit,
  Mail,
  UserPlus
} from 'lucide-react';
import { Client, EvidenceGroup, JourneyPattern, SessionRecord, ActionItem, TherapistNote } from '../../types';
import { getClientAvatarTheme } from '../../utils/theme';
import { BriefingView } from './BriefingView';
import { JourneyView } from './JourneyView';
import { SessionsView } from './SessionsView';
import { ActionsView } from './ActionsView';
import { NotesView } from './NotesView';

interface ClientWorkspaceProps {
  client: Client;
  activeTab: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes';
  setActiveTab: (tab: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes') => void;
  onOpenEvidence: (evidenceGroup: EvidenceGroup) => void;
  onBackToClients: () => void;
  onUpdateClient: (updatedClient: Client) => void;
  onOpenInviteClient?: (client: Client) => void;
}

export const ClientWorkspace: React.FC<ClientWorkspaceProps> = ({
  client,
  activeTab,
  setActiveTab,
  onOpenEvidence,
  onBackToClients,
  onUpdateClient,
  onOpenInviteClient,
}) => {
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null);

  const handleNavigateToTab = (
    tab: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes', 
    sessionId?: string
  ) => {
    if (sessionId) {
      setSelectedSessionId(sessionId);
    }
    setActiveTab(tab);
  };

  const handleUpdateTherapistObservation = (sessionId: string, obsText: string) => {
    const updatedSessions = client.sessions.map(s => 
      s.id === sessionId ? { ...s, therapistObservations: obsText } : s
    );
    onUpdateClient({
      ...client,
      sessions: updatedSessions,
    });
  };

  const handleAddAction = (newAction: Partial<ActionItem>) => {
    const action: ActionItem = {
      id: `act-${Date.now()}`,
      title: newAction.title || 'Homework item',
      assignedDate: newAction.assignedDate || 'Aug 27',
      attempts: 0,
      lastAttemptedDate: 'Pending',
      clientResponse: newAction.clientResponse || 'Pending client attempt.',
      status: newAction.status || 'in_progress',
      frequency: newAction.frequency,
    };
    onUpdateClient({
      ...client,
      actions: [action, ...client.actions],
    });
  };

  const handleUpdateActionStatus = (actionId: string, status: ActionItem['status']) => {
    const updatedActions = client.actions.map(a => 
      a.id === actionId ? { ...a, status } : a
    );
    onUpdateClient({
      ...client,
      actions: updatedActions,
    });
  };

  const handleDeleteAction = (actionId: string) => {
    onUpdateClient({
      ...client,
      actions: client.actions.filter(a => a.id !== actionId),
    });
  };

  const handleAddNote = (newNote: Partial<TherapistNote>) => {
    const note: TherapistNote = {
      id: `note-${Date.now()}`,
      date: newNote.date || '27 Aug 2026',
      title: newNote.title || 'Clinical note',
      content: newNote.content || '',
      isPrivate: true,
      category: newNote.category || 'clinical_impression',
    };
    onUpdateClient({
      ...client,
      notes: [note, ...client.notes],
    });
  };

  const handleDeleteNote = (noteId: string) => {
    onUpdateClient({
      ...client,
      notes: client.notes.filter(n => n.id !== noteId),
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-6">

      {/* Back Button & Top Meta */}
      <div className="flex items-center justify-between">
        <button
          id="back-to-clients-btn"
          onClick={onBackToClients}
          className="text-[13px] text-[#6B7686] hover:text-[#10151F] flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All clients</span>
        </button>

        <span className="text-xs font-mono text-[#9AA4B2]">{client.id}</span>
      </div>

      {/* Client Header Card */}
      {(() => {
        const avatarTheme = getClientAvatarTheme(client.id);
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-white border ${avatarTheme.border} ${avatarTheme.text} flex items-center justify-center font-serif text-2xl font-semibold shrink-0`}>
                  {client.avatarInitials}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-[2rem] font-serif font-semibold text-[#10151F] tracking-tight leading-none">
                      {client.name}
                    </h1>
                    {client.preferredPronouns && (
                      <span className="text-sm text-[#9AA4B2]">
                        {client.preferredPronouns}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#6B7686]">
                    {client.nextSession && (
                      <span className="flex items-center gap-1.5 text-[#10151F]">
                        <Clock className="w-4 h-4 text-[#0D9488]" />
                        <span className="font-medium">Next {client.nextSession.display}</span>
                      </span>
                    )}
                    {client.lastSession && (
                      <span>Last <span className="text-[#10151F] font-medium">{client.lastSession.display}</span></span>
                    )}
                    <span>Sessions <span className="font-mono text-[#10151F] font-medium tabular-nums">{client.sessions.length}</span></span>
                  </div>
                </div>
              </div>

              {/* Only surface the exception + one primary action */}
              <div className="self-start sm:self-auto flex items-center gap-2 shrink-0 flex-wrap gap-y-2">
                {client.status === 'needs_attention' && (
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-[#B45309]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                    Needs attention
                  </span>
                )}

              </div>

            </div>

            {/* Workspace Navigation Tabs */}
            <div className="border-b border-[#ECEFF3] flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'briefing', label: 'Briefing', icon: Sparkles },
                { id: 'journey', label: 'Journey', icon: GitCommit },
                { id: 'sessions', label: 'Sessions', icon: FileText, count: client.sessions.length },
                { id: 'actions', label: 'Assign action', icon: CheckCircle2, count: client.actions.length },
                { id: 'notes', label: 'Notes', icon: Lock, count: client.notes.length },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    id={`workspace-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-3.5 py-3 -mb-px text-[13px] font-medium transition-colors flex items-center gap-2 whitespace-nowrap border-b-2 cursor-pointer ${
                      isActive
                        ? 'border-[#0D9488] text-[#10151F]'
                        : 'border-transparent text-[#6B7686] hover:text-[#10151F]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#0D9488]' : ''}`} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-[11px] font-mono tabular-nums ${isActive ? 'text-[#0F766E]' : 'text-[#9AA4B2]'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Main Tab Content */}
      <div className="pt-2">
        {activeTab === 'briefing' && (
          <BriefingView
            client={client}
            onOpenEvidence={onOpenEvidence}
            onNavigateToTab={handleNavigateToTab}
          />
        )}

        {activeTab === 'journey' && (
          <JourneyView
            client={client}
            onOpenEvidence={onOpenEvidence}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsView
            client={client}
            selectedSessionId={selectedSessionId}
            onUpdateTherapistObservation={handleUpdateTherapistObservation}
            onOpenEvidence={onOpenEvidence}
          />
        )}

        {activeTab === 'actions' && (
          <ActionsView
            client={client}
            onAddAction={handleAddAction}
            onUpdateActionStatus={handleUpdateActionStatus}
            onDeleteAction={handleDeleteAction}
          />
        )}

        {activeTab === 'notes' && (
          <NotesView
            client={client}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
          />
        )}
      </div>

    </div>
  );
};
