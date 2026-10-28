import React, { useEffect, useState } from 'react';
import { Lock, MessageCircle, Send, ChevronDown, ChevronRight } from 'lucide-react';
import { therapistApi } from '../../api';
import { Client } from '../../types';

// Full Emora chats. OFF by default: the client turns sharing on from WhatsApp (SHARE),
// and can turn it off anytime (STOP SHARING). Without it, the briefing's summaries and
// quotes are what the therapist works from.

interface Chat {
  id: string;
  at: string;
  summary: string | null;
  messages: { from: 'client' | 'emora'; text: string }[];
}

const REQUEST_REASON: Record<string, string> = {
  not_on_whatsapp: 'They are not on WhatsApp yet, so we can’t ask there.',
  outside_window: 'WhatsApp only lets us ask within 24 hours of their last message. Try after they next write in, or mention it in session: they can send SHARE anytime.',
  asked_recently: 'You asked in the last week. They can still send SHARE anytime.',
  opted_out: 'They have paused WhatsApp messages.',
};

const when = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const ChatsView: React.FC<{ client: Client }> = ({ client }) => {
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const [onWhatsApp, setOnWhatsApp] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [askResult, setAskResult] = useState<string | null>(null);
  const first = (client.name || '').split(' ')[0] || 'Your client';

  useEffect(() => {
    let alive = true;
    setLoading(true);
    therapistApi.chats(client.id)
      .then((r: any) => {
        if (!alive) return;
        setShared(!!r.shared);
        setOnWhatsApp(!!r.onWhatsApp);
        setChats(r.chats || []);
        if (r.chats?.[0]) setOpen(r.chats[0].id);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [client.id]);

  const ask = async () => {
    setAsking(true);
    try {
      const r: any = await therapistApi.requestChats(client.id);
      setAskResult(r.sent ? `Sent. ${first} will get a WhatsApp message asking if they’d like to share. Nothing changes unless they tap Share.` : REQUEST_REASON[r.reason] || 'Could not send right now.');
    } catch {
      setAskResult('Could not send right now.');
    } finally {
      setAsking(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-[13px] text-[#6B7686]">Loading…</div>;

  if (!shared) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <div className="bg-white border border-[#ECEFF3] rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#10151F]">
            <Lock className="w-4 h-4 text-[#0D9488]" />
            <h3 className="text-[15px] font-medium">{first}&rsquo;s full chats are private</h3>
          </div>
          <p className="text-[13px] leading-relaxed text-[#4A5565]">
            You already see what matters in the Briefing: a summary of each chat, the key points, and {first}&rsquo;s own words
            behind them. Risk is flagged to you straight away either way.
          </p>
          <p className="text-[13px] leading-relaxed text-[#4A5565]">
            If you need the full conversations, {first} can choose to share them. They send <b>SHARE</b> on WhatsApp,
            and can turn it off anytime with <b>STOP SHARING</b>.
          </p>
          {onWhatsApp && (
            <div className="flex flex-col gap-2">
              <button
                onClick={ask}
                disabled={asking || !!askResult}
                className="self-start inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium bg-[#0D9488] text-white disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {asking ? 'Sending…' : `Ask ${first} on WhatsApp`}
              </button>
              {askResult && <p className="text-[12px] text-[#6B7686]">{askResult}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 flex flex-col gap-3">
      <p className="text-[12px] text-[#6B7686]">
        {first} chose to share their full chats with you. They can turn this off anytime. Last 90 days.
      </p>
      {!chats.length && (
        <div className="py-12 text-center text-[13px] text-[#6B7686]">
          No finished chats yet. A chat appears here about 30 minutes after {first} stops writing.
        </div>
      )}
      {chats.map((c) => {
        const isOpen = open === c.id;
        return (
          <div key={c.id} className="bg-white border border-[#ECEFF3] rounded-xl">
            <button
              onClick={() => setOpen(isOpen ? null : c.id)}
              className="w-full flex items-start gap-3 p-4 text-left cursor-pointer"
            >
              {isOpen ? <ChevronDown className="w-4 h-4 mt-0.5 text-[#9AA4B2]" /> : <ChevronRight className="w-4 h-4 mt-0.5 text-[#9AA4B2]" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[12px] text-[#6B7686]">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{when(c.at)}</span>
                  <span>· {c.messages.filter((m) => m.from === 'client').length} messages from {first}</span>
                </div>
                {c.summary && <p className="mt-1 text-[13px] text-[#10151F] leading-relaxed">{c.summary}</p>}
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 flex flex-col gap-2 border-t border-[#ECEFF3] pt-3">
                {c.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'client' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                        m.from === 'client' ? 'bg-[#F0FDFA] text-[#10151F]' : 'bg-[#F5F7FA] text-[#4A5565]'
                      }`}
                    >
                      <span className="block text-[10px] uppercase tracking-wide mb-0.5 text-[#9AA4B2]">
                        {m.from === 'client' ? first : 'Emora'}
                      </span>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
