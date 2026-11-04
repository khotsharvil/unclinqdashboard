import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { api, authApi, legalUrl, getUser } from '../api';

// Shown once, only to an account that signed up before terms were part of sign-in.
export const AgreeTerms: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const agree = async () => {
    setBusy(true); setError('');
    try {
      await authApi.recordConsent({ age_confirmed: true, accepted: [{ doc: 'terms_therapist' }, { doc: 'privacy' }, { doc: 'data_processing' }] });
      await api.post('/auth/onboarding/complete');
      try { localStorage.setItem('unclinq_user', JSON.stringify({ ...(getUser() || {}), onboarding_completed: true })); } catch { /* ignore */ }
      onDone();
    } catch (e: any) {
      setError(e?.data?.error || 'Couldn’t save that. Please try again.');
    } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#ECEFF3] shadow-[0_20px_60px_rgba(16,21,31,0.10)] p-7 space-y-4">
        <h1 className="text-2xl font-serif font-semibold text-[#10151F]">One last thing</h1>
        <p className="text-[14px] text-[#3A4453] leading-relaxed">
          Please agree to the{' '}
          <a href={legalUrl('terms-therapist')} target="_blank" rel="noreferrer" className="text-[#0F766E] underline underline-offset-2">Therapist Terms &amp; DPA</a> and{' '}
          <a href={legalUrl('privacy')} target="_blank" rel="noreferrer" className="text-[#0F766E] underline underline-offset-2">Privacy Policy</a> to use Unclinq.
        </p>
        {error && <p className="text-xs text-[#B0332F]">{error}</p>}
        <button onClick={agree} disabled={busy} className="u-btn-primary w-full justify-center disabled:opacity-50">
          <span>{busy ? 'Please wait…' : 'Agree & continue'}</span>{!busy && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
