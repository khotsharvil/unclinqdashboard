import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from 'lucide-react';
import { Client, EvidenceGroup } from '../../types';
import { AssessmentsCard } from './AssessmentsCard';
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
  onNavigateToTab: (tab: 'briefing' | 'journey' | 'sessions' | 'actions' | 'notes', sessionId?: string) => void;
}

/* Numbered clinical point. Left rail = fixed label spine; right = content. */
const Point: React.FC<{
  index: string;
  label: string;
  link?: { text: string; onClick: () => void };
  children: React.ReactNode;
}> = ({ index, label, link, children }) => (
  <section className="px-6 sm:px-8 py-7 grid sm:grid-cols-[170px_1fr] gap-3 sm:gap-8">
    <div className="sm:pt-0.5">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-[#0D9488] tabular-nums">{index}</span>
        <h3 className="text-[13px] font-semibold text-[#3A4453] tracking-tight leading-tight">{label}</h3>
      </div>
      {link && (
        <button
          onClick={link.onClick}
          className="mt-2 text-[12px] text-[#9AA4B2] hover:text-[#0F766E] flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>{link.text}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

export const BriefingView: React.FC<BriefingViewProps> = ({
  client,
  onOpenEvidence,
  onNavigateToTab,
}) => {
  const { briefing, evidenceStore } = client;
  const [rapidPrepMode, setRapidPrepMode] = useState(false);

  const handleOpenEvidenceGroup = (groupId: string, fallbackTitle: string) => {
    const group = evidenceStore[groupId] || { id: groupId, title: fallbackTitle, items: [] };
    onOpenEvidence(group);
  };

  return (
    <div className="space-y-5 w-full">

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-[#9AA4B2]">
          Synthesis since {client.lastSession?.display || 'intake'}
        </p>
        <button
          id="toggle-rapid-prep-btn"
          onClick={() => setRapidPrepMode(!rapidPrepMode)}
          className={`text-[13px] font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer ${
            rapidPrepMode
              ? 'bg-[#10151F] text-white'
              : 'text-[#6B7686] hover:text-[#10151F] hover:bg-[#F4F6F9]'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${rapidPrepMode ? 'text-white' : 'text-[#0D9488]'}`} />
          <span>{rapidPrepMode ? 'Full briefing' : '30-second view'}</span>
        </button>
      </div>

      {rapidPrepMode ? (
        /* ================= RAPID: three points, same spine ================= */
        <div className="bg-white rounded-2xl border border-[#ECEFF3] divide-y divide-[#F2F5F8] animate-in fade-in duration-150">
          <Point index="01" label="What changed">
            <p className="text-[19px] font-serif text-[#10151F] leading-[1.55]">{briefing.whatChanged.text}</p>
          </Point>
          <Point index="02" label="Wants to discuss">
            <blockquote className="text-[19px] font-serif italic text-[#10151F] leading-[1.5]">
              “{briefing.clientWantsToDiscuss.quote}”
            </blockquote>
          </Point>
          <Point index="03" label="Worth exploring">
            <ul className="space-y-2.5">
              {briefing.worthExploring.slice(0, 2).map((q, i) => (
                <li key={i} className="text-[17px] font-serif text-[#10151F] leading-[1.5]">{q}</li>
              ))}
            </ul>
          </Point>
        </div>
      ) : (

        /* ================= FULL: 5 numbered points + footer ================= */
        <div className="bg-white rounded-2xl border border-[#ECEFF3] divide-y divide-[#F2F5F8] animate-in fade-in duration-150">

          {/* 01 — What changed */}
          <Point
            index="01"
            label="What changed"
            link={{ text: 'Evidence', onClick: () => handleOpenEvidenceGroup(briefing.whatChanged.evidenceGroupId, 'What changed evidence') }}
          >
            <p className="text-[19px] sm:text-[20px] text-[#10151F] leading-[1.55] font-serif tracking-tight">
              {briefing.whatChanged.text}
            </p>
            <button
              id="evidence-pill-whatchanged"
              onClick={() => handleOpenEvidenceGroup(briefing.whatChanged.evidenceGroupId, 'Evidence summary')}
              className="mt-3 text-[13px] text-[#9AA4B2] hover:text-[#0F766E] transition-colors cursor-pointer"
            >
              {(() => {
                const wc = briefing.whatChanged as any;
                const total = wc.momentCount ?? 0;
                const parts: string[] = [];
                if (wc.mentionsCount) parts.push(`${wc.mentionsCount} from Emora`);
                if (wc.journalCount) parts.push(`${wc.journalCount} note${wc.journalCount === 1 ? '' : 's'}`);
                if (wc.conversationsCount) parts.push(`${wc.conversationsCount} check-in${wc.conversationsCount === 1 ? '' : 's'}`);
                return (
                  <>
                    <span className="font-mono tabular-nums text-[#6B7686]">{total}</span> moment{total === 1 ? '' : 's'} captured
                    {parts.length > 0 && <span className="text-[#9AA4B2]"> · {parts.join(' · ')}</span>}
                  </>
                );
              })()}
            </button>
          </Point>

          {/* 02 — Wants to discuss */}
          <Point
            index="02"
            label="Wants to discuss"
            link={{ text: 'Excerpt', onClick: () => handleOpenEvidenceGroup(briefing.clientWantsToDiscuss.conversationEvidenceId, 'Client conversation excerpt') }}
          >
            <blockquote className="text-[21px] sm:text-[23px] font-serif text-[#10151F] leading-[1.45] italic tracking-tight">
              “{briefing.clientWantsToDiscuss.quote}”
            </blockquote>
            <p className="text-[13px] text-[#9AA4B2] mt-3 leading-relaxed">{briefing.clientWantsToDiscuss.context}</p>
          </Point>

          {/* 03 — What they tried */}
          <Point
            index="03"
            label="What they tried"
            link={{ text: `All actions · ${client.actions.length}`, onClick: () => onNavigateToTab('actions') }}
          >
            <div className="space-y-5">
              {briefing.whatTheyTried.map((item) => {
                const pct = item.attempted ? Math.round((item.completed / item.attempted) * 100) : 0;
                return (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="shrink-0 w-12 pt-0.5">
                      <div className="font-mono text-[13px] font-semibold text-[#10151F] tabular-nums">
                        {item.completed}/{item.attempted}
                      </div>
                      <div className="mt-1.5 h-1 rounded-full bg-[#F2F5F8] overflow-hidden">
                        <div className="h-full rounded-full bg-[#0D9488]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[16px] font-serif font-semibold text-[#10151F] tracking-tight">{item.name}</h4>
                      <p className="font-serif italic text-[15px] text-[#6B7686] leading-[1.55] mt-0.5">
                        “{item.clientResponse}”
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Point>

          {/* 04 — Observed pattern */}
          <Point
            index="04"
            label="Observed pattern"
            link={{ text: 'Moments', onClick: () => handleOpenEvidenceGroup(briefing.observedPattern.evidenceGroupId, 'Observed pattern moments') }}
          >
            <p className="text-[19px] sm:text-[20px] text-[#10151F] font-serif leading-[1.55] tracking-tight">
              {briefing.observedPattern.text}
            </p>
            <p className="text-[13px] text-[#9AA4B2] mt-2">
              Observed <span className="font-mono tabular-nums text-[#6B7686]">{briefing.observedPattern.observedCount}</span> times
              <span className="mx-1.5 text-[#DDE2E9]">·</span>
              last seen {briefing.observedPattern.lastSeen}
            </p>

            <div className="mt-4 rounded-xl bg-[#FAFAFE] border border-[#EEEEF8] px-4 py-3.5">
              <p className="text-[11px] font-semibold tracking-wide uppercase text-[#8B84C9] mb-1.5">
                AI hypothesis · not a clinical fact
              </p>
              <p className="text-[15px] font-serif text-[#4B5566] leading-[1.6]">
                {briefing.observedPattern.clinicalNoteSeparateFromObservation}
              </p>
            </div>
          </Point>

          {/* 05 — Worth exploring */}
          <Point index="05" label="Worth exploring">
            <ul className="space-y-3.5">
              {briefing.worthExploring.map((prompt, index) => (
                <li key={index} className="flex items-baseline gap-3">
                  <span className="font-mono text-[12px] text-[#0D9488] tabular-nums shrink-0 w-4">{index + 1}</span>
                  <span className="text-[#10151F] font-serif text-[17px] sm:text-[18px] leading-[1.5] tracking-tight">{prompt}</span>
                </li>
              ))}
            </ul>
          </Point>

          {/* Footer — last session (context, not a numbered point) */}
          <section className="px-6 sm:px-8 py-6 grid sm:grid-cols-[170px_1fr] gap-3 sm:gap-8 bg-[#FCFDFE]">
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-[13px] font-semibold text-[#9AA4B2] tracking-tight">Last session</h3>
              </div>
              <p className="text-[12px] text-[#C3CBD6] mt-1 font-mono">{briefing.context.previousSessionDate}</p>
              <button
                onClick={() => onNavigateToTab('sessions', briefing.context.previousSessionId)}
                className="mt-2 text-[12px] text-[#9AA4B2] hover:text-[#0F766E] flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>Open</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <ul className="min-w-0 space-y-1.5 text-[15px] font-serif text-[#6B7686] leading-[1.55]">
              {briefing.context.keyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </section>

        </div>
      )}

      {rapidPrepMode && (
        <button
          onClick={() => setRapidPrepMode(false)}
          className="text-[13px] text-[#9AA4B2] hover:text-[#0F766E] font-medium cursor-pointer transition-colors flex items-center gap-1"
        >
          <span>Read full briefing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Pilot metric B — usefulness tap. Only for real (backend) briefings. */}
      {client.briefingId && (
        <BriefingUsefulness
          key={client.briefingId}
          clientId={client.id}
          briefingId={client.briefingId}
          initial={client.briefingFeedback}
        />
      )}

      {/* Assessments — reference context (also attunes Emora + anchors the briefing) */}
      <div className="rounded-2xl border border-[#ECEFF3] bg-white overflow-hidden">
        <AssessmentsCard client={client} />
      </div>

    </div>
  );
};
