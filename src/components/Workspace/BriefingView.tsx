import React, { useState } from 'react';
import {
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Client, EvidenceGroup, BriefingHomework } from '../../types';
import { AssessmentsCard } from './AssessmentsCard';
import { MoodSleepChart } from './MoodSleepChart';
import { therapistApi } from '../../api';

/* Pilot metric B — one optional tap: did this briefing help you prepare?
   Free-text is only asked after 👎. A failed tap is swallowed so it can never
   disrupt session prep. Renders only for real (backend) briefings. */
const BriefingUsefulness: React.FC<{
  clientId: string;
  briefingId: string;
  initial?: { useful: boolean; note?: string | null } | null;
}> = ({ clientId, briefingId, initial }) => {
  const [useful, setUseful] = useState<boolean | null>(initial ? initial.useful : null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(initial?.note || '');
  const [noteSaved, setNoteSaved] = useState(!!initial?.note);

  const send = async (u: boolean, n?: string) => {
    try {
      await therapistApi.briefingFeedback(clientId, { briefing_id: briefingId, useful: u, note: n });
      if (typeof n === 'string' && n.trim()) setNoteSaved(true);
    } catch { /* non-blocking */ }
  };

  const pick = (u: boolean) => {
    setUseful(u);
    setShowNote(!u); // reveal the optional "what was missing?" only after 👎
    send(u);
  };

  const btn = (active: boolean, kind: 'up' | 'down') =>
    `flex items-center justify-center w-11 h-11 rounded-xl border-2 transition-all cursor-pointer ${
      active
        ? (kind === 'up'
            ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-sm scale-105'
            : 'bg-[#B45309] text-white border-[#B45309] shadow-sm scale-105')
        : 'text-[#3A4453] bg-white border-[#DCE6E6] hover:border-[#0D9488] hover:bg-[#F1FAF9] hover:scale-105'
    }`;

  return (
    <div className="rounded-2xl border-2 border-[#CDEBE4] bg-gradient-to-br from-[#F1FAF9] to-[#FAFBFC] px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <p className="text-[15px] font-semibold text-[#10151F]">Was this briefing useful to prepare?</p>
          <p className="text-[12px] text-[#6B7686] mt-0.5">Your quick answer helps Unclinq make every briefing sharper.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button aria-label="Useful" title="Useful" className={btn(useful === true, 'up')} onClick={() => pick(true)}>
            <ThumbsUp className="w-5 h-5" />
          </button>
          <button aria-label="Not useful" title="Not useful" className={btn(useful === false, 'down')} onClick={() => pick(false)}>
            <ThumbsDown className="w-5 h-5" />
          </button>
        </div>
      </div>
      {useful !== null && !showNote && (
        <p className="text-[13px] font-medium text-[#0F766E] mt-3 flex items-center gap-1.5"><span>✓</span> Thanks — noted.</p>
      )}

      {showNote && (
        <div className="mt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was missing? (optional)"
            rows={2}
            className="w-full text-[14px] rounded-lg border border-[#E3E8EE] px-3 py-2 focus:outline-none focus:border-[#0D9488] resize-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => { send(false, note); setShowNote(false); }}
              className="text-[13px] font-medium text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
            >
              Send
            </button>
            <button
              onClick={() => setShowNote(false)}
              className="text-[13px] text-[#9AA4B2] hover:text-[#6B7686] cursor-pointer"
            >
              Skip
            </button>
          </div>
        </div>
      )}
      {noteSaved && !showNote && (
        <p className="mt-2 text-[12px] text-[#9AA4B2]">Feedback saved — thank you.</p>
      )}
    </div>
  );
};

interface BriefingViewProps {
  client: Client;
  onOpenEvidence: (evidenceGroup: EvidenceGroup) => void;
  onNavigateToTab: (tab: 'briefing' | 'sessions' | 'actions' | 'notes', sessionId?: string) => void;
}

/* One briefing section: label on the left rail, content on the right. */
const Section: React.FC<{
  label: string;
  link?: { text: string; onClick: () => void };
  children: React.ReactNode;
}> = ({ label, link, children }) => (
  <section className="px-6 sm:px-8 py-6 grid sm:grid-cols-[170px_1fr] gap-2 sm:gap-8">
    <div className="sm:pt-0.5">
      <h3 className="text-[13px] font-semibold text-[#3A4453] tracking-tight leading-tight">{label}</h3>
      {link && (
        <button
          onClick={link.onClick}
          className="mt-1.5 text-[12px] text-[#9AA4B2] hover:text-[#0F766E] flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>{link.text}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

const ago = (iso?: string | null) => {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};
const shortDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

const STATUS: Record<BriefingHomework['status'], { label: string; cls: string }> = {
  done:        { label: 'Done',        cls: 'text-[#0F766E] bg-[#F1FAF9] border-[#CDEBE7]' },
  partly:      { label: 'Partly',      cls: 'text-[#3A4453] bg-[#F4F6F8] border-[#E2E7EE]' },
  not_yet:     { label: 'Not yet',     cls: 'text-[#B45309] bg-[#FEF3E2] border-[#F5D9A8]' },
  not_started: { label: 'Not started', cls: 'text-[#6B7686] bg-white border-[#E2E7EE]' },
};

const NewClientState: React.FC<{
  client: Client;
  onNavigateToTab: BriefingViewProps['onNavigateToTab'];
}> = ({ client, onNavigateToTab }) => {
  const first = client.name.split(/\s+/)[0] || 'They';
  const wa = client.whatsapp;
  const status = wa?.status === 'paused'
    ? `${first} paused WhatsApp messages (sent STOP). They can send START anytime to resume.`
    : wa
      ? `${first} is on WhatsApp${client.joinedAt ? ` · joined ${ago(client.joinedAt)}` : ''}${wa.lastMessageAt ? ` · last message ${ago(wa.lastMessageAt)}` : ''}.`
      : `${first} has joined${client.joinedAt ? ` ${ago(client.joinedAt)}` : ''}.`;
  const step = 'flex items-start gap-3 text-left w-full rounded-xl border border-[#ECEFF3] bg-white px-4 py-3 hover:border-[#0D9488] hover:bg-[#F8FCFB] transition-colors cursor-pointer';
  return (
    <div className="space-y-5 w-full">
      <div className="rounded-2xl border border-[#ECEFF3] bg-white px-6 sm:px-8 py-7 space-y-5">
        <div>
          <h3 className="text-[19px] font-serif font-semibold text-[#10151F]">No briefing yet</h3>
          <p className="text-[14px] text-[#3A4453] mt-1">{status}</p>
          <p className="text-[14px] text-[#6B7686] mt-1">
            Their first briefing appears here once there's something to go on: a recorded session, or a few days of chats, homework updates and sleep or mood taps on WhatsApp.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <button className={step} onClick={() => onNavigateToTab('actions')}>
            <span className="font-mono text-[11px] text-[#0D9488] mt-1">01</span>
            <span>
              <span className="block text-[14px] font-medium text-[#10151F]">Set homework for this week</span>
              <span className="block text-[12px] text-[#6B7686]">It reaches them on WhatsApp, with Done / Partly / Not yet buttons.</span>
            </span>
          </button>
          <button className={step} onClick={() => onNavigateToTab('sessions')}>
            <span className="font-mono text-[11px] text-[#0D9488] mt-1">02</span>
            <span>
              <span className="block text-[14px] font-medium text-[#10151F]">Record your next session</span>
              <span className="block text-[12px] text-[#6B7686]">The briefing builds from it automatically.</span>
            </span>
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-[#ECEFF3] bg-white overflow-hidden">
        <AssessmentsCard client={client} />
      </div>
    </div>
  );
};

// Demo clients carry the older briefing shape: map it to homework rows.
function homeworkOf(client: Client): BriefingHomework[] {
  const b = client.briefing;
  if (Array.isArray(b.homework)) return b.homework;
  return (b.whatTheyTried || []).map((t) => ({
    id: t.id,
    description: t.name,
    status: t.completed > 0 ? 'done' : t.attempted > 0 ? 'partly' : 'not_started',
    updates: t.attempted || 0,
    latest: t.clientResponse ? [{ at: '', words: t.clientResponse, summary: null }] : [],
  }));
}

const HomeworkRow: React.FC<{ item: BriefingHomework }> = ({ item }) => {
  const [all, setAll] = useState(false);
  const st = STATUS[item.status] || STATUS.not_started;
  const shown = all ? item.latest : item.latest.slice(0, 1);
  return (
    <li className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-[16px] font-serif font-semibold text-[#10151F] tracking-tight leading-snug">{item.description}</h4>
        <span className={`shrink-0 text-[11px] font-medium border rounded-full px-2 py-0.5 ${st.cls}`}>{st.label}</span>
      </div>
      {item.updates > 0 && (
        <p className="text-[12px] text-[#9AA4B2]">{item.updates} update{item.updates === 1 ? '' : 's'} on WhatsApp</p>
      )}
      {shown.map((u, i) => (
        <div key={i} className="pl-3 border-l-2 border-[#CDEBE7]">
          {u.words
            ? <p className="text-[15px] font-serif italic text-[#10151F] leading-[1.55]">“{u.words}”</p>
            : <p className="text-[14px] text-[#3A4453] leading-relaxed"><span className="text-[11px] uppercase tracking-wide text-[#9AA4B2] mr-1.5">Summary</span>{u.summary}</p>}
          {u.at && <p className="text-[12px] text-[#9AA4B2] mt-0.5">{shortDate(u.at)}</p>}
        </div>
      ))}
      {item.latest.length > 1 && (
        <button onClick={() => setAll((v) => !v)} className="text-[12px] text-[#6B7686] hover:text-[#0F766E] cursor-pointer">
          {all ? 'Show less' : `Show ${item.latest.length - 1} more`}
        </button>
      )}
    </li>
  );
};

export const BriefingView: React.FC<BriefingViewProps> = ({
  client,
  onOpenEvidence,
  onNavigateToTab,
}) => {
  const { briefing, evidenceStore } = client;
  const isReal = /^[0-9a-f-]{36}$/i.test(client.id);
  // Hooks stay above the early return below (rules of hooks).
  const [wellbeing, setWellbeing] = useState<'loading' | 'some' | 'none'>('loading');
  const [showAssess, setShowAssess] = useState((client.assessments || []).length > 0);

  const openEvidence = (groupId: string, fallbackTitle: string) => {
    const group = evidenceStore[groupId] || { id: groupId, title: fallbackTitle, items: [] };
    onOpenEvidence(group);
  };

  // Brand-new client: nothing to synthesise yet. Say where they are and what to do,
  // instead of rendering empty sections.
  if (client.briefingStatus === 'no_activity' && !client.briefingId && client.sessions.length === 0) {
    return <NewClientState client={client} onNavigateToTab={onNavigateToTab} />;
  }

  // Only real content: the AI summary of the period, or a specific line from the data.
  const thisWeek = (briefing.thisWeek || briefing.whatChanged.text || '').trim();
  const hasItems = (id: string) => (evidenceStore[id]?.items || []).length > 0;
  const wantsToTalk = (briefing.clientWantsToDiscuss.quote || '').trim();
  const whatHelped = (briefing.whatHelped || '').trim();
  const homework = homeworkOf(client);
  const pattern = (briefing.observedPattern.text || '').trim();
  const explore = briefing.worthExploring.filter(Boolean).slice(0, 2);
  const flags = ((briefing as any).wellbeing?.flags || []) as string[];
  const src = briefing.sources;
  const sinceLabel = client.lastSession?.display
    ? `since the last session · ${client.lastSession.display}`
    : briefing.since ? `since ${shortDate(briefing.since)}` : 'so far';
  const based = src ? [
    src.chats && `${src.chats} chat${src.chats === 1 ? '' : 's'}`,
    src.moments && `${src.moments} moment${src.moments === 1 ? '' : 's'}`,
    src.mood && `${src.mood} mood tap${src.mood === 1 ? '' : 's'}`,
    src.sleep && `${src.sleep} sleep tap${src.sleep === 1 ? '' : 's'}`,
  ].filter(Boolean).join(' · ') : '';

  return (
    <div className="space-y-5 w-full">
      <div className="bg-white rounded-2xl border border-[#ECEFF3] divide-y divide-[#F2F5F8]">

        {/* Every section below is hidden without real data; if all of them are, say so once. */}
        {!(thisWeek || wantsToTalk || whatHelped || homework.length || pattern || explore.length || client.sessions.length) && wellbeing === 'none' && (
          <p className="px-6 sm:px-8 py-6 text-[15px] text-[#6B7686]">Nothing new since the last session.</p>
        )}

        {/* This week: the meaning, across the whole period */}
        {thisWeek && (
          <Section label="This week" link={hasItems(briefing.whatChanged.evidenceGroupId) ? { text: 'Evidence', onClick: () => openEvidence(briefing.whatChanged.evidenceGroupId, 'What this is based on') } : undefined}>
            <p className="text-[12px] text-[#9AA4B2] mb-2">{sinceLabel}</p>
            <p className="text-[18px] sm:text-[19px] text-[#10151F] leading-[1.6] font-serif tracking-tight whitespace-pre-line">{thisWeek}</p>
          </Section>
        )}

        {/* Their own words about the next session (only when they answered) */}
        {(wantsToTalk || whatHelped) && (
          <Section label="They want to talk about">
            {wantsToTalk && (
              <blockquote className="text-[19px] sm:text-[21px] font-serif text-[#10151F] leading-[1.45] italic tracking-tight">“{wantsToTalk}”</blockquote>
            )}
            {briefing.clientWantsToDiscuss.context && (
              <p className="text-[13px] text-[#6B7686] mt-2">Why: “{briefing.clientWantsToDiscuss.context}”</p>
            )}
            {whatHelped && (
              <p className="text-[14px] text-[#3A4453] mt-3"><span className="font-medium">What helped:</span> <span className="font-serif italic">“{whatHelped}”</span></p>
            )}
          </Section>
        )}

        {/* Homework: how it went, in their words */}
        {homework.length > 0 && (
          <Section label="Homework" link={{ text: 'Homework tab', onClick: () => onNavigateToTab('actions') }}>
            <ul className="space-y-6">
              {homework.slice(0, 4).map((h) => <HomeworkRow key={h.id} item={h} />)}
            </ul>
          </Section>
        )}

        {/* Mood & sleep: the one-tap WhatsApp answers, day by day */}
        {isReal && wellbeing !== 'none' && (
          <div className={wellbeing === 'loading' ? 'hidden' : ''}>
          <Section label="Mood & sleep">
            <MoodSleepChart clientId={client.id} onData={(has) => setWellbeing(has ? 'some' : 'none')} />
            {flags.length > 0 && (
              <ul className="mt-3 space-y-1">
                {flags.map((f, i) => <li key={i} className="text-[13px] text-[#B45309]">{f}</li>)}
              </ul>
            )}
          </Section>
          </div>
        )}

        {/* A named recurring pattern, with the moments behind it */}
        {pattern && (
          <Section label="Came up more than once" link={hasItems(briefing.observedPattern.evidenceGroupId) ? { text: 'Moments', onClick: () => openEvidence(briefing.observedPattern.evidenceGroupId, 'The moments behind this') } : undefined}>
            <p className="text-[16px] font-serif text-[#10151F] leading-[1.55]">{pattern}</p>
            {briefing.observedPattern.observedCount > 1 && (
              <p className="text-[12px] text-[#9AA4B2] mt-1.5">
                {briefing.observedPattern.observedCount} times{briefing.observedPattern.lastSeen ? ` · last ${briefing.observedPattern.lastSeen}` : ''}
              </p>
            )}
          </Section>
        )}

        {/* Specific openings only; no filler */}
        {explore.length > 0 && (
          <Section label="Worth exploring">
            <ul className="space-y-2.5">
              {explore.map((q, i) => (
                <li key={i} className="text-[16px] font-serif text-[#10151F] leading-[1.5]">{q}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Last session: only when there is one */}
        {client.sessions.length > 0 && (
          <Section label="Last session" link={{ text: 'Open', onClick: () => onNavigateToTab('sessions', briefing.context.previousSessionId || undefined) }}>
            <p className="text-[13px] text-[#6B7686]">{briefing.context.previousSessionDate || client.lastSession?.display}</p>
            {briefing.context.keyPoints.length > 0 && (
              <ul className="mt-1.5 space-y-1 text-[15px] font-serif text-[#3A4453] leading-[1.55]">
                {briefing.context.keyPoints.map((point, idx) => <li key={idx}>{point}</li>)}
              </ul>
            )}
          </Section>
        )}

        {based && (
          <p className="px-6 sm:px-8 py-3 text-[12px] text-[#9AA4B2]">Based on {based}.</p>
        )}
      </div>

      {/* Pilot metric B — usefulness tap. Only for real (backend) briefings. */}
      {client.briefingId && (
        <BriefingUsefulness
          key={client.briefingId}
          clientId={client.id}
          briefingId={client.briefingId}
          initial={client.briefingFeedback}
        />
      )}

      {/* Assessments: shown when there are some; otherwise one small link to add one. */}
      {showAssess ? (
        <div className="rounded-2xl border border-[#ECEFF3] bg-white overflow-hidden">
          <AssessmentsCard client={client} />
        </div>
      ) : (
        <button onClick={() => setShowAssess(true)} className="text-[13px] text-[#6B7686] hover:text-[#0F766E] cursor-pointer">
          + Add an assessment (PHQ-9, GAD-7, or your own)
        </button>
      )}

    </div>
  );
};
