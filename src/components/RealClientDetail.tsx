import React, { useEffect, useState } from 'react';
import { ArrowLeft, Target, FileText, Zap, Copy, Check, Camera, Sparkles, Loader2, Pencil, X, Plus, ClipboardList } from 'lucide-react';
import { therapistApi, inviteLink } from '../api';

/*
 * Real, backend-backed client detail — free-text-first and fully editable.
 * Reads /api/therapist/clients/:id/overview and lets the therapist add context in
 * their own words (type or photograph), then edit or delete ANY item (goals,
 * themes, actions, assessments, session summary). No rigid fields; the AI still
 * structures free-text in the background into the same schema the engine reads.
 * The briefing is the only thing that stays a fixed layout (it's the AI's output).
 */
export const RealClientDetail: React.FC<{ client: any; onBack: () => void }> = ({ client, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const refresh = React.useCallback(async () => {
    try { setData(await therapistApi.overview(client.id)); } catch { /* keep prior */ }
  }, [client.id]);

  useEffect(() => {
    if (client._pending) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    therapistApi.overview(client.id)
      .then((d) => { if (alive) setData(d); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [client.id, client._pending]);

  // Pending invitation — no account yet.
  if (client._pending) {
    const link = client._code ? inviteLink(client._code) : '';
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6B7686] hover:text-[#10151F] mb-5">
          <ArrowLeft className="w-4 h-4" /> All clients
        </button>
        <div className="bg-white rounded-2xl border border-[#ECEFF3] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F1FAF9] text-[#0F766E] flex items-center justify-center font-serif text-xl mx-auto mb-4">{client.avatarInitials}</div>
          <h2 className="text-xl font-serif font-semibold text-[#10151F]">{client.name}</h2>
          <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FBF3E4] text-[#93641B] border border-[#F0DEBE]">Invitation pending</span>
          <p className="text-sm text-[#6B7686] mt-4 max-w-md mx-auto">
            {client.name} hasn’t joined yet. Once they redeem the code and finish onboarding, they’ll appear here as connected and their between-session activity will flow in.
          </p>
          {client._code && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-[#F7F9FB] border border-[#ECEFF3] font-mono font-semibold tracking-widest text-[#10151F]">{client._code}</span>
              <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="u-btn-ghost text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-[#0F766E]" /> : <Copy className="w-3.5 h-3.5 text-[#6B7686]" />}<span>{copied ? 'Copied' : 'Copy link'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const goals = data?.goals || [];
  const themes = data?.themes || [];
  const exercises = data?.exercises || [];
  const assessments = data?.assessments || [];
  const session = data?.latest_session;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6B7686] hover:text-[#10151F] mb-5">
        <ArrowLeft className="w-4 h-4" /> All clients
      </button>

      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center font-serif text-xl">{client.avatarInitials}</div>
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#10151F]">{client.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1FAF9] text-[#0F766E] border border-[#CCE9E6]">Connected</span>
            {client._newActivity && <span className="text-[11px] text-[#0F766E] font-medium">• New activity</span>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-[#9AA4B2]">Loading…</div>
      ) : (
        <div className="space-y-4">
          {/* Free-text-first capture — write or photograph anything, in your words */}
          <AddContext clientId={client.id} onSaved={refresh} />

          <Section icon={<Target className="w-4 h-4 text-[#0D9488]" />} title="Current focus">
            {goals.length || themes.length ? (
              <ul className="space-y-1.5">
                {goals.map((g: any) => (
                  <EditableItem key={g.id} prefix="🎯" text={g.content}
                    onSave={(v) => therapistApi.editMemory(client.id, g.id, { content: v }).then(refresh)}
                    onDelete={() => therapistApi.deleteMemory(client.id, g.id).then(refresh)} />
                ))}
                {themes.map((t: any) => (
                  <EditableItem key={t.id} prefix="•" text={t.content}
                    onSave={(v) => therapistApi.editMemory(client.id, t.id, { content: v }).then(refresh)}
                    onDelete={() => therapistApi.deleteMemory(client.id, t.id).then(refresh)} />
                ))}
              </ul>
            ) : <Empty>No focus set yet — add one below, or it appears after the first approved session.</Empty>}
            <AddInput placeholder="Add a focus or theme, in your words…"
              onAdd={(v) => therapistApi.addMemory(client.id, v, 'goal').then(refresh)} />
          </Section>

          <Section icon={<FileText className="w-4 h-4 text-[#0D9488]" />} title="Latest session">
            {session ? (
              <div>
                <p className="text-xs text-[#9AA4B2] mb-1">{new Date(session.occurred_at).toLocaleString(undefined, { dateStyle: 'medium' })} · {session.summary_status === 'draft' ? 'Draft — review & approve' : 'Approved'}</p>
                <EditableItem multiline text={typeof session.session_summary === 'string' ? session.session_summary : '—'}
                  onSave={(v) => therapistApi.editSessionSummary(session.id, v).then(refresh)} />
              </div>
            ) : <Empty>No sessions recorded yet.</Empty>}
          </Section>

          <Section icon={<Zap className="w-4 h-4 text-[#0D9488]" />} title="Between-session actions">
            {exercises.length ? (
              <ul className="space-y-2">
                {exercises.map((x: any) => (
                  <li key={x.id} className="flex items-start justify-between gap-3">
                    <EditableItem className="flex-1" text={x.description} note={x.feedback}
                      onSave={(v) => therapistApi.editExercise(client.id, x.id, { description: v }).then(refresh)}
                      onDelete={() => therapistApi.deleteExercise(client.id, x.id).then(refresh)} />
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F7F9FB] border border-[#ECEFF3] text-[#6B7686] shrink-0 capitalize">{x.status}</span>
                  </li>
                ))}
              </ul>
            ) : <Empty>No actions assigned yet.</Empty>}
            <AddInput placeholder="Assign an action, in your words…"
              onAdd={(v) => therapistApi.assignExercise(client.id, v).then(refresh)} />
          </Section>

          <Section icon={<ClipboardList className="w-4 h-4 text-[#0D9488]" />} title="Assessments & tests">
            {assessments.length ? (
              <ul className="space-y-2">
                {assessments.map((a: any) => (
                  <EditableItem key={a.id} prefix="📋"
                    text={`${a.instrument}${a.score ? ` (${a.score})` : ''}${a.context ? ` — ${a.context}` : ''}`}
                    onSave={(v) => therapistApi.editAssessment(client.id, a.id, { context: v }).then(refresh)}
                    onDelete={() => therapistApi.deleteAssessment(client.id, a.id).then(refresh)} />
                ))}
              </ul>
            ) : <Empty>No assessments recorded yet.</Empty>}
            <AddInput placeholder="Add an assessment — name & what it revealed…"
              onAdd={(v) => therapistApi.addAssessment(client.id, { instrument: v.slice(0, 60), context: v }).then(refresh)} />
          </Section>
        </div>
      )}
    </div>
  );
};

// ── Free-text/photo "Add context" capture — routes through the same seed/extract
//    pipeline, so free-text is structured into the engine's schema in the background.
const AddContext: React.FC<{ clientId: string; onSaved: () => void }> = ({ clientId, onSaved }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<'' | 'save' | 'photo'>('');
  const [msg, setMsg] = useState('');

  async function save() {
    if (!text.trim()) return;
    setBusy('save'); setMsg('');
    try { await therapistApi.seedContext(clientId, { free_text: text.trim() }); setText(''); setMsg('Added.'); onSaved(); }
    catch (e: any) { setMsg(e?.message || 'Could not save.'); }
    finally { setBusy(''); setTimeout(() => setMsg(''), 1500); }
  }
  async function photo(file: File) {
    setBusy('photo'); setMsg('');
    try {
      const r = await therapistApi.extractContextImage(clientId, file);
      await therapistApi.seedContext(clientId, { ...(r.proposals || {}) });
      setMsg('Read from photo & added.'); onSaved();
    } catch (e: any) { setMsg(e?.message || 'Could not read that image.'); }
    finally { setBusy(''); setTimeout(() => setMsg(''), 1800); }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#ECEFF3] p-5">
      <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-[#0D9488]" /><span className="u-eyebrow">Add context</span></div>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="Anything about this client, in your own words — we’ll keep it and quietly fit it into their picture. Or snap a photo of your notes."
        className="w-full rounded-lg border border-[#ECEFF3] bg-[#F7F9FB] px-3 py-2 text-[14px] text-[#10151F] focus:border-[#0D9488] focus:bg-white focus:outline-none leading-relaxed"
      />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={save} disabled={busy !== '' || !text.trim()}
          className="text-[13px] px-3 py-1.5 rounded-lg bg-[#0D9488] text-white font-medium disabled:opacity-50 flex items-center gap-1.5">
          {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
        </button>
        <label className="text-[13px] px-3 py-1.5 rounded-lg border border-[#ECEFF3] text-[#10151F] font-medium cursor-pointer flex items-center gap-1.5 hover:border-[#0D9488]">
          {busy === 'photo' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />} Photo of notes
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) photo(f); }} />
        </label>
        {msg && <span className="text-[12px] text-[#6B7686]">{msg}</span>}
      </div>
      <p className="text-[11px] text-[#9AA4B2] mt-2">No format needed. Images aren’t stored.</p>
    </div>
  );
};

// ── Inline-editable text item: shows text; pencil→edit, x→delete. onDelete optional.
const EditableItem: React.FC<{
  text: string; prefix?: string; note?: string; multiline?: boolean; className?: string;
  onSave: (v: string) => Promise<any> | void; onDelete?: () => Promise<any> | void;
}> = ({ text, prefix, note, multiline, className, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(text);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setVal(text); }, [text]);

  if (editing) {
    return (
      <div className={`flex items-start gap-2 ${className || ''}`}>
        {multiline
          ? <textarea autoFocus value={val} onChange={(e) => setVal(e.target.value)} rows={3}
              className="flex-1 rounded-lg border border-[#0D9488] px-2.5 py-1.5 text-sm text-[#10151F] focus:outline-none" />
          : <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
              className="flex-1 rounded-lg border border-[#0D9488] px-2.5 py-1.5 text-sm text-[#10151F] focus:outline-none" />}
        <button disabled={busy} onClick={async () => { setBusy(true); await onSave(val.trim()); setBusy(false); setEditing(false); }}
          className="text-[#0F766E] p-1">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</button>
        <button onClick={() => { setVal(text); setEditing(false); }} className="text-[#9AA4B2] p-1"><X className="w-4 h-4" /></button>
      </div>
    );
  }
  return (
    <li className={`group flex items-start justify-between gap-2 list-none ${className || ''}`}>
      <div className="text-sm text-[#10151F]">
        {prefix ? `${prefix} ` : ''}{text}
        {note && <span className="block text-xs text-[#6B7686] italic mt-0.5">“{note}”</span>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => setEditing(true)} aria-label="Edit" className="text-[#9AA4B2] hover:text-[#0F766E] p-1"><Pencil className="w-3.5 h-3.5" /></button>
        {onDelete && <button onClick={onDelete} aria-label="Delete" className="text-[#9AA4B2] hover:text-[#B0332F] p-1"><X className="w-3.5 h-3.5" /></button>}
      </div>
    </li>
  );
};

// ── Free-text add row.
const AddInput: React.FC<{ placeholder: string; onAdd: (v: string) => Promise<any> | void }> = ({ placeholder, onAdd }) => {
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => { if (!val.trim()) return; setBusy(true); await onAdd(val.trim()); setBusy(false); setVal(''); };
  return (
    <div className="flex items-center gap-2 mt-3">
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        className="flex-1 rounded-lg border border-[#ECEFF3] bg-[#F7F9FB] px-3 py-2 text-[13px] text-[#10151F] placeholder-[#9AA4B2] focus:border-[#0D9488] focus:bg-white focus:outline-none" />
      <button onClick={submit} disabled={busy || !val.trim()}
        className="text-[13px] px-3 py-2 rounded-lg border border-[#ECEFF3] text-[#0F766E] font-medium disabled:opacity-40 hover:border-[#0D9488] flex items-center gap-1">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
      </button>
    </div>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-[#ECEFF3] p-5">
    <div className="flex items-center gap-2 mb-3">{icon}<span className="u-eyebrow">{title}</span></div>
    {children}
  </div>
);
const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-[#9AA4B2]">{children}</p>
);
