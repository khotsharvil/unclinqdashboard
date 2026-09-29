import React, { useEffect, useMemo, useState } from 'react';
import { Plus, CheckCircle2, Trash2, Check, Sparkles, Pencil, X, Wand2, Loader2 } from 'lucide-react';
import { Client, ActionItem } from '../../types';
import { therapistApi } from '../../api';

interface ActionsViewProps {
  client: Client;
  onAddAction?: (newAction: Partial<ActionItem>) => void;
  onUpdateActionStatus?: (actionId: string, status: ActionItem['status']) => void;
  onUpdateAction?: (actionId: string, patch: Partial<ActionItem>) => void;
  onDeleteAction?: (actionId: string) => void;
}

type Suggestion = { title: string; cadence: string; rationale: string };

// ── Level 3: domain-aware template library ─────────────────────────────────
// Concrete, client-doable between-session actions grouped by how the therapist
// works. "Common" always shows; the rest surface based on the therapist's
// specializations (falling back to all when we can't tell).
const TEMPLATES: Record<string, { title: string; cadence: string }[]> = {
  Common: [
    { title: 'Write down one thing that went okay today', cadence: 'Daily, at night' },
    { title: 'Note the moment you felt most stirred up, and what came just before it', cadence: 'When it happens' },
    { title: 'Take three slow breaths before reacting to something hard', cadence: 'When you notice tension' },
  ],
  CBT: [
    { title: 'Fill a thought record when a strong feeling hits (situation → thought → evidence → reframe)', cadence: 'When you notice a spike' },
    { title: 'Schedule one small enjoyable or meaningful activity', cadence: 'Daily' },
    { title: 'Set aside 15 min of "worry time" and postpone worries to it', cadence: 'Daily, same time' },
    { title: 'Catch one "all-or-nothing" thought and write a more balanced version', cadence: 'When it comes up' },
  ],
  DBT: [
    { title: 'Use TIPP (cold water / paced breathing) when distress is very high', cadence: 'In a crisis moment' },
    { title: 'Try opposite action: do the opposite of what the urge says', cadence: 'When an urge is strong' },
    { title: 'Self-soothe using the five senses for a few minutes', cadence: 'When overwhelmed' },
    { title: 'Keep a short emotion diary: emotion, intensity 0–10, what preceded it', cadence: 'Daily' },
  ],
  ACT: [
    { title: 'Name a value and take one small action toward it', cadence: '3× this week' },
    { title: 'Try defusion: "I\'m having the thought that…" when hooked by a thought', cadence: 'When you notice hooking' },
    { title: 'Practice making room for a hard feeling instead of pushing it away', cadence: 'When it shows up' },
  ],
  Couples: [
    { title: 'Share one appreciation with your partner', cadence: 'Daily' },
    { title: 'Do a 20-minute distraction-free check-in together', cadence: 'Twice this week' },
    { title: 'Use a soft start-up: begin a concern with "I feel… I need…"', cadence: 'When raising something' },
    { title: 'Ask each other one "love map" question about your day/world', cadence: 'Daily' },
  ],
  Child: [
    { title: 'Use a feelings chart to point to how you feel (with a parent)', cadence: 'Daily' },
    { title: 'Put a worry in the "worry box" and set it aside', cadence: 'When a worry feels big' },
    { title: 'Draw the feeling and what it looks like', cadence: 'When something feels hard' },
    { title: 'Practice the "calm-down corner" with slow belly breaths', cadence: 'When upset' },
  ],
  Trauma: [
    { title: 'Ground with 5-4-3-2-1 (5 things you see, 4 hear, 3 touch…)', cadence: 'When you feel unsafe/dissociated' },
    { title: 'Visit your "safe/calm place" in your mind for a few minutes', cadence: 'Daily, and when triggered' },
    { title: 'Use the "container" exercise to set aside distressing material until session', cadence: 'When it surfaces' },
    { title: 'Notice and name where you are on your window of tolerance', cadence: 'A few times a day' },
  ],
  Mindfulness: [
    { title: 'Do a short breathing practice', cadence: 'Daily, 5 min' },
    { title: 'Try a body scan before sleep', cadence: 'Nightly' },
    { title: 'Take one mindful walk, noticing your senses', cadence: '3× this week' },
  ],
  Sleep: [
    { title: 'Keep a simple sleep log (bedtime, wake time, quality)', cadence: 'Every morning' },
    { title: 'Start a 30-minute screen-free wind-down before bed', cadence: 'Nightly' },
    { title: 'If not asleep in 20 min, get up and do something calm, then return', cadence: 'As needed at night' },
  ],
  Behavioral: [
    { title: 'Make an if-then plan: "If [situation], then I will [action]"', cadence: 'Set once, use as needed' },
    { title: 'Stack a new habit onto an existing one', cadence: 'Daily' },
    { title: 'Take one small step toward a task you\'ve been avoiding', cadence: 'Daily' },
  ],
};

