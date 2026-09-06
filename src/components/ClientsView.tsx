import React, { useState } from 'react';
import { Search, ArrowRight, UserPlus } from 'lucide-react';
import { Client } from '../types';
import { getClientAvatarTheme } from '../utils/theme';

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
            <p className="text-base font-serif text-[#6B7686]">No clients match your filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#ECEFF3] divide-y divide-[#F2F5F8] overflow-hidden">
            {filteredClients.map((client) => {
              const isNeedsAttention = client.status === 'needs_attention';
              const avatarTheme = getClientAvatarTheme(client.id);

              return (
                <div
                  key={client.id}
                  id={`client-card-${client.id}`}
                  onClick={() => onSelectClient(client, 'briefing')}
                  className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-[#FAFBFC] transition-colors cursor-pointer group"
                >
                  <div className={`w-11 h-11 rounded-2xl bg-white border ${avatarTheme.border} ${avatarTheme.text} flex items-center justify-center font-serif text-base font-semibold shrink-0`}>
                    {client.avatarInitials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-[17px] font-serif font-semibold text-[#10151F] group-hover:text-[#0F766E] transition-colors truncate">
                        {client.name}
                      </h2>
                      {isNeedsAttention && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" title="Needs attention" />
                      )}
                    </div>
                    <p className="text-[13px] text-[#9AA4B2] truncate mt-0.5">
                      {client.briefing.observedPattern.text}
                    </p>
                  </div>

                  <div className="hidden sm:block text-right shrink-0 w-40">
                    <p className="text-[13px] text-[#6B7686] truncate">
                      {client.nextSession ? client.nextSession.display : 'Not scheduled'}
                    </p>
                    <p className="text-[12px] text-[#C3CBD6] mt-0.5">
                      <span className="font-mono tabular-nums">{client.sessions.length}</span> sessions
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#C3CBD6] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
