import React, { useEffect, useState } from 'react';
import { X, Check, Copy, MessageCircle, Send } from 'lucide-react';
import { invitationsApi, CLIENT_LANGUAGES, CLIENT_GENDERS } from '../api';
import { InviteRelationship, InvitePayload } from './InviteRelationship';

/**
 * Add a client on WhatsApp — the low-friction path.
 * Therapist: name + WhatsApp number + language (+ gender, optional) → Send.
 * Client: gets a WhatsApp message from Unclinq and taps Start (that's it).
 * Backup: a join link the therapist can send from their own WhatsApp.
 */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;          // refresh the caseload list
  onUseEmail?: () => void;      // fall back to the older email/code invite
}

// 10-digit Indian mobile → 91XXXXXXXXXX; anything else as typed (digits only).
const toWaDigits = (raw: string) => {
  const d = raw.replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
};

export const WhatsAppInviteModal: React.FC<Props> = ({ isOpen, onClose, onSent, onUseEmail }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('');
  const [gender, setGender] = useState('');
  const [rel, setRel] = useState<InvitePayload>({ relationship_type: 'new', valid: true });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ wa_status?: string; join_link?: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(''); setPhone(''); setLanguage(''); setGender('');
      setRel({ relationship_type: 'new', valid: true });
      setSending(false); setError(''); setResult(null); setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const digits = phone.replace(/\D/g, '');
  const canSend = name.trim().length > 1 && (digits.length === 10 || digits.length >= 11) && !!language && rel.valid && !sending;
  const firstName = name.trim().split(/\s+/)[0] || 'there';

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true); setError('');
    try {
      const res = await invitationsApi.create({
        client_name: name.trim(),
        client_phone: phone,
        client_language: language,
        client_gender: gender || undefined,
        relationship_type: rel.relationship_type,
        seed_context: rel.seed_context,
        expires_in_days: 14,
      });
      setResult({ wa_status: res.invitation?.wa_status, join_link: res.invitation?.join_link });
      onSent?.();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Could not send the invite. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const shareText = result?.join_link
    ? `Hi ${firstName}, I've set up Unclinq for support between our sessions. Tap this link and press send to start: ${result.join_link}`
    : '';
  const shareOnWhatsApp = () => {
    window.open(`https://wa.me/${toWaDigits(phone)}?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener');
  };
  const copyLink = () => {
    if (!result?.join_link) return;
    navigator.clipboard?.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const field = 'w-full rounded-xl border border-[#E2E7EE] bg-white px-3.5 py-2.5 text-[15px] text-[#10151F] placeholder-[#B6BFCB] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10';
  const label = 'block text-[13px] font-medium text-[#3A4453] mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-[#10151F]/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#ECEFF3] shadow-[0_20px_60px_rgba(16,21,31,0.18)] overflow-hidden my-8">
        <div className="p-6 border-b border-[#F2F5F8] flex items-start justify-between gap-4">
          <div>
            <span className="u-eyebrow">Add client</span>
            <h2 className="text-xl font-serif font-semibold text-[#10151F] mt-0.5">Invite on WhatsApp</h2>
            <p className="text-sm text-[#6B7686] mt-1">They'll get a message from Unclinq and tap <b>Start</b>. No app, no sign-up.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#9AA4B2] hover:text-[#10151F] hover:bg-[#F1F5F9] cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <form onSubmit={send} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
            <div>
              <label className={label}>Client's name</label>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Patil" autoFocus />
            </div>
            <div>
              <label className={label}>WhatsApp number</label>
              <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" inputMode="tel" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Language they speak</label>
                <select className={field} value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="">Choose…</option>
                  {CLIENT_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Gender <span className="text-[#9AA4B2] font-normal">(optional)</span></label>
                <select className={field} value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Not set</option>
                  {CLIENT_GENDERS.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
                </select>
              </div>
            </div>
            <p className="text-[12px] text-[#9AA4B2] -mt-1">Language and gender help Emora speak to them naturally (in Hindi or Marathi, words change with gender).</p>

            <InviteRelationship onChange={setRel} />

            {error && <p className="text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-lg px-3 py-2">{error}</p>}

            <div className="flex items-center justify-between gap-3 pt-1">
              {onUseEmail ? (
                <button type="button" onClick={onUseEmail} className="text-[13px] text-[#6B7686] hover:text-[#0F766E] underline underline-offset-2 cursor-pointer">
                  Invite by email instead
                </button>
              ) : <span />}
              <button type="submit" disabled={!canSend}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] text-white text-[15px] font-medium px-5 py-2.5 hover:bg-[#0B5E58] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-5">
            {result.wa_status === 'sent' ? (
              <div className="flex items-start gap-3 rounded-xl bg-[#F1FAF9] border border-[#CDEBE7] p-4">
                <Check className="w-5 h-5 text-[#0F766E] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[15px] font-medium text-[#10151F]">Sent on WhatsApp</p>
                  <p className="text-[13px] text-[#6B7686] mt-0.5">{firstName} will get a message from Unclinq. One tap on <b>Start</b> and they're in. You'll see them here when they join.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl bg-[#FEF8EC] border border-[#F5D9A8] p-4">
                <MessageCircle className="w-5 h-5 text-[#B45309] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[15px] font-medium text-[#10151F]">Send it from your WhatsApp</p>
                  <p className="text-[13px] text-[#6B7686] mt-0.5">Unclinq couldn't message {firstName} directly yet. Share the join link below: they tap it, press send, and they're in.</p>
                </div>
              </div>
            )}

            {result.join_link && (
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-[#3A4453]">{result.wa_status === 'sent' ? 'Backup: share from your own WhatsApp' : 'Join link'}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={shareOnWhatsApp} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white text-[14px] font-medium px-4 py-2.5 hover:brightness-95 cursor-pointer">
                    <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                  </button>
                  <button onClick={copyLink} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E7EE] text-[#3A4453] text-[14px] font-medium px-4 py-2.5 hover:bg-[#F8FAFB] cursor-pointer">
                    {copied ? <Check className="w-4 h-4 text-[#0F766E]" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy message'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={onClose} className="rounded-xl bg-[#10151F] text-white text-[14px] font-medium px-5 py-2.5 hover:opacity-90 cursor-pointer">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
