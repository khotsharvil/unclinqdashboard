import React, { useEffect, useState } from 'react';
import { ArrowLeft, Target, MessageSquareText, FileText, Zap, Mail, Copy, Check } from 'lucide-react';
import { therapistApi, inviteLink } from '../api';

/*
 * Real, backend-backed client detail. Reads /api/therapist/clients/:id/overview
 * (goals, themes, latest session, exercises). Used for clients that actually
 * exist in the backend, in place of the mock ClientWorkspace. Sparse until the
 * client uses Unclinq — which is honest.
 */
export const RealClientDetail: React.FC<{ client: any; onBack: () => void }> = ({ client, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
          <Section icon={<Target className="w-4 h-4 text-[#0D9488]" />} title="Current focus">
            {goals.length || themes.length ? (
              <ul className="space-y-1.5">
                {goals.map((g: any, i: number) => <li key={'g' + i} className="text-sm text-[#10151F]">🎯 {g.content}</li>)}
                {themes.map((t: any, i: number) => <li key={'t' + i} className="text-sm text-[#3A4453]">• {t.content}</li>)}
              </ul>
            ) : <Empty>No focus set yet — it appears after the first approved session.</Empty>}
          </Section>

          <Section icon={<FileText className="w-4 h-4 text-[#0D9488]" />} title="Latest session">
            {session ? (
              <div>
                <p className="text-xs text-[#9AA4B2] mb-1">{new Date(session.occurred_at).toLocaleString(undefined, { dateStyle: 'medium' })} · {session.summary_status === 'draft' ? 'Draft — review & approve' : 'Approved'}</p>
                <p className="text-sm text-[#3A4453] leading-relaxed">{typeof session.session_summary === 'string' ? session.session_summary : '—'}</p>
              </div>
            ) : <Empty>No sessions recorded yet.</Empty>}
          </Section>

          <Section icon={<Zap className="w-4 h-4 text-[#0D9488]" />} title="Between-session actions">
            {exercises.length ? (
              <ul className="space-y-2">
                {exercises.map((x: any) => (
                  <li key={x.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#10151F]">{x.description}</p>
                      {x.feedback && <p className="text-xs text-[#6B7686] italic mt-0.5">“{x.feedback}”</p>}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F7F9FB] border border-[#ECEFF3] text-[#6B7686] shrink-0 capitalize">{x.status}</span>
                  </li>
                ))}
              </ul>
            ) : <Empty>No actions assigned yet.</Empty>}
          </Section>
        </div>
      )}
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
