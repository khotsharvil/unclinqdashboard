import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { authApi, setAuth } from '../api';

/*
 * Therapist auth for the dashboard → B2B2C backend (OTP), email-first.
 * One path, no login/signup toggle: enter email → we detect new vs returning
 * (/auth/email-exists) → a new therapist is asked for their name, a returning
 * one goes straight to the code. A single 6-digit code is emailed either way
 * (dev: logged to the backend console). New accounts land in onboarding.
 */
type Stage = 'email' | 'name' | 'code';

export const Login: React.FC<{ onAuthed: () => void }> = ({ onAuthed }) => {
  const [stage, setStage] = useState<Stage>('email');
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — email: detect new vs returning, then send the right code.
  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) { setError('Enter your email.'); return; }
    setBusy(true); setError('');
    try {
      const { exists } = await authApi.emailExists(addr);
      if (exists) {
        await authApi.sendOtp(addr, 'login');   // returning therapist
        setIsNew(false); setStage('code');
      } else {
        setIsNew(true); setStage('name');        // new therapist — collect name first
      }
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Something went wrong.');
    } finally { setBusy(false); }
  }

  // Step 2 (new only) — name: then send the register code.
  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Enter your name.'); return; }
    setBusy(true); setError('');
    try {
      await authApi.sendOtp(email.trim(), 'register');
      setStage('code');
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Something went wrong.');
    } finally { setBusy(false); }
  }

  // Step 3 — code: verify with the purpose that matches new/returning.
  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) { setError('Enter the 6-digit code.'); return; }
    setBusy(true); setError('');
    try {
      const res = await authApi.verifyOtp(email.trim(), code.trim(), isNew ? 'register' : 'login', name.trim() || undefined);
      setAuth(res.token, res.user);
      onAuthed();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Something went wrong.');
    } finally { setBusy(false); }
  }

  function resetToEmail() { setStage('email'); setCode(''); setError(''); }

  const title = stage === 'code' ? 'Check your email' : isNew && stage === 'name' ? 'Set up your workspace' : 'Sign in or create your workspace';
  const subtitle = stage === 'code'
    ? `Enter the 6-digit code we sent to ${email}.`
    : stage === 'name'
    ? 'Looks like you’re new here — what should we call you?'
    : 'A clearer view of therapy between sessions.';

  const field = 'w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white';

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <img src="/logo.png" alt="Unclinq" className="w-9 h-9 object-contain" />
          <span className="text-lg font-semibold text-[#10151F]">Unclinq <span className="text-[#6B7686] text-sm font-medium">for therapists</span></span>
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEFF3] shadow-[0_20px_60px_rgba(16,21,31,0.10)] p-7">
          <h1 className="text-2xl font-serif font-semibold text-[#10151F]">{title}</h1>
          <p className="text-sm text-[#6B7686] mt-1">{subtitle}</p>

          {stage === 'email' && (
            <form onSubmit={submitEmail} className="mt-6 space-y-3.5">
              <div>
                <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9AA4B2] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@practice.com"
                    className={`${field} pl-9`} />
                </div>
              </div>
              {error && <p className="text-xs text-[#B0332F]">{error}</p>}
              <button type="submit" disabled={busy} className="u-btn-primary w-full justify-center disabled:opacity-50">
                <span>{busy ? 'Please wait…' : 'Continue'}</span>{!busy && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {stage === 'name' && (
            <form onSubmit={submitName} className="mt-6 space-y-3.5">
              <div>
                <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">Full name</label>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Smith" className={field} />
              </div>
              {error && <p className="text-xs text-[#B0332F]">{error}</p>}
              <button type="submit" disabled={busy} className="u-btn-primary w-full justify-center disabled:opacity-50">
                <span>{busy ? 'Please wait…' : 'Send code'}</span>{!busy && <ArrowRight className="w-4 h-4" />}
              </button>
              <button type="button" onClick={resetToEmail} className="u-btn-ghost w-full justify-center text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
              </button>
            </form>
          )}

          {stage === 'code' && (
            <form onSubmit={submitCode} className="mt-6 space-y-3.5">
              <input autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" maxLength={6}
                className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-3 text-center text-xl tracking-[0.4em] font-semibold text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white" />
              {error && <p className="text-xs text-[#B0332F]">{error}</p>}
              <button type="submit" disabled={busy} className="u-btn-primary w-full justify-center disabled:opacity-50">
                <span>{busy ? 'Please wait…' : 'Verify & continue'}</span>{!busy && <ArrowRight className="w-4 h-4" />}
              </button>
              <button type="button" onClick={resetToEmail} className="u-btn-ghost w-full justify-center text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-[11px] text-[#9AA4B2] mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" /> Consent-gated · HIPAA-minded · clinician-led
        </p>
      </div>
    </div>
  );
};
