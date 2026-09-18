import React, { useEffect, useState } from 'react';
import { Plus, X, UserPlus, History } from 'lucide-react';
import type { SeedContext, Assessment } from '../api';

/*
 * InviteRelationship — free-text-first context for a client invite.
 *
 * Therapist feedback: don't force our schema. There are NO required fields and no
 * "new vs ongoing" gate — the therapist writes whatever they want (in their own
 * words) about the client, or nothing at all. Whatever they write is stored on the
 * invitation as seed_context.free_text and applied verbatim (as therapist-authored
 * context) the moment the client redeems, so the AI still has something to work
 * with — without boxing the therapist into fields.
 *
 * Assessments/tests stay as an optional, fully freeform add. Reports
 * { relationship_type, seed_context, valid:true } up via onChange — the invite is
 * NEVER blocked by this component (only name + email are required, in the modal).
 */
export interface InvitePayload {
  relationship_type: 'new' | 'ongoing';
  seed_context?: SeedContext;
  valid: boolean;
}

type Row = { instrument: string; score: string; context: string; taken_at: string };
const emptyRow = (): Row => ({ instrument: '', score: '', context: '', taken_at: '' });

export const InviteRelationship: React.FC<{ onChange: (p: InvitePayload) => void }> = ({ onChange }) => {
  const [mode, setMode] = useState<'new' | 'ongoing'>('new');
  const [freeText, setFreeText] = useState('');
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

    const seed_context: SeedContext = {};
    if (freeText.trim()) seed_context.free_text = freeText.trim();
    if (assessments.length) seed_context.assessments = assessments;

    const hasSeed = !!seed_context.free_text || assessments.length > 0;
    onChange({
      relationship_type: mode, // the therapist's explicit choice — but it never gates the invite
      seed_context: hasSeed ? seed_context : undefined,
      valid: true, // never blocks — the therapist can add as much or as little as they like
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, freeText, tests]);

  const setTest = (i: number, k: keyof Row, v: string) => setTests((r) => r.map((t, idx) => (idx === i ? { ...t, [k]: v } : t)));
  const addTest = () => setTests((r) => [...r, emptyRow()]);
  const removeTest = (i: number) => setTests((r) => r.filter((_, idx) => idx !== i));

  const inp = 'w-full rounded-lg border border-[#ECEFF3] bg-[#F7F9FB] px-3 py-2 text-[14px] text-[#10151F] focus:border-[#0D9488] focus:bg-white focus:outline-none';

  return (
    <div className="space-y-3">
      {/* New vs Ongoing — the therapist's choice. Ongoing just means "we have history";
          it never forces any field. */}
      <div className="grid grid-cols-2 gap-2">
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

      {/* Free-text context — the therapist's own words, no required fields */}
      <div>
        <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">
          {mode === 'ongoing' ? 'Their history & where things stand' : 'Anything you want Unclinq to know about this client'} <span className="text-[#9AA4B2] font-normal">(optional)</span>
        </label>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={4}
          placeholder={"In your own words — history, what you're working on, how they show up, anything useful. No format needed; write it however you think about them.\n\nYou can also add or edit this anytime once they're connected (and paste/photograph existing notes there)."}
          className={`${inp} leading-relaxed`}
        />
        <p className="text-[11px] text-[#6B7686] mt-1 leading-relaxed">
          Whatever you write is kept as your own context for this client and helps Unclinq stay attuned from day one. Leave it blank to start fresh.
        </p>
      </div>

      {/* Assessments / tests — any type, fully freeform, optional */}
      <div className="rounded-xl bg-[#FBFCFD] border border-[#ECEFF3] p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#10151F]">Assessments / tests <span className="text-[#9AA4B2] font-normal">(optional)</span></span>
          <button type="button" onClick={addTest} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0F766E]">
            <Plus className="w-3.5 h-3.5" /> Add test
          </button>
        </div>
        <p className="text-[11px] text-[#6B7686] mt-1 leading-relaxed">
          Any type — PHQ-9, a Gottman or couples assessment, a trauma screen, an attachment measure, your own tool. The <strong>context</strong> (what it revealed, how to support them) attunes Emora — the client never sees raw scores.
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
