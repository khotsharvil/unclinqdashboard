import React, { useEffect, useState } from 'react';
import { Check, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { therapistApi } from '../../api';

// After a session: everything the therapist needs in ONE place, right after the
// recording is processed (also opened from a draft session in the Sessions tab).
//   summary (editable) → homework agreed in the session (keep / edit / remove)
//   → AI suggestions and "write your own" → next session → one "Approve & send".
// Nothing reaches the client until Approve. The session's own homework is released by
// the approve call; added items are assigned after it (each goes out on WhatsApp).

type Draft = { id: string; text: string; original: string; keep: boolean };
type Added = { key: string; title: string; rationale?: string; cadence?: string };

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const quietNow = () => { const h = new Date(Date.now() + 5.5 * 3600e3).getUTCHours(); return h >= 21 || h < 9; };

export const SessionReview: React.FC<{
  sessionId: string;
  clientId: string;
  clientName: string;
  nextSessionAt?: string | null;
  onSetNextSession?: (clientId: string, iso: string | null) => Promise<void>;
  onLater: () => void;
  onApproved: () => void;
}> = ({ sessionId, clientId, clientName, nextSessionAt, onSetNextSession, onLater, onApproved }) => {
  const first = clientName.split(/\s+/)[0] || 'the client';
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [summary0, setSummary0] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [added, setAdded] = useState<Added[]>([]);
  const [own, setOwn] = useState('');
  const [ideas, setIdeas] = useState<{ title: string; cadence: string; rationale: string }[] | null>(null);
  const [ideasBusy, setIdeasBusy] = useState(false);
  const [next, setNext] = useState(toLocalInput(nextSessionAt));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    therapistApi.session(sessionId).then((r: any) => {
      if (!live) return;
      const s = r?.session || {};
      setSummary(s.session_summary || ''); setSummary0(s.session_summary || '');
      setDrafts((r?.exercises || [])
        .filter((e: any) => !e.released && e.status !== 'skipped')
        .map((e: any) => ({ id: e.id, text: e.description, original: e.description, keep: true })));
    }).catch(() => setError('Could not load this session.')).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [sessionId]);

  const suggest = async () => {
    setIdeasBusy(true);
    try { setIdeas((await therapistApi.suggestActions(clientId)).suggestions || []); }
    catch { setIdeas([]); }
    finally { setIdeasBusy(false); }
  };
  const addOwn = () => {
    const t = own.trim();
    if (!t) return;
    setAdded((a) => [...a, { key: `own-${Date.now()}`, title: t }]);
    setOwn('');
  };

  const sending = drafts.filter((d) => d.keep && d.text.trim()).length + added.length;

  const approve = async () => {
    setBusy(true); setError('');
    try {
      if (summary.trim() && summary !== summary0) await therapistApi.editSessionSummary(sessionId, summary.trim());
      for (const d of drafts) {
        if (!d.keep || !d.text.trim()) await therapistApi.deleteExercise(clientId, d.id);
        else if (d.text.trim() !== d.original) await therapistApi.editExercise(clientId, d.id, { description: d.text.trim() });
      }
      await therapistApi.approveSession(sessionId);
      for (const a of added) await therapistApi.assignExercise(clientId, a.title, { rationale: a.rationale, cadence: a.cadence });
      if (onSetNextSession && next && next !== toLocalInput(nextSessionAt)) await onSetNextSession(clientId, new Date(next).toISOString());
      setDone(sending);
    } catch (e: any) {
      setError(e?.data?.error || e?.message || 'Something went wrong. Nothing more was sent; try again.');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 text-[#0D9488] animate-spin" /></div>;

  if (done !== null) return (
    <div className="py-4 space-y-4">
      <div className="flex items-start gap-2.5 p-4 rounded-xl border border-[#CDEBE4] bg-[#F0FAF8]">
        <Check className="w-4 h-4 text-[#0F766E] mt-0.5" />
        <div className="text-[14px] text-[#0F766E]">
          <p className="font-semibold">Session approved.</p>
          <p className="mt-0.5">
            {done === 0 ? 'No homework this time.'
              : `${done} homework item${done === 1 ? '' : 's'} ${quietNow() ? 'will go' : 'sent'} to ${first} on WhatsApp${quietNow() ? ' at 9 am' : ''}.`}
          </p>
        </div>
      </div>
      <button onClick={onApproved} className="u-btn-primary w-full justify-center">Done</button>
    </div>
  );

  const label = 'block text-[12px] font-semibold text-[#3A4453] mb-1.5';
  const field = 'w-full rounded-lg border border-[#E2E7EE] bg-white px-3 py-2 text-[14px] text-[#10151F] focus:outline-none focus:border-[#0D9488]';

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-[#6B7686]">Check the summary and homework. Nothing is sent to {first} until you approve.</p>

      <div>
        <label className={label}>Session summary</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} className={`${field} leading-relaxed`}
          placeholder="No summary was generated. Add a few lines if you like." />
      </div>

      <div>
        <label className={label}>Homework agreed in the session</label>
        {drafts.length === 0 ? (
          <p className="text-[13px] text-[#9AA4B2]">None was picked up from the recording.</p>
        ) : (
          <ul className="space-y-2">
            {drafts.map((d) => (
              <li key={d.id} className="flex items-start gap-2">
                <input type="checkbox" checked={d.keep} className="mt-2.5 w-4 h-4 accent-[#0D9488]"
                  onChange={(e) => setDrafts((ds) => ds.map((x) => (x.id === d.id ? { ...x, keep: e.target.checked } : x)))} />
                <input value={d.text} disabled={!d.keep} className={`${field} ${d.keep ? '' : 'opacity-50 line-through'}`}
                  onChange={(e) => setDrafts((ds) => ds.map((x) => (x.id === d.id ? { ...x, text: e.target.value } : x)))} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {added.length > 0 && (
        <ul className="space-y-2">
          {added.map((a) => (
            <li key={a.key} className="flex items-start gap-2 rounded-lg border border-[#CDEBE7] bg-[#F7FCFB] px-3 py-2">
              <span className="flex-1 text-[14px] text-[#10151F]">{a.title}{a.cadence ? <span className="text-[#6B7686]"> · {a.cadence}</span> : null}</span>
              <button onClick={() => setAdded((xs) => xs.filter((x) => x.key !== a.key))} className="text-[#9AA4B2] hover:text-[#B0332F] cursor-pointer" aria-label="Remove"><X className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <div className="flex gap-2">
          <input value={own} onChange={(e) => setOwn(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOwn(); } }}
            className={field} placeholder="Write your own homework…" />
          <button onClick={addOwn} disabled={!own.trim()} className="shrink-0 inline-flex items-center gap-1 px-3 rounded-lg border border-[#E2E7EE] text-[13px] font-medium text-[#0F766E] disabled:opacity-40 cursor-pointer"><Plus className="w-4 h-4" />Add</button>
        </div>
        {ideas === null ? (
          <button onClick={suggest} disabled={ideasBusy} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0F766E] hover:underline cursor-pointer disabled:opacity-60">
            {ideasBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Suggest homework from this session
          </button>
        ) : ideas.length === 0 ? (
          <p className="text-[12px] text-[#9AA4B2]">No suggestions: not enough from the session yet.</p>
        ) : (
          <ul className="space-y-2">
            {ideas.filter((i) => !added.some((a) => a.title === i.title)).map((i) => (
              <li key={i.title} className="flex items-start gap-3 rounded-lg border border-[#ECEFF3] px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-[#10151F]">{i.title}</p>
                  {(i.cadence || i.rationale) && <p className="text-[12px] text-[#6B7686] mt-0.5">{[i.cadence, i.rationale].filter(Boolean).join(' · ')}</p>}
                </div>
                <button onClick={() => setAdded((a) => [...a, { key: `ai-${i.title}`, title: i.title, rationale: i.rationale, cadence: i.cadence }])}
                  className="shrink-0 inline-flex items-center gap-1 text-[13px] font-medium text-[#0F766E] cursor-pointer"><Plus className="w-4 h-4" />Add</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {onSetNextSession && (
        <div>
          <label className={label}>Next session <span className="font-normal text-[#9AA4B2]">(optional: {first} gets a short prep message the day before)</span></label>
          <input type="datetime-local" value={next} onChange={(e) => setNext(e.target.value)} className={field} />
        </div>
      )}

      {error && <p className="text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-lg px-3 py-2">{error}</p>}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button onClick={onLater} disabled={busy} className="text-[13px] text-[#6B7686] hover:text-[#10151F] cursor-pointer">Review later</button>
        <button onClick={approve} disabled={busy} className="u-btn-primary">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>{sending > 0 ? `Approve & send ${sending} to ${first}` : 'Approve session'}</span>
        </button>
      </div>
    </div>
  );
};
