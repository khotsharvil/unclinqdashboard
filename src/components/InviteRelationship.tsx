import React, { useEffect, useState } from 'react';
import { UserPlus, History } from 'lucide-react';
import type { SeedContext } from '../api';

/*
 * InviteRelationship — the New vs Ongoing choice shared by the invite modal and
 * the onboarding invite step.
 *   New      → nothing extra; the client starts fresh.
 *   Ongoing  → the therapist already has history with this client, so we require
 *              a little of it now. It is stored on the invitation and applied the
 *              moment the client redeems, giving continuity from day one.
 * Reports { relationship_type, seed_context, valid } up via onChange; the parent
 * blocks "Generate" until valid.
 */
export interface InvitePayload {
  relationship_type: 'new' | 'ongoing';
  seed_context?: SeedContext;
  valid: boolean;
}

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export const InviteRelationship: React.FC<{ onChange: (p: InvitePayload) => void }> = ({ onChange }) => {
  const [mode, setMode] = useState<'new' | 'ongoing'>('new');
  const [clientSummary, setClientSummary] = useState('');
  const [wantedHelp, setWantedHelp] = useState('');
  const [experiencing, setExperiencing] = useState('');
  const [focus, setFocus] = useState('');
  const [goals, setGoals] = useState('');

  useEffect(() => {
    if (mode === 'new') { onChange({ relationship_type: 'new', valid: true }); return; }
    const seed_context: SeedContext = {
      client_summary: clientSummary.trim() || undefined,
      wanted_help_with: wantedHelp.trim() || undefined,
      experiencing: lines(experiencing),
      focus: focus.trim() || undefined,
      goals: lines(goals),
    };
    // Required for an ongoing client: a summary, the current focus, and ≥1 goal.
    const valid = !!clientSummary.trim() && !!focus.trim() && lines(goals).length > 0;
    onChange({ relationship_type: 'ongoing', seed_context, valid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, clientSummary, wantedHelp, experiencing, focus, goals]);

  const ta = 'w-full rounded-lg border border-[#ECEFF3] bg-[#F7F9FB] px-3 py-2 text-[14px] text-[#10151F] focus:border-[#0D9488] focus:bg-white focus:outline-none';
  const lbl = 'block text-[13px] font-medium text-[#3A4453] mb-1.5';
  const req = <span className="text-[#B0332F]"> *</span>;

  return (
    <div>
      {/* New vs Ongoing segmented toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {([
          { k: 'new', Icon: UserPlus, title: 'New client', sub: 'Starting fresh' },
          { k: 'ongoing', Icon: History, title: 'Ongoing client', sub: 'We have history' },
        ] as const).map(({ k, Icon, title, sub }) => {
          const active = mode === k;
          return (
            <button key={k} type="button" onClick={() => setMode(k)}
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${active ? 'border-[#0D9488] bg-[#F1FAF9]' : 'border-[#ECEFF3] bg-white hover:border-[#D8E0E8]'}`}>
              <Icon className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${active ? 'text-[#0F766E]' : 'text-[#9AA4B2]'}`} />
              <span>
                <span className="block text-[13px] font-semibold text-[#10151F]">{title}</span>
                <span className="block text-[11px] text-[#6B7686]">{sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {mode === 'ongoing' && (
        <div className="space-y-3 rounded-xl bg-[#FBFCFD] border border-[#ECEFF3] p-3.5">
          <p className="text-[12px] text-[#6B7686] leading-relaxed">
            A little history so Unclinq has continuity from day one. The summary and what they’re working through also seed their Journey; the rest stays clinician-only.
          </p>
          <div>
            <label className={lbl}>Client summary (they’ll see this){req}</label>
            <textarea value={clientSummary} onChange={(e) => setClientSummary(e.target.value)} rows={2}
              placeholder="e.g. We’ve been working together since spring on managing work stress and sleep." className={ta} />
          </div>
          <div>
            <label className={lbl}>Current focus{req}</label>
            <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Noticing the work-stress spiral earlier" className={ta} />
          </div>
          <div>
            <label className={lbl}>Goals (one per line){req}</label>
            <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2}
              placeholder={'Build an evening wind-down\nName feelings before reacting'} className={ta} />
          </div>
          <div>
            <label className={lbl}>What they wanted help with <span className="text-[#9AA4B2] font-normal">(optional)</span></label>
            <input value={wantedHelp} onChange={(e) => setWantedHelp(e.target.value)} placeholder="e.g. Feeling on edge most evenings" className={ta} />
          </div>
          <div>
            <label className={lbl}>What they’re experiencing <span className="text-[#9AA4B2] font-normal">(optional, one per line)</span></label>
            <textarea value={experiencing} onChange={(e) => setExperiencing(e.target.value)} rows={2}
              placeholder={'Trouble sleeping\nSnapping at family'} className={ta} />
          </div>
        </div>
      )}
    </div>
  );
};
