import React, { useState } from 'react';
import { ClipboardList, Plus, X, Check, Loader2 } from 'lucide-react';
import { Client, ClientAssessment } from '../../types';
import { therapistApi } from '../../api';

/*
 * AssessmentsCard — the therapist's record of tests for this client (any type,
 * freeform). Shows the list and lets them add one anytime. The `context` they
 * write attunes Emora in the client app and anchors the briefing; the client
 * never sees raw scores. Self-contained: seeds from client.assessments and
 * refreshes its own list from the add response.
 */
function fmtDate(d?: string | null) {
  if (!d) return '';
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const AssessmentsCard: React.FC<{ client: Client }> = ({ client }) => {
  const [list, setList] = useState<ClientAssessment[]>(client.assessments || []);
  const [adding, setAdding] = useState(false);
  const [instrument, setInstrument] = useState('');
  const [score, setScore] = useState('');
  const [context, setContext] = useState('');
  const [takenAt, setTakenAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Only real (backend) clients can persist assessments.
  const isReal = !!(client as any)._real;

  const inp = 'w-full rounded-lg border border-[#ECEFF3] bg-[#F7F9FB] px-3 py-2 text-[14px] text-[#10151F] focus:border-[#0D9488] focus:bg-white focus:outline-none';

  function reset() { setInstrument(''); setScore(''); setContext(''); setTakenAt(''); setError(''); }

  async function save() {
    if (!instrument.trim()) { setError('Name the assessment.'); return; }
    setBusy(true); setError('');
    try {
      const res = await therapistApi.addAssessment(client.id, {
        instrument: instrument.trim(),
        score: score.trim() || undefined,
        context: context.trim() || undefined,
        taken_at: takenAt || undefined,
      });
      setList(res.assessments || []);
      reset(); setAdding(false);
    } catch (e: any) { setError(e?.data?.error || 'Could not save that assessment.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="px-6 sm:px-8 py-6 border-t border-[#F2F5F8]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#0D9488]" />
          <h3 className="text-[13px] font-semibold text-[#3A4453] tracking-tight">Assessments &amp; tests</h3>
        </div>
        {isReal && !adding && (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0F766E] hover:text-[#0D9488]">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {list.length === 0 && !adding && (
        <p className="text-[13px] text-[#9AA4B2] mt-2">No assessments recorded yet. Add PHQ-9, a Gottman or trauma assessment, an attachment measure, or your own tool — the context attunes Emora and anchors the briefing.</p>
      )}

      {list.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {list.map((a) => (
            <div key={a.id} className="rounded-xl border border-[#ECEFF3] bg-white px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] font-semibold text-[#10151F]">
                  {a.instrument}{a.score ? <span className="ml-2 font-mono text-[13px] text-[#0F766E]">{a.score}</span> : null}
                </span>
                {a.taken_at && <span className="text-[12px] text-[#9AA4B2] shrink-0">{fmtDate(a.taken_at)}</span>}
              </div>
              {a.context && <p className="text-[13px] text-[#6B7686] leading-[1.55] mt-1">{a.context}</p>}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="mt-3 rounded-xl border border-[#ECEFF3] bg-[#FBFCFD] p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input autoFocus value={instrument} onChange={(e) => setInstrument(e.target.value)} placeholder="Test name (e.g. PHQ-9)" className={inp} />
            <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score / result (e.g. 14/27)" className={inp} />
          </div>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2}
            placeholder="What it revealed & how to support them (this attunes Emora; the client never sees scores)." className={inp} />
          <div className="flex items-center justify-between gap-2">
            <input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} className={`${inp} max-w-[170px]`} />
            <div className="flex items-center gap-2">
              <button onClick={() => { reset(); setAdding(false); }} className="text-[13px] text-[#6B7686] px-3 py-2 rounded-lg hover:bg-[#F4F6F9]"><X className="w-4 h-4" /></button>
              <button onClick={save} disabled={busy} className="u-btn-primary u-btn--sm disabled:opacity-50 inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px]">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}<span>Save</span>
              </button>
            </div>
          </div>
          {error && <p className="text-[12px] text-[#B0332F]">{error}</p>}
        </div>
      )}
    </section>
  );
};