// Map a freeform specialization string → a template group key.
function specToKey(spec: string): string | null {
  const s = spec.toLowerCase();
  if (/cbt|cognitive.behav/.test(s)) return 'CBT';
  if (/dbt|dialectic/.test(s)) return 'DBT';
  if (/\bact\b|acceptance.commit/.test(s)) return 'ACT';
  if (/coupl|marriage|relationship|family|marital/.test(s)) return 'Couples';
  if (/child|adolescent|paediatric|pediatric|teen|play/.test(s)) return 'Child';
  if (/trauma|emdr|ptsd|abuse/.test(s)) return 'Trauma';
  if (/mindful|meditat/.test(s)) return 'Mindfulness';
  if (/sleep|insomnia/.test(s)) return 'Sleep';
  if (/behav|habit/.test(s)) return 'Behavioral';
  return null;
}

export const ActionsView: React.FC<ActionsViewProps> = ({
  client,
  onAddAction,
  onUpdateActionStatus,
  onUpdateAction,
  onDeleteAction,
}) => {
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [rationale, setRationale] = useState('');
  const [reviewNext, setReviewNext] = useState(false);
  const [recentlyAssigned, setRecentlyAssigned] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editFreq, setEditFreq] = useState('');

  // Level 1 — AI-tailored suggestions.
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loadingSug, setLoadingSug] = useState(false);
  const [sugError, setSugError] = useState('');

  // The therapist's ways of working — used to fit both the AI suggestions and
  // which template groups we surface first.
  const [specializations, setSpecializations] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    therapistApi.profile()
      .then((p: any) => {
        const raw = p?.specializations ?? p?.therapist?.specializations ?? p?.profile?.specializations ?? [];
        if (alive && Array.isArray(raw)) setSpecializations(raw.filter((x: any) => typeof x === 'string'));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Template groups relevant to this therapist (Common first), else show all.
  const groupKeys = useMemo(() => {
    const matched = Array.from(new Set(specializations.map(specToKey).filter(Boolean))) as string[];
    const ordered = matched.length ? ['Common', ...matched] : Object.keys(TEMPLATES);
    return ordered.filter((k) => TEMPLATES[k]);
  }, [specializations]);
  const [activeGroup, setActiveGroup] = useState('Common');
  useEffect(() => { if (!groupKeys.includes(activeGroup)) setActiveGroup(groupKeys[0] || 'Common'); }, [groupKeys, activeGroup]);

  const startEdit = (a: ActionItem) => { setEditingId(a.id); setEditTitle(a.title); setEditFreq(a.frequency || ''); };
  const saveEdit = (id: string) => {
    if (editTitle.trim() && onUpdateAction) onUpdateAction(id, { title: editTitle.trim(), frequency: editFreq.trim() || undefined });
    setEditingId(null);
  };

  // Suggestions already assigned are hidden from the "from recent sessions" chips.
  const assignedTitles = new Set((client.actions || []).map((a) => (a.title || '').trim().toLowerCase()));
  const sessionSuggestions: string[] = Array.from(new Set<string>(
    (client.sessions || []).flatMap((s) => String(s.homework || '').split(/;\s*/)).map((t) => t.trim()).filter((t) => t.length > 0)
  )).filter((t) => !assignedTitles.has(t.toLowerCase())).slice(0, 6);

  const assign = (t: string, freq: string, rat = '', rev = false) => {
    if (!t.trim() || !onAddAction) return;
    onAddAction({
      title: t.trim(),
      assignedDate: 'Today',
      attempts: 0,
      lastAttemptedDate: 'Pending',
      clientResponse: 'Pending initial attempt.',
      status: 'in_progress',
      frequency: freq.trim() || 'Daily',
      rationale: rat.trim() || undefined,
      reviewNext: rev || undefined,
    });
    setRecentlyAssigned(true);
    setTimeout(() => setRecentlyAssigned(false), 3000);
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    assign(title, frequency, rationale, reviewNext);
    setTitle('');
    setFrequency('Daily');
    setRationale('');
    setReviewNext(false);
  };

  const fetchSuggestions = async () => {
    setLoadingSug(true); setSugError(''); setSuggestions(null);
    try {
      const r = await therapistApi.suggestActions(client.id, specializations);
      setSuggestions(r.suggestions || []);
    } catch (e: any) {
      setSugError(e?.data?.error || 'Could not generate suggestions right now.');
    } finally {
      setLoadingSug(false);
    }
  };

  const firstName = client.name.split(' ')[0];

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">

      {/* Assign Action Card */}
      <div className="p-6 sm:p-7 bg-white rounded-2xl border border-[#ECEFF3] space-y-5">
        <div className="flex items-center justify-between border-b border-[#F2F5F8] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">Assign Action</h2>
            <p className="text-[13px] sm:text-sm text-[#6B7686] mt-1">
              A practical exercise, routine, or homework for {firstName}
            </p>
          </div>
          {recentlyAssigned && (
            <span className="u-chip u-chip-accent animate-in fade-in duration-200">
              <Check className="w-4 h-4" />
              <span>Action assigned!</span>
            </span>
          )}
        </div>

        {/* Clinical context — assign around what actually surfaced, not in a vacuum.
            Tap a line to seed the action so it connects to the real work. */}
        {(() => {
          const focus = client.briefing?.whatChanged?.text?.trim();
          const pattern = client.briefing?.observedPattern?.text?.trim();
          const explore = (client.briefing?.worthExploring || []).find((x) => x && x.trim());
          if (!focus && !pattern && !explore) return null;
          const Row = ({ label, value }: { label: string; value: string }) => (
            <button type="button" onClick={() => setTitle(value)} title="Use as a starting point"
              className="w-full text-left flex gap-2 text-[13px] leading-snug hover:bg-white rounded-md px-2 py-1 -mx-2 transition-colors cursor-pointer">
              <span className="text-[#6B7686] shrink-0">{label}</span>
              <span className="text-[#10151F]">{value}</span>
            </button>
          );
          return (
            <div className="rounded-xl bg-[#F1FAF9] border border-[#D6EDEA] px-4 py-3 space-y-0.5">
              <div className="u-eyebrow flex items-center gap-1.5 text-[#0F766E] mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Assign around what’s actually coming up
              </div>
              {focus && <Row label="Current focus:" value={focus} />}
              {pattern && <Row label="Recurring pattern:" value={pattern} />}
              {explore && <Row label="Worth exploring:" value={explore} />}
            </div>
          );
        })()}

        {/* Level 1 — AI-tailored suggestions for THIS client */}
        <div className="rounded-xl border border-[#ECEFF3] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 u-eyebrow">
              <Wand2 className="w-3.5 h-3.5 text-[#0D9488]" />
              Tailored to {firstName}
            </div>
            <button type="button" onClick={fetchSuggestions} disabled={loadingSug}
              className="u-btn-ghost text-[13px] disabled:opacity-50">
              {loadingSug ? <><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</> : <><Sparkles className="w-4 h-4" /> Suggest actions</>}
            </button>
          </div>
          {sugError && <p className="text-[12px] text-[#B0332F]">{sugError}</p>}
          {suggestions && suggestions.length === 0 && !loadingSug && (
            <p className="text-[13px] text-[#6B7686]">Not enough between-session activity yet to tailor suggestions — record a session or wait for a check-in.</p>
          )}
          {suggestions && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="rounded-lg bg-[#FCFDFE] border border-[#ECEFF3] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#10151F]">{s.title}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {s.cadence && <span className="u-chip text-xs">{s.cadence}</span>}
                      </div>
                      {s.rationale && <p className="text-[12.5px] text-[#6B7686] italic mt-1.5 leading-snug">{s.rationale}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button type="button" onClick={() => assign(s.title, s.cadence, s.rationale)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#0D9488] text-white text-[12px] font-medium px-3 py-1.5 hover:bg-[#0C837A] transition-colors cursor-pointer">Assign</button>
                      <button type="button" onClick={() => { setTitle(s.title); setFrequency(s.cadence || 'Daily'); setRationale(s.rationale || ''); }}
                        className="text-[12px] text-[#6B7686] hover:text-[#0F766E] cursor-pointer">Edit first</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Form */}
        <form onSubmit={handleCreateAction} className="space-y-4">
          <div>
            <label className="block u-eyebrow mb-2">Action / Homework Description</label>
            <input type="text" required
              placeholder="e.g. Practice writing down one reframed thought at the end of the workday"
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#FCFDFE] border border-[#ECEFF3] rounded-lg text-sm sm:text-base font-sans text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors" />
          </div>

          <div>
            <label className="block u-eyebrow mb-2">Why this helps — {firstName} sees this (optional)</label>
            <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} rows={2}
              placeholder="e.g. Catching the thought early makes it easier to pause before it snowballs."
              className="w-full px-4 py-2.5 bg-[#FCFDFE] border border-[#ECEFF3] rounded-lg text-xs sm:text-sm font-sans text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors resize-y" />
          </div>

          <label className="flex items-center gap-2 text-[13px] text-[#3A4453] cursor-pointer select-none">
            <input type="checkbox" checked={reviewNext} onChange={(e) => setReviewNext(e.target.checked)} className="accent-[#0D9488]" />
            Review this with {firstName} at your next session
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block u-eyebrow mb-2">Frequency / Cadence</label>
              <input type="text" placeholder="e.g. Daily, 3x per week, At bedtime, When stressed"
                value={frequency} onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FCFDFE] border border-[#ECEFF3] rounded-lg text-xs sm:text-sm font-sans text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="u-btn-primary w-full justify-center">
                <Plus className="w-4 h-4" /><span>Assign Action</span>
              </button>
            </div>
          </div>

          {/* Suggestions — from this client's recorded sessions only */}
          {sessionSuggestions.length > 0 && (
            <div className="pt-2">
              <span className="block u-eyebrow mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" /> Suggested from recent sessions
              </span>
              <div className="flex flex-wrap gap-2">
                {sessionSuggestions.map((text, idx) => (
                  <button key={idx} type="button" onClick={() => setTitle(text)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#F1FAF9] border border-[#D6EDEA] text-[#0F766E] hover:border-[#0D9488] transition-colors text-left font-sans cursor-pointer">
                    + {text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Level 3 — domain-aware template library */}
        <div className="pt-4 border-t border-[#F2F5F8] space-y-3">
          <span className="block u-eyebrow">Templates by approach</span>
          <div className="flex flex-wrap gap-1.5">
            {groupKeys.map((k) => (
              <button key={k} type="button" onClick={() => setActiveGroup(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeGroup === k ? 'bg-[#0D9488] text-white' : 'bg-[#F4F6F9] text-[#6B7686] hover:text-[#10151F]'
                }`}>
                {k}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {(TEMPLATES[activeGroup] || []).map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-[#FCFDFE] border border-[#ECEFF3] px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13.5px] text-[#10151F] leading-snug">{t.title}</p>
                  <span className="text-[11px] text-[#9AA4B2]">{t.cadence}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => { setTitle(t.title); setFrequency(t.cadence); }}
                    className="text-[12px] text-[#6B7686] hover:text-[#0F766E] cursor-pointer">Edit</button>
                  <button type="button" onClick={() => assign(t.title, t.cadence)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#0D9488] text-white text-[12px] font-medium px-3 py-1.5 hover:bg-[#0C837A] transition-colors cursor-pointer">Assign</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Currently Assigned Actions */}
      <div className="p-6 sm:p-7 bg-white rounded-2xl border border-[#ECEFF3] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2F5F8] pb-3">
          <h3 className="text-base sm:text-lg font-serif font-semibold text-[#10151F]">
            Assigned Actions (<span className="font-mono tabular-nums">{client.actions.length}</span>)
          </h3>
          <span className="text-xs text-[#9AA4B2]">Active client homework</span>
        </div>

        {client.actions.length === 0 ? (
          <div className="p-8 text-center bg-[#FCFDFE] border border-[#F2F5F8] rounded-xl">
            <p className="text-[13px] sm:text-sm text-[#6B7686]">
              No actions assigned yet. Use the form above to assign an action to {firstName}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {client.actions.map((action) => {
              const isCompleted = action.status === 'completed';
              return (
                <div key={action.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted ? 'bg-[#FCFDFE] border-[#ECEFF3] opacity-75' : 'bg-white border-[#ECEFF3] u-card-hover'
                  }`}>
                  {editingId === action.id ? (
                    <div className="flex-1 space-y-2">
                      <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#0D9488] rounded-lg text-sm text-[#10151F] focus:outline-none" />
                      <input value={editFreq} onChange={(e) => setEditFreq(e.target.value)} placeholder="Frequency (e.g. Daily)"
                        className="w-full px-3 py-1.5 bg-white border border-[#ECEFF3] rounded-lg text-xs text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488]" />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5 flex-wrap">
                        <span className={`text-sm sm:text-base font-medium ${isCompleted ? 'line-through text-[#9AA4B2]' : 'text-[#10151F]'}`}>
                          {action.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6B7686] flex-wrap">
                        {action.frequency && <span className="u-chip text-xs">{action.frequency}</span>}
                        {action.reviewNext && <span className="u-chip text-xs">Review next session</span>}
                        <span>Assigned: <span className="font-mono">{action.assignedDate}</span></span>
                      </div>
                      {action.rationale && <p className="text-[12.5px] text-[#6B7686] italic leading-snug">Why: {action.rationale}</p>}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    {editingId === action.id ? (
                      <>
                        <button onClick={() => saveEdit(action.id)} title="Save"
                          className="p-1.5 rounded-lg text-[#0F766E] hover:bg-[#F1FAF9] transition-colors cursor-pointer"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} title="Cancel"
                          className="p-1.5 rounded-lg text-[#9AA4B2] hover:text-[#10151F] transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onUpdateActionStatus && onUpdateActionStatus(action.id, isCompleted ? 'in_progress' : 'completed')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isCompleted ? 'bg-white border-[#ECEFF3] text-[#15803D]' : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:text-[#10151F] hover:border-[#DCE2EA]'
                          }`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-[#16A34A]' : ''}`} />
                          <span>{isCompleted ? 'Completed' : 'Mark done'}</span>
                        </button>
                        {onUpdateAction && (
                          <button onClick={() => startEdit(action)} title="Edit action"
                            className="p-1.5 rounded-lg text-[#9AA4B2] hover:text-[#0F766E] hover:bg-[#F1FAF9] transition-colors cursor-pointer">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteAction && (
                          <button onClick={() => onDeleteAction(action.id)}
                            className="p-1.5 rounded-lg text-[#9AA4B2] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer" title="Remove action">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
