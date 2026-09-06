import React, { useState } from 'react';
import {
  Users,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Search,
  ChevronRight,
  ChevronDown,
  Clock,
  UserPlus,
  Compass,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Client, TherapistProfile } from '../types';

interface HeaderProps {
  currentView: 'home' | 'clients' | 'workspace' | 'settings' | 'calendar';
  setCurrentView: (view: 'home' | 'clients' | 'workspace' | 'settings' | 'calendar') => void;
  selectedClient: Client | null;
  onSelectClient: (client: Client, tab?: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes') => void;
  clients: Client[];
  activeTab: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes';
  setActiveTab: (tab: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes') => void;
  therapistProfile?: TherapistProfile;
  onOpenOnboarding?: () => void;
  onOpenInviteClient?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  selectedClient,
  onSelectClient,
  clients,
  activeTab,
  setActiveTab,
  therapistProfile,
  onOpenOnboarding,
  onOpenInviteClient,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nextSessionClient = clients.find(c => c.nextSession?.isToday) || clients[0];

  const navItem = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
      active
        ? 'bg-[#EEF1F5] text-[#10151F]'
        : 'text-[#6B7686] hover:text-[#10151F] hover:bg-[#F4F6F9]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FAFBFC]/85 backdrop-blur-md border-b border-[#ECEFF3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left Brand & Breadcrumbs */}
          <div className="flex items-center gap-5">
            <button
              id="brand-practice-btn"
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-3 group text-left max-w-xs sm:max-w-sm"
              title={`${therapistProfile?.practiceName || 'Practice'} · Home`}
            >
              {therapistProfile?.logoUrl ? (
                <img
                  src={therapistProfile.logoUrl}
                  alt={therapistProfile.practiceName || 'Practice Logo'}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl object-cover border border-[#ECEFF3] shrink-0 bg-white"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-serif text-base font-semibold shrink-0">
                  {therapistProfile?.practiceName ? therapistProfile.practiceName[0] : (therapistProfile?.name ? therapistProfile.name[0] : 'P')}
                </div>
              )}
              <span className="font-serif text-base sm:text-lg font-semibold tracking-tight text-[#10151F] truncate leading-tight group-hover:text-[#0F766E] transition-colors">
                {therapistProfile?.practiceName || 'Mindful Practice Clinic'}
              </span>
            </button>

            {currentView === 'workspace' && selectedClient && (
              <div className="hidden md:flex items-center gap-2 text-sm text-[#6B7686] border-l border-[#ECEFF3] pl-4">
                <button
                  id="breadcrumb-clients-btn"
                  onClick={() => setCurrentView('clients')}
                  className="hover:text-[#10151F] transition-colors font-medium"
                >
                  Clients
                </button>
                <ChevronRight className="w-4 h-4 text-[#C3CBD6]" />

                <div className="relative">
                  <button
                    onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-[#F4F6F9] text-sm font-serif font-semibold text-[#10151F] flex items-center gap-2 transition-colors"
                  >
                    <span>{selectedClient.name}</span>
                    {selectedClient.nextSession?.isToday && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1FAF9] text-[#0F766E] font-mono">
                        Today {selectedClient.nextSession.time}
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-[#9AA4B2]" />
                  </button>

                  {clientDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setClientDropdownOpen(false)} />
                      <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl border border-[#ECEFF3] shadow-[0_8px_30px_rgba(16,21,31,0.08)] p-2 z-50 animate-in fade-in duration-100">
                        <div className="px-2.5 py-1.5 u-eyebrow">
                          Switch active client
                        </div>
                        <div className="py-1 max-h-60 overflow-y-auto space-y-0.5">
                          {clients.map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                onSelectClient(c, activeTab);
                                setClientDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                                c.id === selectedClient.id
                                  ? 'bg-[#F1FAF9] text-[#0F766E]'
                                  : 'hover:bg-[#F4F6F9] text-[#10151F]'
                              }`}
                            >
                              <span className="font-medium">{c.name}</span>
                              <span className="font-mono text-xs text-[#9AA4B2]">
                                {c.nextSession?.isToday ? c.nextSession.time : 'Active'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Navigation & Tools */}
          <nav className="flex items-center gap-1">

            {nextSessionClient && nextSessionClient.nextSession?.isToday && (
              <button
                onClick={() => onSelectClient(nextSessionClient, 'briefing')}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1FAF9] text-[#0F766E] text-xs hover:bg-[#E3F5F2] transition-colors mr-1"
                title="Jump to today's next session briefing"
              >
                <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                <span className="font-medium">Next · {nextSessionClient.name}</span>
                <span className="font-mono text-[#0D9488]">{nextSessionClient.nextSession.time}</span>
              </button>
            )}

            <button id="nav-home-btn" onClick={() => setCurrentView('home')} className={navItem(currentView === 'home')}>
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <button
              id="nav-clients-btn"
              onClick={() => setCurrentView('clients')}
              className={navItem(currentView === 'clients' || (currentView === 'workspace' && !selectedClient))}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Clients</span>
            </button>

            <button id="nav-calendar-btn" onClick={() => setCurrentView('calendar')} className={navItem(currentView === 'calendar')}>
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>

            {/* Quick Client Search */}
            <div className="relative">
              <button
                id="search-clients-quick-btn"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-[#6B7686] hover:text-[#10151F] hover:bg-[#F4F6F9] transition-colors"
                title="Search client"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {searchOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#ECEFF3] shadow-[0_8px_30px_rgba(16,21,31,0.08)] p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9AA4B2]" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search client by name…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                      {filteredClients.length === 0 ? (
                        <p className="text-xs text-[#9AA4B2] p-3 text-center">No matching clients</p>
                      ) : (
                        filteredClients.map(c => (
                          <button
                            key={c.id}
                            id={`client-search-option-${c.id}`}
                            onClick={() => {
                              onSelectClient(c, 'briefing');
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F4F6F9] transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <div className="text-sm font-medium text-[#10151F]">{c.name}</div>
                              <div className="text-[11px] text-[#9AA4B2] font-mono">
                                {c.nextSession ? c.nextSession.display : 'No upcoming session'}
                              </div>
                            </div>
                            <span className="text-[11px] text-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity">
                              Open →
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Invite Client */}
            {onOpenInviteClient && (
              <button
                id="header-invite-client-btn"
                onClick={onOpenInviteClient}
                className="ml-0.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[#F1FAF9] hover:bg-[#E3F5F2] text-[#0F766E] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Invite client to portal"
              >
                <UserPlus className="w-4 h-4 text-[#0D9488]" />
                <span className="hidden sm:inline">Invite</span>
              </button>
            )}

            {/* Settings */}
            <button
              id="nav-settings-btn"
              onClick={() => setCurrentView('settings')}
              className={`p-2 rounded-lg transition-colors ${
                currentView === 'settings'
                  ? 'bg-[#EEF1F5] text-[#10151F]'
                  : 'text-[#6B7686] hover:text-[#10151F] hover:bg-[#F4F6F9]'
              }`}
              title="Practice Settings"
            >
              <SettingsIcon className="w-[18px] h-[18px]" />
            </button>

            {/* Therapist Avatar & Dropdown */}
            <div className="relative pl-2 ml-1 border-l border-[#ECEFF3]">
              <button
                id="therapist-profile-trigger-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 text-left p-1 rounded-lg hover:bg-[#F4F6F9] transition-colors cursor-pointer group"
                title="Therapist Profile & Onboarding"
              >
                {therapistProfile?.logoUrl ? (
                  <img
                    src={therapistProfile.logoUrl}
                    alt={therapistProfile.practiceName || 'Clinic Logo'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-[#ECEFF3] shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-xs font-serif font-semibold shrink-0">
                    {therapistProfile?.name
                      ? therapistProfile.name.split(' ').map(n => n[0]).filter(c => c !== '.').slice(-2).join('').toUpperCase() || 'EV'
                      : 'EV'}
                  </div>
                )}
                <div className="hidden lg:block text-left leading-tight">
                  <p className="text-[13px] font-medium text-[#10151F] group-hover:text-[#0F766E] transition-colors">
                    {therapistProfile?.name || 'Dr. Elena Vance'}
                  </p>
                  <p className="text-[11px] text-[#9AA4B2] font-mono">
                    {therapistProfile?.licenseNumber || 'PSY-884920'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#9AA4B2] hidden lg:block" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-76 bg-white rounded-xl border border-[#ECEFF3] shadow-[0_8px_30px_rgba(16,21,31,0.08)] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-2.5">
                      <div className="flex items-center gap-3">
                        {therapistProfile?.logoUrl ? (
                          <img
                            src={therapistProfile.logoUrl}
                            alt={therapistProfile.practiceName || 'Practice Logo'}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover border border-[#ECEFF3] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center text-sm font-serif font-semibold shrink-0">
                            {therapistProfile?.name
                              ? therapistProfile.name.split(' ').map(n => n[0]).filter(c => c !== '.').slice(-2).join('').toUpperCase() || 'EV'
                              : 'EV'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif font-semibold text-sm text-[#10151F] truncate">
                              {therapistProfile?.name || 'Dr. Elena Vance'}
                            </span>
                            {therapistProfile?.onboardingCompleted && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-[#6B7686] truncate">
                            {therapistProfile?.title || 'Licensed Clinical Psychologist'}
                          </div>
                          <div className="text-[11px] text-[#0F766E] font-medium truncate mt-0.5">
                            {therapistProfile?.practiceName || 'Mindful Practice Clinic'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-1 pt-1.5 border-t border-[#F2F5F8] space-y-0.5">
                      {onOpenOnboarding && (
                        <button
                          id="dropdown-onboarding-btn"
                          onClick={() => { setProfileDropdownOpen(false); onOpenOnboarding(); }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between text-[#10151F] hover:bg-[#F4F6F9] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Compass className="w-4 h-4 text-[#0D9488]" />
                            <span>Therapist onboarding</span>
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1FAF9] text-[#0F766E]">
                            {therapistProfile?.onboardingCompleted ? 'Review' : 'Step 1/4'}
                          </span>
                        </button>
                      )}

                      {onOpenInviteClient && (
                        <button
                          id="dropdown-invite-btn"
                          onClick={() => { setProfileDropdownOpen(false); onOpenInviteClient(); }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2.5 text-[#10151F] hover:bg-[#F4F6F9] transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4 text-[#6B7686]" />
                          <span>Invite client to portal</span>
                        </button>
                      )}

                      <button
                        onClick={() => { setProfileDropdownOpen(false); setCurrentView('settings'); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2.5 text-[#10151F] hover:bg-[#F4F6F9] transition-colors cursor-pointer"
                      >
                        <SettingsIcon className="w-4 h-4 text-[#6B7686]" />
                        <span>Practice settings</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </nav>
        </div>
      </div>
    </header>
  );
};
