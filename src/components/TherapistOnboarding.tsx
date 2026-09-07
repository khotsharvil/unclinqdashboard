import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Upload, Check, Copy, ShieldCheck, Repeat } from 'lucide-react';
import { api, invitationsApi, inviteLink, getToken } from '../api';

/*
 * Therapist workspace-setup onboarding (THERAPIST_ONBOARDING.md).
 * Runs after account creation, gated on onboarding_completed === false.
 * Writes real data: PATCH /therapist/profile, POST /therapist/certificate,
 * POST /invitations. The therapist never creates the client's account —
 * they generate a code the client redeems.
 */
const STEPS = ['welcome', 'professional', 'certificate', 'practice', 'how', 'privacy', 'invite', 'done'];

export const TherapistOnboarding: React.FC<{ onDone: () => void; therapistName?: string }> = ({ onDone, therapistName }) => {
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const step = STEPS[i];

  const [form, setForm] = useState({
    name: therapistName || '',
    professional_title: '',
    qualification: '',
    registration_no: '',
    practice_name: '',
    bio: '',
    specializations: '',
  });
  const [certName, setCertName] = useState('');
  const [certStatus, setCertStatus] = useState<'none' | 'pending'>('none');

  // invite
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const next = () => setI((n) => Math.min(n + 1, STEPS.length - 1));
  const back = () => setI((n) => Math.max(n - 1, 0));

  async function saveProfile(extra?: Record<string, any>) {
    setBusy(true); setError('');
    try {
      await api.patch('/therapist/profile', {
        ...form,
        specializations: form.specializations ? form.specializations.split(',').map((s) => s.trim()).filter(Boolean) : [],
        ...extra,
      });
      next();
    } catch (e: any) { setError(e?.data?.error || 'Could not save. Try again.'); }
    finally { setBusy(false); }
  }

  async function uploadCert(file: File) {
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('certificate', file);
      const res = await fetch('/api/therapist/certificate', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
      if (!res.ok) throw new Error('upload failed');
      setCertName(file.name); setCertStatus('pending');
    } catch { setError('Could not upload the certificate.'); }
    finally { setBusy(false); }
  }

  async function generateInvite() {
    setBusy(true); setError('');
    try {
      const res = await invitationsApi.create({ client_name: invName.trim(), client_email: invEmail.trim(), expires_in_days: 7 });
      setCode(res.invitation.code);
    } catch (e: any) { setError(e?.data?.error || 'Could not create invitation.'); }
    finally { setBusy(false); }
  }

  async function finish() {
    setBusy(true);
    try { await api.post('/auth/onboarding/complete'); } catch { /* non-fatal */ }
    onDone();
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col font-sans">
      <div className="w-full max-w-xl mx-auto px-6 py-8 flex-1 flex flex-col">
        {/* progress */}
        <div className="flex justify-center gap-1.5 mb-8">
          {STEPS.map((_, n) => (
            <span key={n} className="h-1.5 rounded-full transition-all" style={{ width: n === i ? 22 : 6, background: n <= i ? '#0D9488' : '#E2E8F0' }} />
          ))}
        </div>

        <div className="flex-1">
          {step === 'welcome' && (
            <Card eyebrow="Welcome" title="A clearer view of therapy between sessions.">
              <p className="text-sm text-[#6B7686] leading-relaxed">Unclinq turns the activity around therapy into the small amount of context you actually need — a one-minute briefing before each session, and a longitudinal view of how your client is doing between them.</p>
            </Card>
          )}

          {step === 'professional' && (
            <Card eyebrow="Professional profile" title="Tell us who you are, professionally.">
              <Field label="Full name" value={form.name} onChange={(v) => set('name', v)} placeholder="Dr. Jane Smith" />
              <Field label="Professional title" value={form.professional_title} onChange={(v) => set('professional_title', v)} placeholder="Clinical Psychologist" />
              <Field label="Qualification" value={form.qualification} onChange={(v) => set('qualification', v)} placeholder="M.Phil Clinical Psychology" />
              <Field label="Registration / certification no." value={form.registration_no} onChange={(v) => set('registration_no', v)} placeholder="RCI-A-12345" />
            </Card>
          )}

          {step === 'certificate' && (
            <Card eyebrow="Verification" title="Verify your professional profile.">
              <p className="text-sm text-[#6B7686] mb-4">Your credentials help us verify you’re a mental health professional. You can keep setting up while it’s reviewed.</p>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#D8E0E8] rounded-xl py-6 cursor-pointer hover:border-[#0D9488] transition-colors">
                <Upload className="w-4 h-4 text-[#0D9488]" />
                <span className="text-sm text-[#3A4453]">{certName ? certName : 'Upload certificate (PDF or image)'}</span>
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCert(e.target.files[0])} />
              </label>
              {certStatus === 'pending' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#0F766E]"><Check className="w-4 h-4" /> Uploaded — verification pending. You can continue.</div>
              )}
            </Card>
          )}

          {step === 'practice' && (
            <Card eyebrow="Practice profile" title="Set up your practice.">
              <Field label="Practice / clinic name" value={form.practice_name} onChange={(v) => set('practice_name', v)} placeholder="Still Waters Therapy" />
              <Field label="Specializations (comma-separated)" value={form.specializations} onChange={(v) => set('specializations', v)} placeholder="Anxiety, Trauma, CBT" />
              <div className="mt-3">
                <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">Short bio (optional)</label>
                <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={3} placeholder="A sentence about your practice…"
                  className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white" />
              </div>
            </Card>
          )}

          {step === 'how' && (
            <Card eyebrow="How Unclinq works" title="Unclinq works around your sessions.">
              <div className="text-sm font-mono leading-relaxed p-4 rounded-xl bg-[#F7F9FB] border border-[#ECEFF3] text-[#10151F]">
                Session<br />&nbsp;&nbsp;↓<br />Client’s week (Journal · Emora · actions)<br />&nbsp;&nbsp;↓<br />AI synthesis → Therapy Moments<br />&nbsp;&nbsp;↓<br />Next-session briefing<br />&nbsp;&nbsp;↓<br />Session
              </div>
              <p className="text-sm text-[#6B7686] mt-3">Less time piecing together context — more time on the session.</p>
            </Card>
          )}

          {step === 'privacy' && (
            <Card eyebrow="Privacy & AI" title="You stay in control.">
              <Principle title="Evidence first" body="AI surfaces what the client actually said and did — never unsupported conclusions." />
              <Principle title="Transparent" body="Every insight is provenance-labelled; you can see where it came from." />
              <Principle title="Clinician-led" body="Unclinq supports your workflow. It never replaces your clinical judgment." />
            </Card>
          )}

          {step === 'invite' && (
            <Card eyebrow="Invite your first client" title="Invite your first client.">
              {!code ? (
                <>
                  <Field label="Client name" value={invName} onChange={setInvName} placeholder="Maya Lin" />
                  <Field label="Client email" value={invEmail} onChange={setInvEmail} placeholder="client@example.com" />
                  <p className="text-xs text-[#9AA4B2] mt-2">They create their own account with the code — you never create it for them.</p>
                </>
              ) : (
                <div className="bg-[#F1FAF9] border border-[#CCE9E6] rounded-xl p-5 text-center">
                  <p className="u-eyebrow">Invitation code</p>
                  <p className="text-3xl font-mono font-semibold tracking-[0.25em] text-[#10151F] my-2">{code}</p>
                  <button onClick={() => { navigator.clipboard?.writeText(inviteLink(code)); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="u-btn-ghost text-xs mx-auto">
                    {copied ? <Check className="w-3.5 h-3.5 text-[#0F766E]" /> : <Copy className="w-3.5 h-3.5 text-[#6B7686]" />}<span>{copied ? 'Copied link' : 'Copy invitation link'}</span>
                  </button>
                  <p className="text-[11px] text-[#6B7686] mt-3">{invName || 'Your client'} will appear as “Invitation pending” until they finish onboarding.</p>
                </div>
              )}
            </Card>
          )}

          {step === 'done' && (
            <Card eyebrow="You’re set" title="Your workspace is ready.">
              <p className="text-sm text-[#6B7686]">Briefing, Sessions and Journey become more useful as your clients use Unclinq between sessions.</p>
            </Card>
          )}
        </div>

        {error && <p className="text-xs text-[#B0332F] mt-3">{error}</p>}

        {/* nav */}
        <div className="flex items-center gap-2 pt-6">
          {i > 0 && step !== 'done' && <button onClick={back} disabled={busy} className="u-btn-ghost"><ArrowLeft className="w-4 h-4" /><span>Back</span></button>}
          <div className="flex-1" />
          {step === 'professional' ? (
            <button onClick={() => saveProfile()} disabled={busy} className="u-btn-primary"><span>Continue</span><ArrowRight className="w-4 h-4" /></button>
          ) : step === 'practice' ? (
            <button onClick={() => saveProfile()} disabled={busy} className="u-btn-primary"><span>Continue</span><ArrowRight className="w-4 h-4" /></button>
          ) : step === 'invite' ? (
            code
              ? <button onClick={next} className="u-btn-primary"><span>Continue</span><ArrowRight className="w-4 h-4" /></button>
              : <button onClick={generateInvite} disabled={busy || !invName.trim() || !invEmail.trim()} className="u-btn-primary"><span>Generate invitation</span><ArrowRight className="w-4 h-4" /></button>
          ) : step === 'done' ? (
            <button onClick={finish} disabled={busy} className="u-btn-primary"><span>Go to my dashboard</span><ArrowRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={next} disabled={busy} className="u-btn-primary"><span>Continue</span><ArrowRight className="w-4 h-4" /></button>
          )}
        </div>
      </div>
    </div>
  );
};

const Card: React.FC<{ eyebrow: string; title: string; children: React.ReactNode }> = ({ eyebrow, title, children }) => (
  <div>
    <p className="u-eyebrow">{eyebrow}</p>
    <h1 className="text-2xl font-serif font-semibold text-[#10151F] mt-1 mb-5">{title}</h1>
    {children}
  </div>
);
const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="mb-3">
    <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">{label}</label>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white" />
  </div>
);
const Principle: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="flex gap-3 mb-3">
    <ShieldCheck className="w-4 h-4 text-[#0D9488] mt-0.5 shrink-0" />
    <div><p className="text-sm font-medium text-[#10151F]">{title}</p><p className="text-xs text-[#6B7686] mt-0.5">{body}</p></div>
  </div>
);
