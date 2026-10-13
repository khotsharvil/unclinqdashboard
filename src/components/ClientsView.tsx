import React, { useState } from 'react';
import { Search, ArrowRight, UserPlus, MessageCircle, RotateCw, Check } from 'lucide-react';
import { Client } from '../types';
import { getClientAvatarTheme } from '../utils/theme';
import { invitationsApi } from '../api';

// WhatsApp journey → chip label + tone, and the one-line explanation under the name.
const WA_CHIP: Record<string, { label: string; cls: string; hint: string }> = {
  invited:     { label: 'Invited on WhatsApp', cls: 'text-[#0F766E] bg-[#F1FAF9] border-[#CDEBE7]', hint: 'Waiting for them to tap Start' },
  started:     { label: 'Opened, not started', cls: 'text-[#B45309] bg-[#FEF3E2] border-[#F5D9A8]', hint: 'They replied but haven’t tapped Start yet' },
  declined:    { label: 'Said “not now”', cls: 'text-[#6B7686] bg-[#F4F6F8] border-[#E2E7EE]', hint: 'They can reply START whenever they’re ready' },
  send_failed: { label: 'Couldn’t deliver', cls: 'text-[#B42318] bg-[#FEF3F2] border-[#FECDCA]', hint: 'Share the join link from your WhatsApp' },
  joined:      { label: 'WhatsApp', cls: 'text-[#0F766E] bg-[#F1FAF9] border-[#CDEBE7]', hint: '' },
  paused:      { label: 'Paused (STOP)', cls: 'text-[#6B7686] bg-[#F4F6F8] border-[#E2E7EE]', hint: '' },
};

