import React, { useEffect, useState } from 'react';
import { UserPlus, History, Plus, X } from 'lucide-react';
import type { SeedContext, Assessment } from '../api';

/*
 * InviteRelationship — the New vs Ongoing choice + optional assessments, shared
 * by the invite modal and the onboarding invite step.
 *   New      → client starts fresh (assessments still allowed).
 *   Ongoing  → the therapist already has history, so a little is required now.
 * Assessments/tests (any type, freeform) can be added for EITHER — their context
 * attunes Emora and anchors the briefing. Everything is stored on the invitation
 * and applied the moment the client redeems. Reports { relationship_type,
 * seed_context, valid } up via onChange; the parent blocks "Generate" until valid.
 */
export interface InvitePayload {
  relationship_type: 'new' | 'ongoing';
  seed_context?: SeedContext;
  valid: boolean;
}

type Row = { instrument: string; score: string; context: string; taken_at: string };
const emptyRow = (): Row => ({ instrument: '', score: '', context: '', taken_at: '' });
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export const InviteRelationship: React.FC<{ onChange: (p: InvitePayload) => void }> = ({ onChange }) => {
  const [mode, setMode] = useState<'new' | 'ongoing'>('new');
  const [clientSummary, setClientSummary] = useState('');
  const [wantedHelp, setWantedHelp] = useState('');
  const [experiencing, setExperiencing] = useState('');
  const [focus, setFocus] = useState('');
  const [goals, setGoals] = useState('');
  const [tests, setTests] = useState<Row[]>([]);

  useEffect(() => {
    const assessments: Assessment[] = tests
      .filter((t) => t.instrument.trim())
      .map((t) => ({
        instrument: t.instrument.trim(),
        score: t.score.trim() || undefined,
        context: t.context.trim() || undefined,
        taken_at: t.taken_at || undefined,
      }));

    const historyValid = !!clientSummary.trim() && !!focus.trim() && lines(goals).length > 0;

    const seed_context: SeedContext = {};
    if (mode === 'ongoing') {
      seed_context.client_summary = clientSummary.trim() || undefined;
      seed_context.wanted_help_with = wantedHelp.trim() || undefined;
      seed_context.experiencing = lines(experiencing);
      seed_context.focus = focus.trim() || undefined;
      seed_context.goals = lines(goals);
    }
    if (assessments.length) seed_context.assessments = assessments;

    const hasSeed = mode === 'ongoing' || assessments.length > 0;
    onChange({
      relationship_type: mode,
      seed_context: hasSeed ? seed_context : undefined,
      valid: mode === 'new' ? true : historyValid,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, clientSummary, wantedHelp, experiencing, focus, goals, tests]);

  const setTest = (i: number, k: keyof Row, v: string) => setTests((r) => r.map((t, idx) => (idx === i ? { ...t, [k]: v } : t)));
  const addTest = () => setTests((r) => [...r, emptyRow()]);
  const removeTest = (i: number) => setTests((r) => r.filter((_, idx) => idx !== i));

  const inp = 'w-full rounded-lg border border-[#ECEFF3] bg-[#F7F9FB] px-3 py-2 text-[14px] text-[#10151F] focus:border-[#0D9488] focus:bg-white focus:outline-none';
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
        <div className="space-y-3 rounded-xl bg-[#FBFCFD] border border-[#ECEFF3] p-3.5 mb-3">
          <p className="text-[12px] text-[#6B7686] leading-relaxed">
            A little history so Unclinq has continuity from day one. The summary and what they’re working through also seed their Journey; the rest stays clinician-only.
          </p>
          <div>
            <label className={lbl}>Client summary (they’ll see this){req}</label>
            <textarea value={clientSummary} onChange={(e) => setClientSummary(e.target.value)} rows={2}
              placeholder="e.g. We’ve been working together since spring on managing work stress and sleep." className={inp} />
          </div>
          <div>
            <label className={lbl}>Current focus{req}</label>
            <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Noticing the work-stress spiral earlier" className={inp} />
          </div>
          <div>
            <label className={lbl}>Goals (one per line){req}</label>
            <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2}
              placeholder={'Build an evening wind-down\nName feelings before reacting'} className={inp} />
          </div>
          <div>
            <label className={lbl}>What they wanted help with <span className="text-[#9AA4B2] font-normal">(optional)</span></label>
            <input value={wantedHelp} onChange={(e) => setWantedHelp(e.target.value)} placeholder="e.g. Feeling on edge most evenings" className={inp} />
          </div>
          <div>
            <label className={lbl}>What they’re experiencing <span className="text-[#9AA4B2] font-normal">(optional, one per line)</span></label>
            <textarea value={experiencing} onChange={(e) => setExperiencing(e.target.value)} rows={2}
              placeholder={'Trouble sleeping\nSnapping at family'} className={inp} />
          </div>
        </div>
      )}

      {/* Assessments / tests — any type, freeform. Available for new AND ongoing. */}
      <div className="rounded-xl bg-[#FBFCFD] border border-[#ECEFF3] p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#10151F]">Assessments / tests <span className="text-[#9AA4B2] font-normal">(optional)</span></span>
          <button type="button" onClick={addTest} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0F766E]">
            <Plus className="w-3.5 h-3.5" /> Add test
          </button>
        </div>
        <p className="text-[11px] text-[#6B7686] mt-1 leading-relaxed">
          Any type — PHQ-9, a Gottman or couples assessment, a trauma screen, an attachment measure, your own tool. The <strong>context</strong> (what it revealed, how to support them) attunes Emora and anchors the briefing — the client never sees raw scores.
        </p>

        {tests.length === 0 ? (
          <button type="button" onClick={addTest} className="mt-3 w-full rounded-lg border border-dashed border-[#D8E0E8] py-3 text-[13px] text-[#6B7686] hover:border-[#0D9488] hover:text-[#0F766E] transition-colors">
            + Add an assessment
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            {tests.map((t, i) => (
              <div key={i} className="rounded-lg border border-[#ECEFF3] bg-white p-3 relative">
                <button type="button" onClick={() => removeTest(i)} aria-label="Remove"
                  className="absolute top-2 right-2 text-[#9AA4B2] hover:text-[#B0332F]"><X className="w-4 h-4" /></button>
                <div className="grid grid-cols-2 gap-2 pr-6">
                  <input value={t.instrument} onChange={(e) => setTest(i, 'instrument', e.target.value)} placeholder="Test name (e.g. PHQ-9)" className={inp} />
                  <input value={t.score} onChange={(e) => setTest(i, 'score', e.target.value)} placeholder="Score / result (e.g. 14/27)" className={inp} />
                </div>
                <textarea value={t.context} onChange={(e) => setTest(i, 'context', e.target.value)} rows={2}
                  placeholder="What it revealed & how to support them — e.g. escalates fast in conflict; help them pause before reacting."
                  className={`${inp} mt-2`} />
                <div className="mt-2">
                  <label className="block text-[11px] text-[#9AA4B2] mb-1">Date taken (optional)</label>
                  <input type="date" value={t.taken_at} onChange={(e) => setTest(i, 'taken_at', e.target.value)} className={`${inp} max-w-[180px]`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
