import React, { useEffect, useState } from 'react';
import { UserPlus, Check, Copy, Send, AlertCircle } from 'lucide-react';
import { consoleApi } from '../api';

// Admin → Add therapist. Built for a clinic visit: fill three fields, tap once, then
// send them the welcome message from your own WhatsApp. Only shown to ADMIN_EMAILS.

type Therapist = {
  id: string; email: string; name: string; created_at: string;
  verification_status: string | null; plan: string | null; seats: number | null;
  active_clients: number; last_active: string | null;
};
type Result = { created: boolean; therapist: { name: string; email: string; seats: number }; email_sent: boolean; welcome_text: string };

const toWaDigits = (raw: string) => {
  const d = raw.replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
};
const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

export const AdminView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [seats, setSeats] = useState('5');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [sentPhone, setSentPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [list, setList] = useState<Therapist[] | null>(null);

  const load = () => consoleApi.therapists().then((r) => setList(r.therapists || [])).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const r = await consoleApi.addTherapist({ name: name.trim(), email: email.trim(), seats: Number(seats) || 5 });
      setResult(r);
      setSentPhone(phone);
      setName(''); setEmail(''); setPhone(''); setSeats('5');
      load();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Could not add them. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const shareOnWhatsApp = () => {
    if (!result) return;
    const to = sentPhone ? toWaDigits(sentPhone) : '';
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(result.welcome_text)}`, '_blank', 'noopener');
  };
  const copyText = () => {
    if (!result) return;
    navigator.clipboard?.writeText(result.welcome_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const field = 'w-full rounded-xl border border-[#E2E7EE] bg-white px-3.5 py-2.5 text-[15px] text-[#10151F] placeholder-[#B6BFCB] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10';
  const label = 'block text-[13px] font-medium text-[#3A4453] mb-1.5';

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      <div className="p-6 sm:p-7 bg-white rounded-2xl border border-[#ECEFF3]">
        <span className="u-eyebrow">Admin</span>
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#10151F] tracking-tight mt-0.5">Add a therapist</h1>
        <p className="text-[13px] text-[#6B7686] mt-1">
          Their account is ready straight away. They sign in at the dashboard with their email.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className={label}>Name</label>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Anjali Deshmukh" autoComplete="off" />
          </div>
          <div>
            <label className={label}>Email <span className="text-[#9AA4B2] font-normal">(they sign in with this)</span></label>
            <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anjali@clinic.in" inputMode="email" autoComplete="off" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
            <div>
              <label className={label}>WhatsApp number <span className="text-[#9AA4B2] font-normal">(optional, to send the welcome)</span></label>
              <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" inputMode="tel" />
            </div>
            <div>
              <label className={label}>Client seats</label>
              <input className={field} value={seats} onChange={(e) => setSeats(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#FBD5D5] p-3.5 text-[14px] text-[#9B1C1C]">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim() || !email.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-white text-[15px] font-medium px-5 py-2.5 hover:bg-[#0B5E58] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {saving ? 'Adding…' : 'Add therapist'}
          </button>
        </form>

        {result && (
          <div className="mt-6 rounded-xl bg-[#F1FAF9] border border-[#CDEBE7] p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#0F766E] mt-0.5 shrink-0" />
              <div className="text-[14px] text-[#10151F]">
                <p className="font-medium">
                  {result.created ? `${result.therapist.name} is set up` : `${result.therapist.name} already had an account. Updated`} with {result.therapist.seats} seats.
                </p>
                <p className="text-[#3A4453] mt-0.5">
                  {result.email_sent ? `Welcome email sent to ${result.therapist.email}.` : `The welcome email didn't go out. Send the message below instead.`}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={shareOnWhatsApp} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white text-[14px] font-medium px-4 py-2.5 hover:brightness-95 cursor-pointer">
                <Send className="w-4 h-4" /> Send on WhatsApp
              </button>
              <button onClick={copyText} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E7EE] bg-white text-[#3A4453] text-[14px] font-medium px-4 py-2.5 hover:bg-[#F8FAFB] cursor-pointer">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy message'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#ECEFF3] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F2F5F8]">
          <h2 className="text-[15px] font-semibold text-[#10151F]">Therapists</h2>
        </div>
        {list === null ? (
          <p className="px-6 py-5 text-[14px] text-[#6B7686]">Loading…</p>
        ) : list.length === 0 ? (
          <p className="px-6 py-5 text-[14px] text-[#6B7686]">No therapists yet.</p>
        ) : (
          <ul className="divide-y divide-[#F2F5F8]">
            {list.map((t) => (
              <li key={t.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#10151F] truncate">{t.name || t.email}</p>
                  <p className="text-[12px] text-[#6B7686] truncate">{t.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] text-[#10151F]">{t.active_clients} / {t.seats ?? 1} clients</p>
                  <p className="text-[12px] text-[#9AA4B2]">
                    {t.verification_status === 'verified' ? 'Verified' : 'Not verified'} · added {shortDate(t.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
