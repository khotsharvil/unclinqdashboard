import React, { useState, useEffect } from 'react';
import { INITIAL_THERAPIST_PROFILE } from './data/therapistData';
import { Client, EvidenceGroup, ActivityItem, TherapistProfile, ClientInvitation } from './types';
import { INITIAL_CLIENTS, INITIAL_ACTIVITIES } from './data/mockData';
import { ADDITIONAL_PRACTICE_CLIENTS } from './data/caseloadClients';

// DEMO MODE — lets the dashboard run fully without a backend (shareable Vercel
// preview while the API is offline). Gated by VITE_DEMO=1: seeds the sample
// caseload from the mock data files and bypasses the OTP gate. Mock clients are
// self-contained (not _real), so clicking one reads its embedded data — no fetch.
const DEMO = (import.meta as any).env?.VITE_DEMO === '1';
const DEMO_CASELOAD: Client[] = DEMO ? [...INITIAL_CLIENTS, ...ADDITIONAL_PRACTICE_CLIENTS] : [];
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ClientsView } from './components/ClientsView';
import { ClientWorkspace } from './components/Workspace/ClientWorkspace';
import { SettingsView } from './components/SettingsView';
import { AdminView } from './components/AdminView';
import { EvidencePanel } from './components/EvidencePanel';
import { TherapistOnboardingModal } from './components/TherapistOnboardingModal';
import { Login } from './components/Login';
import { TherapistOnboarding } from './components/TherapistOnboarding';
import { getUser, clearAuth, authApi, therapistApi, invitationsApi, consoleApi, RiskSignal } from './api';
import { loadRealClient, toClientStub, toActivities, toNextSession, pendingInviteStubs } from './adapters/toClient';
import { SeedHistoryModal } from './components/SeedHistoryModal';
import { InviteClientModal } from './components/InviteClientModal';
import { WhatsAppInviteModal } from './components/WhatsAppInviteModal';

