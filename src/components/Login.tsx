import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { authApi, setAuth } from '../api';

/*
 * Therapist login for the dashboard → B2B2C backend (OTP).
 * New therapist: enter name + email (register). Returning: just email (login).
 * A 6-digit code is emailed (dev: logged to the backend console).
 */
export const Login: React.FC<{ onAuthed: () => void }> = ({ onAuthed }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const purpose = mode === 'signup' ? 'register' : 'login';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (!sent) {
        if (!email.trim() || (mode === 'signup' && !name.trim())) { setError('Enter your details.'); setBusy(false); return; }
        await authApi.sendOtp(email.trim(), purpose);
        setSent(true);
      } else {
        const res = await authApi.verifyOtp(email.trim(), code.trim(), purpose, name.trim() || undefined);
        setAuth(res.token, res.user);
        onAuthed();
      }
    } catch (err: any) {
      // New email used on the Sign-in path: the backend emails a code for both
      // login and register, but verify 404s when there's no account yet. Guide
      // the user into sign-up instead of dead-ending — switch modes, keep the
      // email, and have them add a name + request a fresh (register) code.
      if (err?.status === 404 && mode === 'signin' && sent) {
        setMode('signup'); setSent(false); setCode('');
        setError('No workspace with that email yet — add your name and we’ll send a fresh code to create it.');
      } else {
        setError(err?.data?.error || err?.message || 'Something went wrong.');
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <img src="/logo.png" alt="Unclinq" className="w-9 h-9 object-contain" />
          <span className="text-lg font-semibold text-[#10151F]">Unclinq <span className="text-[#6B7686] text-sm font-medium">for therapists</span></span>
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEFF3] shadow-[0_20px_60px_rgba(16,21,31,0.10)] p-7">
          <h1 className="text-2xl font-serif font-semibold text-[#10151F]">
            {mode === 'signup' ? 'Set up your workspace' : 'Welcome back'}
          </h1>
          <p className="text-sm text-[#6B7686] mt-1">
            {sent ? `Enter the 6-digit code we sent to ${email}.` : 'A clearer view of therapy between sessions.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            {!sent ? (
              <>
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">Full name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Smith"
                      className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white" />
                  </div>
                )}
                <div>
                  <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#9AA4B2] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@practice.com"
                      className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white" />
                  </div>
                </div>
              </>
            ) : (
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" maxLength={6}
                className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-3 text-center text-xl tracking-[0.4em] font-semibold text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white" />
            )}

            {error && <p className="text-xs text-[#B0332F]">{error}</p>}

            <button type="submit" disabled={busy} className="u-btn-primary w-full justify-center disabled:opacity-50">
              <span>{busy ? 'Please wait…' : sent ? 'Verify & continue' : 'Send code'}</span>
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>

            {sent && (
              <button type="button" onClick={() => { setSent(false); setCode(''); }} className="u-btn-ghost w-full justify-center text-xs">
                Use a different email
              </button>
            )}
          </form>

          {!sent && (
            <p className="text-xs text-[#6B7686] mt-5 text-center">
              {mode === 'signup' ? 'Already have an account?' : 'New to Unclinq?'}{' '}
              <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }} className="text-[#0F766E] font-medium">
                {mode === 'signup' ? 'Sign in' : 'Set up your workspace'}
              </button>
            </p>
          )}
        </div>

        <p className="text-[11px] text-[#9AA4B2] mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" /> Consent-gated · HIPAA-minded · clinician-led
        </p>
      </div>
    </div>
  );
};