// Share link + Resend for a pending WhatsApp invite (clicks never open the row).
const InviteActions: React.FC<{ client: Client }> = ({ client }) => {
  const wa = client.whatsapp;
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  if (!wa?.inviteId) return null;
  const first = client.name.split(' ')[0] || 'there';
  const share = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!wa.joinLink) return;
    const text = `Hi ${first}, I've set up Unclinq for support between our sessions. Tap this link and press send to start: ${wa.joinLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  const resend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setState('sending');
    try { const r = await invitationsApi.resend(wa.inviteId!); setState(r.wa_status === 'sent' ? 'sent' : 'failed'); }
    catch { setState('failed'); }
  };
  const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-[#E2E7EE] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#3A4453] hover:bg-[#F8FAFB] cursor-pointer';
  return (
    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
      {wa.joinLink && <button className={btn} onClick={share} title="Send the join link from your own WhatsApp"><MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> Share link</button>}
      <button className={btn} onClick={resend} disabled={state === 'sending'} title="Send the WhatsApp invite again">
        {state === 'sent' ? <Check className="w-3.5 h-3.5 text-[#0F766E]" /> : <RotateCw className={`w-3.5 h-3.5 ${state === 'sending' ? 'animate-spin' : ''}`} />}
        {state === 'sent' ? 'Sent' : state === 'failed' ? 'Try link' : 'Resend'}
      </button>
    </div>
  );
};

interface ClientsViewProps {
  clients: Client[];
  onSelectClient: (client: Client, tab?: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes') => void;
  onOpenInviteClient?: (client?: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onSelectClient,
  onOpenInviteClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'needs_attention' | 'inactive'>('all');
  const [sortBy] = useState<'next_session' | 'name' | 'sessions_count'>('next_session');

  const filteredClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.briefing.observedPattern.text.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filter === 'all') return true;
      if (filter === 'needs_attention') return client.status === 'needs_attention';
      if (filter === 'upcoming') return client.nextSession !== null;
      if (filter === 'inactive') return client.status === 'inactive';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'sessions_count') return b.sessions.length - a.sessions.length;
      if (a.status === 'needs_attention' && b.status !== 'needs_attention') return -1;
      if (b.status === 'needs_attention' && a.status !== 'needs_attention') return 1;
      return 0;
    });

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="u-eyebrow mb-2">Active caseload</p>
          <h1 className="text-3xl sm:text-[2.5rem] font-serif font-semibold text-[#10151F] tracking-tight leading-[1.1]">
            Client directory
          </h1>
          <p className="text-sm text-[#6B7686] mt-2.5 max-w-xl">
            Longitudinal therapy loops, portal invitations, and next-session briefings.
          </p>
        </div>

        {onOpenInviteClient && (
          <button
            id="invite-client-btn"
            onClick={() => onOpenInviteClient()}
            className="u-btn-primary self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite client</span>
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA4B2]" />
          <input
            id="clients-search-input"
            type="text"
            placeholder="Search by name or clinical theme…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ECEFF3] rounded-xl text-sm text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto max-w-full">
          {(['all', 'upcoming', 'needs_attention', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              id={`filter-tab-${tab}`}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-2 rounded-lg capitalize whitespace-nowrap transition-colors text-[13px] font-medium cursor-pointer ${
                filter === tab
                  ? 'bg-[#EEF1F5] text-[#10151F]'
                  : 'text-[#6B7686] hover:text-[#10151F] hover:bg-[#F4F6F9]'
              }`}
            >
              {tab === 'needs_attention' ? 'Needs attention' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Client List — one calm surface */}
      <div>
        {filteredClients.length === 0 ? (
          <div className="p-16 text-center bg-white border border-[#ECEFF3] rounded-2xl">
            {clients.length === 0 ? (
              <>
                <p className="text-lg font-serif text-[#10151F]">No clients yet.</p>
                <p className="text-sm text-[#6B7686] mt-1.5 mb-5">Invite your first client — they’ll get a code to connect and start sharing between-session context.</p>
                <button
                  onClick={() => onOpenInviteClient()}
                  className="inline-flex items-center gap-2 text-[13px] px-4 py-2 rounded-lg bg-[#0D9488] text-white font-medium cursor-pointer"
                >
                  Invite a client
                </button>
              </>
            ) : (
              <p className="text-base font-serif text-[#6B7686]">No clients match your filter criteria.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#ECEFF3] divide-y divide-[#F2F5F8] overflow-hidden">
            {filteredClients.map((client) => {
              const isNeedsAttention = client.status === 'needs_attention';
              const isPending = client.portalStatus === 'invited';
              const avatarTheme = getClientAvatarTheme(client.id);

              return (
                <div
                  key={client.id}
                  id={`client-card-${client.id}`}
                  onClick={() => onSelectClient(client, 'briefing')}
                  className={`px-5 sm:px-6 py-4 flex items-center gap-4 transition-colors group ${isPending ? 'opacity-80 cursor-default' : 'hover:bg-[#FAFBFC] cursor-pointer'}`}
                >
                  <div className={`w-11 h-11 rounded-2xl bg-white border ${avatarTheme.border} ${avatarTheme.text} flex items-center justify-center font-serif text-base font-semibold shrink-0`}>
                    {client.avatarInitials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-[17px] font-serif font-semibold text-[#10151F] group-hover:text-[#0F766E] transition-colors truncate">
                        {client.name}
                      </h2>
                      {isNeedsAttention && !isPending && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" title="Needs attention" />
                      )}
                      {client.whatsapp ? (
                        <span className={`text-[11px] font-medium border rounded-full px-2 py-0.5 shrink-0 ${WA_CHIP[client.whatsapp.status]?.cls || ''}`}>
                          {WA_CHIP[client.whatsapp.status]?.label || 'WhatsApp'}
                        </span>
                      ) : isPending && (
                        <span className="text-[11px] font-medium text-[#B45309] bg-[#FEF3E2] border border-[#F5D9A8] rounded-full px-2 py-0.5 shrink-0">
                          Invitation pending
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#9AA4B2] truncate mt-0.5">
                      {isPending
                        ? (client.whatsapp ? WA_CHIP[client.whatsapp.status]?.hint : (client.email || 'Waiting for the client to accept'))
                        : client.briefing.observedPattern.text}
                    </p>
                  </div>

                  {isPending && client.whatsapp && <InviteActions client={client} />}

                  <div className="hidden sm:block text-right shrink-0 w-40">
                    <p className="text-[13px] text-[#6B7686] truncate">
                      {isPending ? 'Invite sent' : (client.nextSession ? client.nextSession.display : 'Not scheduled')}
                    </p>
                    {!isPending && (
                      <p className="text-[12px] text-[#C3CBD6] mt-0.5">
                        <span className="font-mono tabular-nums">{client.sessions.length}</span> sessions
                      </p>
                    )}
                  </div>

                  {!isPending && <ArrowRight className="w-4 h-4 text-[#C3CBD6] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
