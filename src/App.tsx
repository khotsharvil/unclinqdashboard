import React, { useState, useEffect } from 'react';
import { INITIAL_CLIENTS, INITIAL_ACTIVITIES } from './data/mockData';
import { INITIAL_THERAPIST_PROFILE } from './data/therapistData';
import { Client, EvidenceGroup, ActivityItem, TherapistNote, TherapistProfile, ClientInvitation, ScheduledSession } from './types';
import { generateInitialSessions, CURRENT_WEEK_DATES } from './data/calendarUtils';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ClientsView } from './components/ClientsView';
import { CalendarView } from './components/CalendarView';
import { ClientWorkspace } from './components/Workspace/ClientWorkspace';
import { SettingsView } from './components/SettingsView';
import { EvidencePanel } from './components/EvidencePanel';
import { TherapistOnboardingModal } from './components/TherapistOnboardingModal';
import { Login } from './components/Login';
import { TherapistOnboarding } from './components/TherapistOnboarding';
import { getToken, getUser, authApi, therapistApi } from './api';
import { InviteClientModal } from './components/InviteClientModal';

export default function App() {
  const [authed, setAuthed] = useState<boolean>(!!getToken());
  const [onboarded, setOnboarded] = useState<boolean>(() => getUser()?.onboarding_completed !== false);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [currentView, setCurrentView] = useState<'home' | 'clients' | 'workspace' | 'settings' | 'calendar'>('home');
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>(() => generateInitialSessions(INITIAL_CLIENTS));
  
  // Selected client for Workspace
  const [selectedClient, setSelectedClient] = useState<Client | null>(INITIAL_CLIENTS[0]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'briefing' | 'journey' | 'sessions' | 'actions' | 'notes'>('briefing');

  // Therapist Profile & Onboarding
  const [therapistProfile, setTherapistProfile] = useState<TherapistProfile>(INITIAL_THERAPIST_PROFILE);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Invite Client Modal
  const [isInviteClientOpen, setIsInviteClientOpen] = useState(false);
  const [inviteTargetClient, setInviteTargetClient] = useState<Client | undefined>(undefined);

  // Evidence slide-over panel
  const [evidencePanel, setEvidencePanel] = useState<{
    isOpen: boolean;
    group: EvidenceGroup | null;
  }>({
    isOpen: false,
    group: null,
  });

  // Open invite client modal, optionally preselecting an existing client
  const handleOpenInviteModal = (client?: Client) => {
    setInviteTargetClient(client);
    setIsInviteClientOpen(true);
  };

  const handleSaveTherapistProfile = (updatedProfile: TherapistProfile) => {
    setTherapistProfile(updatedProfile);
  };

  // Calendar Session Handlers
  const handleUpdateSession = (updatedSession: ScheduledSession) => {
    setScheduledSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));

    // Synchronize client's nextSession and recurringSchedule
    setClients(prevClients => prevClients.map(c => {
      if (c.id === updatedSession.clientId) {
        const isToday = updatedSession.dayOfWeek === 'Thursday';
        return {
          ...c,
          nextSession: {
            display: `${isToday ? 'Today' : updatedSession.dayOfWeek} · ${updatedSession.time}`,
            time: updatedSession.time,
            date: updatedSession.date,
            isToday,
            dayOfWeek: updatedSession.dayOfWeek,
            duration: updatedSession.duration,
            isRecurring: updatedSession.isRecurring,
            cadence: updatedSession.recurringCadence,
            location: updatedSession.location,
          },
          recurringSchedule: updatedSession.isRecurring ? {
            dayOfWeek: updatedSession.dayOfWeek,
            time: updatedSession.time,
            duration: updatedSession.duration,
            cadence: updatedSession.recurringCadence,
            location: updatedSession.location,
          } : undefined,
        };
      }
      return c;
    }));
  };

  const handleAddSession = (newSession: ScheduledSession) => {
    setScheduledSessions(prev => [newSession, ...prev]);

    setClients(prevClients => prevClients.map(c => {
      if (c.id === newSession.clientId) {
        const isToday = newSession.dayOfWeek === 'Thursday';
        return {
          ...c,
          nextSession: {
            display: `${isToday ? 'Today' : newSession.dayOfWeek} · ${newSession.time}`,
            time: newSession.time,
            date: newSession.date,
            isToday,
            dayOfWeek: newSession.dayOfWeek,
            duration: newSession.duration,
            isRecurring: newSession.isRecurring,
            cadence: newSession.recurringCadence,
            location: newSession.location,
          },
          recurringSchedule: newSession.isRecurring ? {
            dayOfWeek: newSession.dayOfWeek,
            time: newSession.time,
            duration: newSession.duration,
            cadence: newSession.recurringCadence,
            location: newSession.location,
          } : undefined,
        };
      }
      return c;
    }));
  };

  const handleDeleteSession = (sessionId: string) => {
    setScheduledSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleSendClientInvitation = (invitation: ClientInvitation) => {
    const sessionDay = invitation.sessionDay || 'Thursday';
    const sessionTime = invitation.sessionTime || '10:00 AM';
    const duration = invitation.duration || '50 min';
    const isRecurring = invitation.isRecurring ?? true;
    const cadence = invitation.recurringCadence || 'weekly';
    const location = invitation.location || 'in_person';
    const isToday = sessionDay === 'Thursday';
    const sessionDate = invitation.sessionDate || (CURRENT_WEEK_DATES[sessionDay]?.date || '2026-08-27');

    const nextSessionInfo = {
      display: `${isToday ? 'Today' : sessionDay} · ${sessionTime}`,
      time: sessionTime,
      date: sessionDate,
      isToday,
      dayOfWeek: sessionDay,
      duration,
      isRecurring,
      cadence,
      location,
    };

    const recurringSchedule = isRecurring ? {
      dayOfWeek: sessionDay,
      time: sessionTime,
      duration,
      cadence,
      location,
    } : undefined;

    // Check if client exists
    const existingIndex = clients.findIndex(
      c => (invitation.clientId && c.id === invitation.clientId) || c.name.toLowerCase() === invitation.clientName.toLowerCase()
    );

    if (existingIndex >= 0) {
      const existingClient = clients[existingIndex];
      const updated = [...clients];
      updated[existingIndex] = {
        ...existingClient,
        contactEmail: invitation.clientEmail,
        contactPhone: invitation.clientPhone,
        portalStatus: 'invited',
        invitationSentDate: 'Today',
        nextSession: nextSessionInfo,
        recurringSchedule: recurringSchedule || existingClient.recurringSchedule,
      };
      setClients(updated);
      if (selectedClient && selectedClient.id === updated[existingIndex].id) {
        setSelectedClient(updated[existingIndex]);
      }

      // Add or update session record in scheduledSessions
      const sessRecord: ScheduledSession = {
        id: `sess-${existingClient.id}-${Date.now()}`,
        clientId: existingClient.id,
        clientName: existingClient.name,
        avatarInitials: existingClient.avatarInitials,
        clientStatus: existingClient.status,
        briefingStatus: existingClient.briefingStatus,
        date: sessionDate,
        dayOfWeek: sessionDay,
        time: sessionTime,
        duration,
        location,
        isRecurring,
        recurringCadence: cadence,
        status: 'scheduled',
        notes: `Invited schedule: ${isRecurring ? `Recurring ${cadence}` : 'One-time session'}`,
        focusTheme: existingClient.briefing?.observedPattern?.text?.slice(0, 60) || 'Intake follow-up',
      };
      setScheduledSessions(prev => [sessRecord, ...prev.filter(s => s.clientId !== existingClient.id)]);
    } else {
      // Create new client record from invitation
      const initials = invitation.clientName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const newId = `cli-${Date.now()}`;
      const newClientRecord: Client = {
        id: newId,
        name: invitation.clientName,
        preferredPronouns: invitation.preferredPronouns || 'they/them',
        avatarInitials: initials || 'CL',
        status: 'active',
        email: invitation.clientEmail,
        phone: invitation.clientPhone,
        contactEmail: invitation.clientEmail,
        contactPhone: invitation.clientPhone,
        portalStatus: 'invited',
        invitationSentDate: 'Today',
        briefingStatus: 'ready',
        nextSession: nextSessionInfo,
        recurringSchedule,
        lastSession: null,
        sessions: [],
        actions: [],
        notes: [
          {
            id: `note-${Date.now()}`,
            date: 'Today',
            title: 'Initial Portal Invitation Sent',
            content: `Sent invitation link to ${invitation.clientEmail}. Scheduled: ${sessionDay}s at ${sessionTime} (${isRecurring ? `Recurring ${cadence}` : 'One-time'}). Intake packs selected: ${invitation.forms?.join(', ') || 'Standard Intake'}. Custom note: "${invitation.customWelcomeNote || 'Standard intake welcome.'}"`,
            isPrivate: true,
            category: 'clinical_impression',
          }
        ],
        journeyPatterns: [],
        evidenceStore: {},
        briefing: {
          whatChanged: {
            text: 'Client invited to secure portal with recurring schedule. Intake responses will populate baseline history and clinical themes automatically.',
            mentionsCount: 0,
            journalCount: 0,
            conversationsCount: 0,
            evidenceGroupId: 'ev-init-1',
          },
          clientWantsToDiscuss: {
            quote: 'Initial intake and goals discussion.',
            context: 'Intake portal registration',
            conversationEvidenceId: 'ev-init-1',
          },
          whatTheyTried: [],
          observedPattern: {
            text: 'Client invited to secure portal. Baseline evaluation in progress.',
            observedCount: 1,
            lastSeen: 'Pending intake',
            evidenceGroupId: 'ev-init-1',
            clinicalNoteSeparateFromObservation: 'Awaiting intake paperwork completion.',
          },
          worthExploring: ['Review submitted intake questionnaire and consent form once completed.'],
          context: {
            previousSessionDate: 'None (new intake)',
            keyPoints: ['Portal link sent', 'Intake paperwork pending'],
            previousSessionId: 'sess-init',
          },
        },
      };

      setClients(prev => [newClientRecord, ...prev]);

      // Add to scheduledSessions
      const sessRecord: ScheduledSession = {
        id: `sess-${newId}-${Date.now()}`,
        clientId: newId,
        clientName: invitation.clientName,
        avatarInitials: initials || 'CL',
        clientStatus: 'active',
        briefingStatus: 'ready',
        date: sessionDate,
        dayOfWeek: sessionDay,
        time: sessionTime,
        duration,
        location,
        isRecurring,
        recurringCadence: cadence,
        status: 'scheduled',
        notes: `Intake appointment (${isRecurring ? `Recurring ${cadence}` : 'One-time'})`,
        focusTheme: 'Initial intake and goals alignment',
      };
      setScheduledSessions(prev => [sessRecord, ...prev]);
    }
  };

  // Handle opening evidence side panel
  const handleOpenEvidence = (group: EvidenceGroup) => {
    setEvidencePanel({
      isOpen: true,
      group,
    });
  };

  const handleCloseEvidence = () => {
    setEvidencePanel(prev => ({
      ...prev,
      isOpen: false,
    }));
  };

  // Close evidence slide-over on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && evidencePanel.isOpen) {
        handleCloseEvidence();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [evidencePanel.isOpen]);

  // Navigate directly to client briefing
  const handleOpenClientBriefing = (client: Client) => {
    setSelectedClient(client);
    setActiveWorkspaceTab('briefing');
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select client from search or list
  const handleSelectClient = (
    client: Client, 
    tab: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes' = 'briefing'
  ) => {
    setSelectedClient(client);
    setActiveWorkspaceTab(tab);
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update client data in global state
  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    if (selectedClient?.id === updatedClient.id) {
      setSelectedClient(updatedClient);
    }
  };

  // Quick add note from Scratchpad on Home view
  const handleQuickAddNote = (clientId: string, noteText: string) => {
    const newNote: TherapistNote = {
      id: `note-${Date.now()}`,
      date: '27 Aug 2026',
      title: 'Pre-session Reflection',
      content: noteText,
      isPrivate: true,
      category: 'clinical_impression',
    };

    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          notes: [newNote, ...c.notes],
        };
      }
      return c;
    }));
  };

  // Add new client
  const handleAddClient = (newClientData: Partial<Client>) => {
    const id = newClientData.name?.toLowerCase().replace(/\s+/g, '-') || `client-${Date.now()}`;
    const newClient: Client = {
      id,
      name: newClientData.name || 'New Client',
      avatarInitials: newClientData.avatarInitials || 'NC',
      preferredPronouns: newClientData.preferredPronouns || 'they/them',
      status: 'active',
      briefingStatus: 'ready',
      nextSession: {
        display: 'Next week',
        time: '10:00 AM',
        date: '2026-09-02',
        isToday: false,
      },
      lastSession: null,
      briefing: {
        whatChanged: {
          text: 'Initial profile created. Awaiting first check-in log or session note.',
          mentionsCount: 0,
          journalCount: 0,
          conversationsCount: 0,
          evidenceGroupId: `ev-${id}-initial`,
        },
        clientWantsToDiscuss: {
          quote: 'Initial intake and goals discussion.',
          context: 'Intake form reflection',
          conversationEvidenceId: `ev-${id}-initial`,
        },
        whatTheyTried: [],
        observedPattern: {
          text: 'Baseline evaluation in progress.',
          observedCount: 1,
          lastSeen: 'Today',
          evidenceGroupId: `ev-${id}-initial`,
          clinicalNoteSeparateFromObservation: 'Awaiting longitudinal baseline observations.',
        },
        worthExploring: [
          'Review primary presenting concerns and therapeutic goals.',
          'Assess current coping strategies and support systems.',
        ],
        context: {
          previousSessionDate: 'None',
          keyPoints: ['Initial intake session scheduled'],
          previousSessionId: '',
        },
      },
      journeyPatterns: [],
      sessions: [],
      actions: [],
      notes: [],
      evidenceStore: {
        [`ev-${id}-initial`]: {
          id: `ev-${id}-initial`,
          title: 'Initial Intake Record',
          subtitle: 'Baseline onboarding data',
          items: [
            {
              id: 'ev-init-1',
              date: 'Today',
              source: 'Check-in',
              snippet: 'Client completed initial intake paperwork and consent for care.',
              context: 'Intake registration',
            },
          ],
        },
      },
    };

    setClients(prev => [newClient, ...prev]);
    setSelectedClient(newClient);
    setActiveWorkspaceTab('briefing');
    setCurrentView('workspace');
  };

  // Confirm onboarding status from the backend (cached login may be stale).
  useEffect(() => {
    if (!authed) return;
    authApi.me().then((r: any) => {
      if (r?.user) {
        setOnboarded(r.user.onboarding_completed !== false);
        try { localStorage.setItem('unclinq_user', JSON.stringify(r.user)); } catch { /* ignore */ }
      }
    }).catch(() => {});
  }, [authed]);

  // White-label branding from the real therapist profile: their uploaded logo +
  // practice name if set, otherwise the actual Unclinq logo. (Branding only —
  // does not touch any section or tab.)
  useEffect(() => {
    if (!authed || !onboarded) return;
    therapistApi.profile().then((r: any) => {
      const pr = r?.profile;
      if (!pr) return;
      setTherapistProfile((prev) => ({
        ...prev,
        name: pr.display_name || pr.name || prev.name,
        practiceName: pr.practice_name || 'Unclinq',
        logoUrl: pr.logo_url || '/logo.png',
        credentials: pr.credentials || prev.credentials,
      }));
    }).catch(() => {});
  }, [authed, onboarded]);

  // Auth gate — the dashboard now runs against the real B2B2C backend.
  if (!authed) return <Login onAuthed={() => { setAuthed(true); setOnboarded(getUser()?.onboarding_completed !== false); }} />;
  // Therapist workspace-setup onboarding (first login only).
  if (!onboarded) return <TherapistOnboarding therapistName={getUser()?.name} onDone={() => setOnboarded(true)} />;

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-[#10151F] flex flex-col font-sans selection:bg-[#D6F1EE] selection:text-[#0F766E]">

      {/* Top Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedClient={selectedClient}
        onSelectClient={handleSelectClient}
        clients={clients}
        activeTab={activeWorkspaceTab}
        setActiveTab={setActiveWorkspaceTab}
        therapistProfile={therapistProfile}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenInviteClient={() => handleOpenInviteModal()}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'home' && (
          <HomeView
            clients={clients}
            activities={activities}
            onOpenClientBriefing={handleOpenClientBriefing}
            onNavigateToClients={() => setCurrentView('clients')}
            onNavigateToCalendar={() => setCurrentView('calendar')}
            onQuickAddNote={handleQuickAddNote}
            therapistProfile={therapistProfile}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenInviteClient={() => handleOpenInviteModal()}
          />
        )}

        {currentView === 'clients' && (
          <ClientsView
            clients={clients}
            onSelectClient={handleSelectClient}
            onOpenInviteClient={handleOpenInviteModal}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            clients={clients}
            sessions={scheduledSessions}
            onUpdateSession={handleUpdateSession}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onOpenClientBriefing={handleOpenClientBriefing}
            onOpenClientWorkspace={handleSelectClient}
            onOpenInviteModal={() => handleOpenInviteModal()}
          />
        )}

        {currentView === 'workspace' && selectedClient && (
          <ClientWorkspace
            client={selectedClient}
            activeTab={activeWorkspaceTab}
            setActiveTab={setActiveWorkspaceTab}
            onOpenEvidence={handleOpenEvidence}
            onBackToClients={() => setCurrentView('clients')}
            onUpdateClient={handleUpdateClient}
            onOpenInviteClient={handleOpenInviteModal}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            therapistProfile={therapistProfile}
            onUpdateTherapistProfile={handleSaveTherapistProfile}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}
      </main>

      {/* Therapist Onboarding Modal */}
      <TherapistOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        profile={therapistProfile}
        initialProfile={therapistProfile}
        onSaveProfile={handleSaveTherapistProfile}
        onOpenInviteClient={() => {
          setIsOnboardingOpen(false);
          handleOpenInviteModal();
        }}
        onInviteClient={() => {
          setIsOnboardingOpen(false);
          handleOpenInviteModal();
        }}
      />

      {/* Invite Client to Portal Modal */}
      <InviteClientModal
        isOpen={isInviteClientOpen}
        onClose={() => {
          setIsInviteClientOpen(false);
          setInviteTargetClient(undefined);
        }}
        clients={clients}
        existingClients={clients}
        targetClient={inviteTargetClient}
        preselectedClient={inviteTargetClient}
        therapistProfile={therapistProfile}
        onSendInvitation={handleSendClientInvitation}
      />

      {/* Global Evidence Slide-Over Drawer */}
      <EvidencePanel
        isOpen={evidencePanel.isOpen}
        onClose={handleCloseEvidence}
        evidenceGroup={evidencePanel.group}
        clientName={selectedClient ? selectedClient.name : 'Client'}
      />

      {/* Subtle Clinical Footer */}
      <footer className="border-t border-[#ECEFF3] py-5 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#9AA4B2] bg-transparent">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{therapistProfile.practiceName} · {therapistProfile.name}</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
            <span className="text-[#0F766E] font-medium">HIPAA Vault Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
