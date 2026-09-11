import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, Check, Copy } from 'lucide-react';
import { authApi } from '../api';

/*
 * TwoFactorCard — enable/disable TOTP two-factor auth for the therapist.
 * Setup uses manual key entry (works in every authenticator app): we show the
 * secret; the therapist adds it to Google Authenticator / Authy / 1Password,
 * then confirms with a code. Disabling also requires a current code.
 */
export const TwoFactorCard: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { authApi.twoFactorStatus().then((r) => setEnabled(r.enabled)).catch(() => setEnabled(false)); }, []);

  async function startSetup() {
    setBusy(true); setError('');
    try { const r = await authApi.twoFactorSetup(); setSecret(r.secret); setMode('setup'); }
    catch (e: any) { setError(e?.data?.error || 'Could not start setup.'); }
    finally { setBusy(false); }
  }
  async function activate() {
    if (code.trim().length !== 6) { setError('Enter the 6-digit code from your app.'); return; }
    setBusy(true); setError('');
    try { await authApi.twoFactorActivate(code.trim()); setEnabled(true); setMode('idle'); setCode(''); setSecret(''); }
    catch (e: any) { setError(e?.data?.error || 'That code was not valid.'); }
    finally { setBusy(false); }
  }
  async function disable() {
    if (code.trim().length !== 6) { setError('Enter a current code to turn 2FA off.'); return; }
    setBusy(true); setError('');
    try { await authApi.twoFactorDisable(code.trim()); setEnabled(false); setMode('idle'); setCode(''); }
    catch (e: any) { setError(e?.data?.error || 'That code was not valid.'); }
    finally { setBusy(false); }
  }

  const codeInput = 'w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-center text-lg tracking-[0.3em] font-semibold text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white';

  return (
    <div className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
          <div>
            <div className="text-[15px] font-semibold text-[#10151F]">Two-factor authentication</div>
            <div className="text-[12px] text-[#6B7686]">An extra code from your phone at sign-in — recommended for client data.</div>
          </div>
        </div>
        {enabled !== null && (
          <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${enabled ? 'bg-[#E3F0E4] text-[#2F6D3A]' : 'bg-[#F4F6F9] text-[#6B7686]'}`}>
            {enabled ? 'On' : 'Off'}
          </span>
        )}
      </div>

      {mode === 'idle' && enabled === false && (
        <button onClick={startSetup} disabled={busy} className="u-btn-primary disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}<span>Enable two-factor</span>
        </button>
      )}
      {mode === 'idle' && enabled === true && (
        <button onClick={() => { setMode('disable'); setError(''); }} className="u-btn-ghost text-[#B0332F]">Turn off two-factor</button>
      )}

      {mode === 'setup' && (
        <div className="space-y-3">
          <p className="text-[13px] text-[#3A4453]">1. In your authenticator app (Google Authenticator, Authy, 1Password), choose <strong>“Add / Enter a setup key”</strong> and paste this key:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[13px] font-mono bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3 py-2 break-all">{secret}</code>
            <button onClick={() => { navigator.clipboard?.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="u-btn-ghost u-btn--sm">{copied ? <Check className="w-4 h-4 text-[#0F766E]" /> : <Copy className="w-4 h-4" />}</button>
          </div>
          <p className="text-[13px] text-[#3A4453]">2. Enter the 6-digit code it shows:</p>
          <input autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} maxLength={6} placeholder="••••••" className={codeInput} />
          <div className="flex gap-2">
            <button onClick={activate} disabled={busy} className="u-btn-primary disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}<span>Confirm & enable</span></button>
            <button onClick={() => { setMode('idle'); setCode(''); setSecret(''); setError(''); }} className="u-btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {mode === 'disable' && (
        <div className="space-y-3">
          <p className="text-[13px] text-[#3A4453]">Enter a current code from your authenticator app to turn 2FA off.</p>
          <input autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} maxLength={6} placeholder="••••••" className={codeInput} />
          <div className="flex gap-2">
            <button onClick={disable} disabled={busy} className="u-btn-primary u-btn--danger disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}<span>Turn off</span></button>
            <button onClick={() => { setMode('idle'); setCode(''); setError(''); }} className="u-btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {error && <p className="text-[12px] text-[#B0332F]">{error}</p>}
    </div>
  );
};
