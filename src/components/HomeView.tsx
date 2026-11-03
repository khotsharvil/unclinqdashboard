import React from 'react';
import {
  ArrowRight,
  ChevronRight,
  UserPlus,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import { Client, ActivityItem, TherapistProfile } from '../types';
import { RiskSignal } from '../api';

interface HomeViewProps {
  clients: Client[];
  activities?: ActivityItem[];
  onOpenClientBriefing: (client: Client) => void;
  onNavigateToClients: () => void;
  therapistProfile?: TherapistProfile;
  onOpenOnboarding?: () => void;
  onOpenInviteClient?: () => void;
  signals?: RiskSignal[];
  onAckSignal?: (signalId: string) => void;
  struggling?: { id: string; client_id: string; client_name: string | null; occurred_at: string }[];
  onAckCheckin?: (id: string) => void;
}

// Saved sessions sort by their timestamp; demo sample sessions ("2:30 PM", no `at`)
// by clock time today, or last if not today.
const sessionTime = (c: Client) => {
  if (c.nextSession?.at) return new Date(c.nextSession.at).getTime();
  const m = c.nextSession?.isToday && c.nextSession.time?.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return Infinity;
  const d = new Date();
  d.setHours((+m[1] % 12) + (/pm/i.test(m[3]) ? 12 : 0), +m[2], 0, 0);
  return d.getTime();
};

function ago(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export const HomeView: React.FC<HomeViewProps> = ({
  clients,
  activities = [],
  onOpenClientBriefing,
  onNavigateToClients,
  therapistProfile,
  onOpenOnboarding,
  onOpenInviteClient,
  signals = [],
  onAckSignal,
  struggling = [],
  onAckCheckin,
}) => {
  const now = Date.now();
  // Only real, saved sessions (therapist sets them on the client's page). Sessions
  // that started within the last hour still count as "today / next up".
  // (Demo-mode sample clients carry a display-only nextSession without `at`: kept,
  // with today's first.)
  const upcoming = clients
    .filter((c) => !(c as any)._pending && c.nextSession && (!c.nextSession.at || sessionTime(c) > now - 3600000))
    // NaN guard: two "no time" sessions compare equal, then today's go first.
    .sort((a, b) => (sessionTime(a) - sessionTime(b)) || (Number(!!b.nextSession?.isToday) - Number(!!a.nextSession?.isToday)));
  const todayClients = upcoming.filter((c) => c.nextSession?.isToday);
  const nextClient = upcoming[0];
  const byId = new Map<string, Client>(clients.map((c) => [c.id, c]));
  const recent = activities.filter((a) => byId.has(a.clientId)).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-10">

      {/* 1. Calm Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="u-eyebrow mb-2">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 className="text-3xl sm:text-[2.5rem] font-serif font-semibold text-[#10151F] tracking-tight leading-[1.1]">
            {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, {therapistProfile?.name || 'there'}
          </h1>
          <p className="text-sm text-[#6B7686] mt-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
            {todayClients.length === 0 ? 'No sessions today' : `${todayClients.length} session${todayClients.length === 1 ? '' : 's'} today`}
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
              <span>Add client</span>
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

      {/* 2. Needs attention: open risk signals, most severe first. */}
      {(signals.length > 0 || struggling.length > 0) && (
        <section className="space-y-3">
          <p className="u-eyebrow text-[#B45309]">Needs your attention</p>
          <div className="bg-white rounded-2xl border border-[#FED7AA] divide-y divide-[#FDEBD3] overflow-hidden">
            {signals.map((sig) => {
              const client = byId.get(sig.client_id);
              return (
                <div key={sig.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${sig.severity === 'urgent' ? 'text-[#DC2626]' : 'text-[#D97706]'}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-[#10151F]">
                        <span className="font-semibold">{client?.name || sig.client_name || 'A client'}</span>
                        <span className="text-[#6B7686]"> · {sig.severity === 'urgent' ? 'Urgent' : 'Elevated'} · {ago(sig.created_at)}</span>
                      </p>
                      <p className="text-[13px] text-[#3A4453] mt-0.5">{sig.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {client && (
                      <button onClick={() => onOpenClientBriefing(client)} className="text-[13px] font-medium text-[#0F766E] hover:underline cursor-pointer px-2 py-1">
                        Open
                      </button>
                    )}
                    {onAckSignal && (
                      <button onClick={() => onAckSignal(sig.id)} className="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-[#ECEFF3] text-[#3A4453] hover:border-[#DCE2EA] cursor-pointer">
                        Mark as seen
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {/* The client tapped "Struggling" on the daily mood question. */}
            {struggling.map((c) => {
              const client = byId.get(c.client_id);
              return (
                <div key={c.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-[#D97706] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#10151F]">
                        <span className="font-semibold">{client?.name || c.client_name || 'A client'}</span>
                        <span className="text-[#6B7686]"> · {ago(c.occurred_at)}</span>
                      </p>
                      <p className="text-[13px] text-[#3A4453] mt-0.5">Tapped “Struggling” on the daily mood question.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {client && (
                      <button onClick={() => onOpenClientBriefing(client)} className="text-[13px] font-medium text-[#0F766E] hover:underline cursor-pointer px-2 py-1">Open</button>
                    )}
                    {onAckCheckin && (
                      <button onClick={() => onAckCheckin(c.id)} className="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-[#ECEFF3] text-[#3A4453] hover:border-[#DCE2EA] cursor-pointer">Mark as seen</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Next Up: the earliest saved upcoming session. */}
      {nextClient && (
        <section className="space-y-3">
          <p className="u-eyebrow">Next up</p>

          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#ECEFF3] u-card-hover">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#10151F] tracking-tight">
                  {nextClient.name}
                </h2>
                <p className="text-sm font-mono text-[#0F766E]">{nextClient.nextSession?.display}</p>
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

      {/* 4. Today's sessions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-semibold text-[#10151F]">Today</h2>
          <button
            onClick={onNavigateToClients}
            className="text-[13px] font-medium text-[#6B7686] hover:text-[#10151F] flex items-center gap-1 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-[#F4F6F9]"
          >
            <span>All clients · {clients.length}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEFF3] divide-y divide-[#F2F5F8] overflow-hidden">
          {todayClients.length === 0 && (
            <p className="px-5 sm:px-6 py-5 text-[13px] text-[#6B7686]">
              No sessions today. Set a client’s next session on their page. It also sends them a short prep message on WhatsApp the day before.
            </p>
          )}
          {todayClients.map((client) => (
            <div
              key={client.id}
              id={`session-row-${client.id}`}
              onClick={() => onOpenClientBriefing(client)}
              className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFBFC] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                <span className="font-mono text-sm text-[#6B7686] tabular-nums w-20 shrink-0">
                  {client.nextSession?.time}
                </span>
                <span className="font-serif text-lg font-semibold text-[#10151F] group-hover:text-[#0F766E] transition-colors truncate">
                  {client.name}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7686] group-hover:text-[#0F766E] shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recent activity between sessions (WhatsApp chats, check-ins, homework). */}
      {recent.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-serif font-semibold text-[#10151F]">Recent activity</h2>
          <div className="bg-white rounded-2xl border border-[#ECEFF3] divide-y divide-[#F2F5F8] overflow-hidden">
            {recent.map((a) => {
              const client = byId.get(a.clientId)!;
              const fresh = client.briefingStatus === 'new_activity';
              return (
                <div
                  key={a.id}
                  onClick={() => onOpenClientBriefing(client)}
                  className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#FAFBFC] transition-colors cursor-pointer group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#10151F] truncate">{client.name}</p>
                    <p className="text-[13px] text-[#6B7686]">
                      Active {a.timeAgo}{fresh ? ' · new since the last briefing' : ''}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#6B7686] group-hover:text-[#0F766E] shrink-0" />
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
};
