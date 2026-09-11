import React from 'react';
import {
  ArrowRight,
  ChevronRight,
  UserPlus,
  Compass,
  Calendar
} from 'lucide-react';
import { Client, ActivityItem, TherapistProfile } from '../types';

interface HomeViewProps {
  clients: Client[];
  activities?: ActivityItem[];
  onOpenClientBriefing: (client: Client) => void;
  onNavigateToClients: () => void;
  onNavigateToCalendar?: () => void;
  onQuickAddNote?: (clientId: string, noteText: string) => void;
  therapistProfile?: TherapistProfile;
  onOpenOnboarding?: () => void;
  onOpenInviteClient?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  clients,
  onOpenClientBriefing,
  onNavigateToClients,
  onNavigateToCalendar,
  therapistProfile,
  onOpenOnboarding,
  onOpenInviteClient,
}) => {
  const todayClients = clients
    .filter(c => c.nextSession?.isToday || c.id === 'aarav-patil' || c.id === 'meera-shah' || c.id === 'riya-sen')
    .sort((a, b) => {
      const timeA = a.nextSession?.time || '12:00 PM';
      const timeB = b.nextSession?.time || '12:00 PM';
      return timeA.localeCompare(timeB);
    });

  const nextClient = todayClients[0] || clients[0];

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-10">

      {/* 1. Calm Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="u-eyebrow mb-2">Thursday, 27 August 2026</p>
          <h1 className="text-3xl sm:text-[2.5rem] font-serif font-semibold text-[#10151F] tracking-tight leading-[1.1]">
            Good morning, {therapistProfile?.name || 'Dr. Elena Vance'}
          </h1>
          <p className="text-sm text-[#6B7686] mt-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
            {todayClients.length} sessions on your schedule today
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onOpenInviteClient && (
            <button
              id="home-invite-client-btn"
              onClick={onOpenInviteClient}
              className="px-3.5 py-2 rounded-lg bg-[#F1FAF9] hover:bg-[#E3F5F2] text-[#0F766E] text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#0D9488]" />
              <span>Invite client</span>
            </button>
          )}

          {onOpenOnboarding && (
            <button
              id="home-onboarding-btn"
              onClick={onOpenOnboarding}
              className="px-3.5 py-2 rounded-lg bg-white hover:border-[#DCE2EA] text-[#3A4453] border border-[#ECEFF3] text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#6B7686]" />
              <span>Onboarding</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Next Up */}
      {nextClient && (
        <section className="space-y-3">
          <p className="u-eyebrow">Next up on your schedule</p>

          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#ECEFF3] u-card-hover">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#10151F] tracking-tight">
                  {nextClient.name}
                </h2>
                <p className="text-sm text-[#6B7686] flex items-center gap-2">
                  <span className="font-mono text-[#0F766E]">{nextClient.nextSession?.time || '10:00 AM'}</span>
                  <span className="text-[#C3CBD6]">·</span>
                  <span>{nextClient.nextSession?.duration || '50 min'}</span>
                </p>
              </div>

              <button
                onClick={() => onOpenClientBriefing(nextClient)}
                className="u-btn-primary shrink-0 self-start sm:self-auto group"
              >
                <span>Open briefing</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. Today's Agenda */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-serif font-semibold text-[#10151F]">Today’s agenda</h2>
            <span className="text-xs font-mono text-[#9AA4B2]">{todayClients.length} clients</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Calendar hidden for MVP */}

            <button
              onClick={onNavigateToClients}
              className="text-[13px] font-medium text-[#6B7686] hover:text-[#10151F] flex items-center gap-1 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-[#F4F6F9]"
            >
              <span>All clients · {clients.length}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEFF3] divide-y divide-[#F2F5F8] overflow-hidden">
          {todayClients.map((client) => (
            <div
              key={client.id}
              id={`session-row-${client.id}`}
              onClick={() => onOpenClientBriefing(client)}
              className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFBFC] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                <span className="font-mono text-sm text-[#6B7686] tabular-nums w-16 shrink-0">
                  {client.nextSession?.time || '10:00 AM'}
                </span>
                <span className="font-serif text-lg font-semibold text-[#10151F] group-hover:text-[#0F766E] transition-colors truncate">
                  {client.name}
                </span>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onOpenClientBriefing(client); }}
                className="text-[13px] font-medium text-[#6B7686] group-hover:text-[#0F766E] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Open</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
