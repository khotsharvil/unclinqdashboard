import React, { useState } from 'react';
import { X, Sparkles, Camera, Loader2, Check } from 'lucide-react';
import { therapistApi } from '../api';

/*
 * SeedHistoryModal — give an EXISTING client's history to Unclinq so both apps
 * have continuity from day one. Additive: opened from a button in the workspace
 * header; changes no tabs. Three ways in (all → POST context/seed):
 *   - type it in
 *   - paste notes / snap a photo → AI proposes → therapist edits
 * Only the "client summary" crosses into the client app; the rest stays clinical.
 */
interface Props {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onSeeded: () => void; // re-hydrate the client after seeding
}

export const SeedHistoryModal: React.FC<Props> = ({ clientId, clientName, onClose, onSeeded }) => {
  const [clientSummary, setClientSummary] = useState('');
  const [wantedHelp, setWantedHelp] = useState('');
  const [experiencing, setExperiencing] = useState('');
  const [focus, setFocus] = useState('');
  const [goals, setGoals] = useState('');
  const [techniques, setTechniques] = useState('');
  const [concerns, setConcerns] = useState('');
  const [riskNote, setRiskNote] = useState('');
  const [priorSessions, setPriorSessions] = useState('');
  const [startedAt, setStartedAt] = useState('');

  const [notesText, setNotesText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

  function applyProposals(p: any) {
    if (p.focus) setFocus(p.focus);
    if (Array.isArray(p.goals) && p.goals.length) setGoals(p.goals.join('\n'));
    if (Array.isArray(p.techniques) && p.techniques.length) setTechniques(p.techniques.join('\n'));
    if (Array.isArray(p.concerns) && p.concerns.length) setConcerns(p.concerns.join('\n'));
    if (p.risk_note) setRiskNote(p.risk_note);
    if (p.client_summary) setClientSummary(p.client_summary);
    if (p.wanted_help_with) setWantedHelp(p.wanted_help_with);
    if (Array.isArray(p.experiencing) && p.experiencing.length) setExperiencing(p.experiencing.join('\n'));
  }

  async function extractFromText() {
    if (!notesText.trim()) { setError('Paste some notes first.'); return; }
    setExtracting(true); setError('');
    try {
      const r = await therapistApi.extractContextText(clientId, notesText.trim());
      applyProposals(r.proposals || {});
    } catch (e: any) { setError(e?.message || 'Could not read those notes.'); }
    finally { setExtracting(false); }
  }

  async function extractFromImage(file: File) {
    setExtracting(true); setError('');
    try {
      const r = await therapistApi.extractContextImage(clientId, file);
      applyProposals(r.proposals || {});
    } catch (e: any) { setError(e?.message || 'Could not read that image.'); }
    finally { setExtracting(false); }
  }

  async function save() {
    setSaving(true); setError('');
    try {
      await therapistApi.seedContext(clientId, {
        client_summary: clientSummary.trim() || undefined,
        wanted_help_with: wantedHelp.trim() || undefined,
        experiencing: lines(experiencing),
        focus: focus.trim() || undefined,
        goals: lines(goals),
        techniques: lines(techniques),
        concerns: lines(concerns),
        risk_note: riskNote.trim() || undefined,
        prior_sessions: priorSessions ? Number(priorSessions) : undefined,
        started_at: startedAt || undefined,
      });
      setDone(true);
      setTimeout(() => { onSeeded(); onClose(); }, 700);
    } catch (e: any) { setError(e?.message || 'Could not save.'); setSaving(false); }
  }

  const field = 'w-full rounded-lg border border-[#ECEFF3] px-3 py-2 text-[14px] text-[#10151F] focus:border-[#0D9488] focus:outline-none';
  const label = 'text-[12px] font-medium text-[#6B7686] mb-1 block';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECEFF3]">
          <div>
            <h2 className="text-[17px] font-serif font-semibold text-[#10151F]">Add {clientName.split(' ')[0]}’s history</h2>
            <p className="text-[12px] text-[#6B7686] mt-0.5">So Unclinq has continuity from day one. Only the client summary is shown to the client.</p>
          </div>
          <button onClick={onClose} className="text-[#9AA4B2] hover:text-[#10151F]"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* AI assist from existing notes */}
          <div className="rounded-xl bg-[#F7FAFA] border border-[#E3EEEC] p-3">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#0F766E] mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Start from your existing notes (optional)
            </div>
            <textarea className={field} rows={3} placeholder="Paste session notes here…" value={notesText} onChange={(e) => setNotesText(e.target.value)} />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={extractFromText} disabled={extracting}
                className="text-[13px] px-3 py-1.5 rounded-lg bg-[#0D9488] text-white font-medium disabled:opacity-50 flex items-center gap-1.5">
                {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Extract
              </button>
              <label className="text-[13px] px-3 py-1.5 rounded-lg border border-[#ECEFF3] text-[#10151F] font-medium cursor-pointer flex items-center gap-1.5 hover:border-[#0D9488]">
                <Camera className="w-3.5 h-3.5" /> Photo of notes
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) extractFromImage(f); }} />
              </label>
            </div>
            <p className="text-[11px] text-[#9AA4B2] mt-2">AI proposes — you review and edit everything below before saving. Images aren’t stored.</p>
          </div>

          <div>
            <label className={label}>Client-facing summary <span className="text-[#0F766E]">(the client sees this)</span></label>
            <textarea className={field} rows={2} placeholder="e.g. You and I have been working on staying present in hard conversations." value={clientSummary} onChange={(e) => setClientSummary(e.target.value)} />
            <label className={`${label} mt-3`}>What they wanted help with <span className="text-[#0F766E]">(client sees this, in their words)</span></label>
            <input className={field} placeholder="e.g. I want to stop thinking about work all the time." value={wantedHelp} onChange={(e) => setWantedHelp(e.target.value)} />
            <label className={`${label} mt-3`}>What they were experiencing <span className="text-[#0F766E]">(client-facing, one per line)</span></label>
            <textarea className={field} rows={2} placeholder={'Work stress\nDifficulty switching off\nNighttime overthinking'} value={experiencing} onChange={(e) => setExperiencing(e.target.value)} />
          </div>

          <div className="pt-1 border-t border-[#ECEFF3]">
            <p className="text-[11px] font-medium text-[#9AA4B2] uppercase tracking-wide mt-3 mb-2">Clinical (yours only)</p>
            <label className={label}>Current focus</label>
            <input className={field} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Reduce avoidant coping around conflict" />
          </div>
          <div><label className={label}>Goals (one per line)</label><textarea className={field} rows={2} value={goals} onChange={(e) => setGoals(e.target.value)} /></div>
          <div><label className={label}>Techniques / modality (one per line)</label><textarea className={field} rows={2} value={techniques} onChange={(e) => setTechniques(e.target.value)} /></div>
          <div><label className={label}>Presenting concerns (one per line)</label><textarea className={field} rows={2} value={concerns} onChange={(e) => setConcerns(e.target.value)} /></div>
          <div><label className={label}>Risk / safety note</label><input className={field} value={riskNote} onChange={(e) => setRiskNote(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Prior sessions</label><input className={field} type="number" min={0} value={priorSessions} onChange={(e) => setPriorSessions(e.target.value)} /></div>
            <div><label className={label}>Care began</label><input className={field} type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} /></div>
          </div>

          {error && <p className="text-[13px] text-[#B0332F]">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#ECEFF3]">
          <button onClick={onClose} className="text-[13px] px-4 py-2 rounded-lg text-[#6B7686] font-medium">Cancel</button>
          <button onClick={save} disabled={saving || done}
            className="text-[13px] px-4 py-2 rounded-lg bg-[#0D9488] text-white font-medium disabled:opacity-50 flex items-center gap-1.5">
            {done ? <><Check className="w-4 h-4" /> Saved</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save history'}
          </button>
        </div>
      </div>
    </div>
  );
};