export default function App() {
  // Demo can deep-link to the onboarding walkthrough: add ?onboarding or #onboarding.
  const DEMO_ONBOARDING = DEMO && /onboarding/i.test(
    (typeof window !== 'undefined' ? window.location.hash + window.location.search : '')
  );
  // Logged-in signal is the cached user object; the JWT lives in the httpOnly
  // cookie now (#11 flip) and isn't readable from JS.
  const [authed, setAuthed] = useState<boolean>(DEMO || !!getUser());
  const [onboarded, setOnboarded] = useState<boolean>(() => DEMO ? !DEMO_ONBOARDING : getUser()?.onboarding_completed !== false);
  // Real data only — no mock seed. Empty until the backend loads the therapist's
  // actual caseload; an empty account shows honest empty states, never sample clients.
  // (DEMO mode seeds the sample caseload so a backendless preview looks full.)
  const [clients, setClients] = useState<Client[]>(DEMO_CASELOAD);
  const [activities, setActivities] = useState<ActivityItem[]>(DEMO ? INITIAL_ACTIVITIES : []);
  const [currentView, setCurrentView] = useState<'home' | 'clients' | 'workspace' | 'settings' | 'admin'>('home');
  // Open risk signals across the caseload (Emora-raised; open until acknowledged).
  const [signals, setSignals] = useState<RiskSignal[]>([]);
  // Account-level block (verification pending / rejected) and the last failed save.
  const [accountBlock, setAccountBlock] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Selected client for Workspace
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'briefing' | 'journey' | 'sessions' | 'actions' | 'notes' | 'chats'>('briefing');

  // Therapist Profile & Onboarding. Seed the real logged-in identity immediately
  // (from the cached user) so the header never flashes the sample "Dr. Elena Vance"
  // before the profile fetch resolves. DEMO keeps the sample profile.
  const [therapistProfile, setTherapistProfile] = useState<TherapistProfile>(() => {
    if (DEMO) return INITIAL_THERAPIST_PROFILE;
    const u = getUser();
    return {
      ...INITIAL_THERAPIST_PROFILE,
      name: u?.name || '',
      // Real accounts never inherit the sample identity (license, contact, specialties).
      title: '',
      credentials: '',
      licenseNumber: '',
      email: u?.email || '',
      phone: '',
      modalities: [],
      specializations: [],
      practiceName: 'Unclinq',
    };
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Invite Client Modal
  const [isInviteClientOpen, setIsInviteClientOpen] = useState(false);
  // New clients are added on WhatsApp (name + number + language → they tap Start).
  // The older email/code invite stays reachable from that modal and for re-inviting.
  const [isWaInviteOpen, setIsWaInviteOpen] = useState(false);
  const [caseloadVersion, setCaseloadVersion] = useState(0);
  const [inviteTargetClient, setInviteTargetClient] = useState<Client | undefined>(undefined);
  const [isSeedHistoryOpen, setIsSeedHistoryOpen] = useState(false);

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
    if (!client && !DEMO) { setIsWaInviteOpen(true); return; }
    setInviteTargetClient(client);
    setIsInviteClientOpen(true);
  };

  const handleSaveTherapistProfile = (updatedProfile: TherapistProfile) => {
    setTherapistProfile(updatedProfile);
  };

  const handleSendClientInvitation = (invitation: ClientInvitation) => {
    // Real accounts: the invite already exists on the backend; just refresh the list.
    if (!DEMO) { setCaseloadVersion((v) => v + 1); return; }
    const sessionDay = invitation.sessionDay || 'Thursday';
    const sessionTime = invitation.sessionTime || '10:00 AM';
    const duration = invitation.duration || '50 min';
    const isRecurring = invitation.isRecurring ?? true;
    const cadence = invitation.recurringCadence || 'weekly';
    const location = invitation.location || 'in_person';
    const isToday = sessionDay === 'Thursday';
    const sessionDate = invitation.sessionDate || '2026-08-27';

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
    // Real client → hydrate the full workspace (briefing/sessions/journey/etc.),
    // otherwise the tabs show the empty stub. Mirrors handleSelectClient.
    if ((client as any)._real) {
      loadRealClient(client.id)
        .then((full) => {
          const withFlag = Object.assign(full, { _real: true });
          setSelectedClient(withFlag);
          setClients((prev) => prev.map((c) => (c.id === full.id ? withFlag : c)));
        })
        .catch(() => {});
    }
  };

  // Select client from search or list
  const handleSelectClient = (
    client: Client,
    tab: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes' | 'chats' = 'briefing'
  ) => {
    // Pending invitations have no account yet — don't open a workspace for them.
    if ((client as any)._pending) return;
    setSelectedClient(client);
    setActiveWorkspaceTab(tab);
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Real client → hydrate the full workspace data (tabs read from this object).
    if ((client as any)._real) {
      loadRealClient(client.id)
        .then((full) => {
          const withFlag = Object.assign(full, { _real: true });
          setSelectedClient(withFlag);
          setClients((prev) => prev.map((c) => (c.id === full.id ? withFlag : c)));
        })
        .catch(() => {});
    }
  };

  const reloadSelectedClient = () => {
    if (!selectedClient) return;
    loadRealClient(selectedClient.id)
      .then((full) => {
        const withFlag = Object.assign(full, { _real: true });
        setSelectedClient(withFlag);
        setClients((prev) => prev.map((c) => (c.id === full.id ? withFlag : c)));
      })
      .catch(() => {});
  };

  // Update client data in global state
  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    if (selectedClient?.id === updatedClient.id) {
      setSelectedClient(updatedClient);
    }
  };

  // Confirm onboarding status from the backend (cached login may be stale).
  useEffect(() => {
    if (DEMO || !authed) return;
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
    if (DEMO || !authed || !onboarded) return;
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
  }, [authed, onboarded, caseloadVersion]);

  // Real caseload: replace the mock clients with the therapist's actual connected
  // clients when there are any (feeds the SAME list + tabs; nothing is restyled).
  // Mock stays as the fallback so an empty account still demos.
  useEffect(() => {
    if (DEMO || !authed || !onboarded) return;
    therapistApi.clients().then((r: any) => {
      const rows = r?.clients || [];
      if (!rows.length) {
        // No joined clients yet: still show anyone already invited (else keep the demo list).
        invitationsApi.list().then((ir: any) => {
          const pending = pendingInviteStubs(ir?.invitations || []);
          if (pending.length) setClients(pending);
        }).catch(() => {});
        return;
      }
      const stubs = rows.map(toClientStub);
      setSelectedClient((prev) => prev || stubs[0]);
      // Home feed, derived from the same rows (no extra fetch).
      setActivities(toActivities(rows));
      // Append pending invitations as non-clickable "pending" rows.
      invitationsApi.list()
        .then((ir: any) => setClients([...stubs, ...pendingInviteStubs(ir?.invitations || [])]))
        .catch(() => setClients(stubs));
    }).catch(() => {});
    therapistApi.signals().then((r) => setSignals(r?.signals || [])).catch(() => {});
  }, [authed, onboarded, caseloadVersion]);

  // Failed API calls: one clear banner for an account block, a toast for a failed save.
  useEffect(() => {
    const onErr = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d.code === 'verification_pending' || d.code === 'verification_rejected') { setAccountBlock(d.message); return; }
      if (d.method !== 'GET') setSaveError(d.message || 'Please try again.');
    };
    window.addEventListener('uc:api-error', onErr);
    return () => window.removeEventListener('uc:api-error', onErr);
  }, []);
  useEffect(() => {
    if (!saveError) return;
    const t = setTimeout(() => setSaveError(null), 6000);
    return () => clearTimeout(t);
  }, [saveError]);

  const handleAckSignal = (signalId: string) => {
    therapistApi.ackSignal(signalId)
      .then(() => {
        const ackedClient = signals.find((x) => x.id === signalId)?.client_id;
        const rest = signals.filter((x) => x.id !== signalId);
        setSignals(rest);
        // The client goes back to "active" once their last open signal is acknowledged.
        if (ackedClient && !rest.some((x) => x.client_id === ackedClient)) {
          setClients((cs) => cs.map((c) => (c.id === ackedClient ? { ...c, status: 'active' } : c)));
          setSelectedClient((c) => (c && c.id === ackedClient ? { ...c, status: 'active' } : c));
        }
      })
      .catch(() => {});
  };

  // Save (or clear) a client's next session. This one date drives the WhatsApp
  // prep message the day before and the briefing's "since last session" window.
  const handleSetNextSession = async (clientId: string, iso: string | null) => {
    await therapistApi.setNextSession(clientId, iso);
    const nextSession = toNextSession(iso);
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, nextSession } : c)));
    setSelectedClient((c) => (c && c.id === clientId ? { ...c, nextSession } : c));
  };

  const handleSignOut = async () => {
    try { await authApi.logout(); } catch { /* sign out locally either way */ }
    clearAuth();
    window.location.reload();
  };

  // Auth gate — the dashboard now runs against the real B2B2C backend.
  // Admin menu only for the Unclinq team (backend checks ADMIN_EMAILS; anyone else gets 403).
  useEffect(() => {
    if (DEMO || !authed) { setIsAdmin(false); return; }
    consoleApi.me().then(() => setIsAdmin(true)).catch(() => setIsAdmin(false));
  }, [authed]);

  if (!authed) return <Login onAuthed={() => { setAuthed(true); setOnboarded(getUser()?.onboarding_completed !== false); }} />;
  // Therapist workspace-setup onboarding (first login only).
  if (!onboarded) return <TherapistOnboarding therapistName={getUser()?.name} onDone={() => setOnboarded(true)} />;

  return (
    <div
      className="min-h-screen text-[#10151F] flex flex-col font-sans selection:bg-[#D6F1EE] selection:text-[#0F766E]"
      style={{ background: 'radial-gradient(1150px 520px at 50% -12%, #E7F1F1 0%, rgba(231,241,241,0) 60%), #FAFBFC' }}
    >

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
        onOpenInviteClient={() => handleOpenInviteModal()}
        isAdmin={isAdmin}
        onSignOut={DEMO ? undefined : handleSignOut}
      />

      {accountBlock && (
        <div role="alert" className="bg-[#FFF7ED] border-b border-[#FED7AA] px-4 sm:px-6 lg:px-8 py-3 text-[13px] text-[#9A3412]">
          <div className="max-w-5xl mx-auto">
            <span className="font-semibold">Client details are locked for now.</span> {accountBlock}
          </div>
        </div>
      )}
      {saveError && (
        <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100%-32px)] px-4 py-3 rounded-xl bg-[#10151F] text-white text-[13px] shadow-lg flex items-center gap-3">
          <span>Not saved: {saveError}</span>
          <button onClick={() => setSaveError(null)} className="text-[#9AA4B2] hover:text-white cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'home' && (
          <HomeView
            clients={clients}
            activities={activities}
            onOpenClientBriefing={handleOpenClientBriefing}
            onNavigateToClients={() => setCurrentView('clients')}
            signals={signals}
            onAckSignal={handleAckSignal}
            therapistProfile={therapistProfile}
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

        {currentView === 'workspace' && selectedClient && (
          <ClientWorkspace
            client={selectedClient}
            activeTab={activeWorkspaceTab}
            setActiveTab={setActiveWorkspaceTab}
            onOpenEvidence={handleOpenEvidence}
            onBackToClients={() => setCurrentView('clients')}
            onUpdateClient={handleUpdateClient}
            onOpenInviteClient={handleOpenInviteModal}
            onSeedHistory={!(selectedClient as any)._pending ? () => setIsSeedHistoryOpen(true) : undefined}
            signals={signals.filter((x) => x.client_id === selectedClient.id)}
            onAckSignal={handleAckSignal}
            onSetNextSession={DEMO ? undefined : handleSetNextSession}
          />
        )}

        {isSeedHistoryOpen && selectedClient && (
          <SeedHistoryModal
            clientId={selectedClient.id}
            clientName={selectedClient.name}
            onClose={() => setIsSeedHistoryOpen(false)}
            onSeeded={reloadSelectedClient}
          />
        )}

        {currentView === 'admin' && isAdmin && <AdminView />}

        {currentView === 'settings' && (
          <SettingsView
            therapistProfile={therapistProfile}
            onUpdateTherapistProfile={handleSaveTherapistProfile}
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

      {/* Add client on WhatsApp (default) */}
      <WhatsAppInviteModal
        isOpen={isWaInviteOpen}
        onClose={() => setIsWaInviteOpen(false)}
        onSent={() => setCaseloadVersion((v) => v + 1)}
        onUseEmail={() => { setIsWaInviteOpen(false); setInviteTargetClient(undefined); setIsInviteClientOpen(true); }}
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
            <span className="text-[#0F766E] font-medium">Encrypted · consent-based</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
