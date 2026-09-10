import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Upload, Check, Copy, ShieldCheck, Repeat, Mic, MessageCircle, Sparkles, FileText } from 'lucide-react';
import { api, invitationsApi, inviteLink } from '../api';

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
    logo_url: '',
    emergency_phone: '',
  });

  function handleLogo(file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('logo_url', String(reader.result || ''));
    reader.readAsDataURL(file);
  }
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
      // Go through the shared API client so it uses VITE_API_URL in production
      // (a raw fetch('/api/...') only works behind the local dev proxy).
      await api.postForm('/therapist/certificate', fd);
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
    <div className="min-h-screen flex flex-col font-sans" style={{ background: 'radial-gradient(1100px 460px at 50% -8%, #E7F1F1 0%, #FAFBFC 62%)' }}>
      {/* Brand bar */}
      <header className="w-full">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Unclinq" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-[#10151F]">Unclinq <span className="text-[#6B7686] text-sm font-medium">for therapists</span></span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA4B2]">Workspace setup</span>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-6 pb-12">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl border border-[#ECEFF3] shadow-[0_24px_64px_rgba(16,21,31,0.10)] overflow-hidden">
            {/* progress */}
            <div className="px-7 pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0F766E]">Step {i + 1} of {STEPS.length}</span>
                <span className="text-[11px] text-[#9AA4B2]">{Math.round(((i + 1) / STEPS.length) * 100)}% complete</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#EDF2F4] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#2DD4BF] transition-all duration-300" style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} />
              </div>
            </div>

            <div className="px-7 py-7 min-h-[290px]">
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
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">Practice logo <span className="text-[#9AA4B2] font-normal">(optional — white-labels your workspace)</span></label>
                <label className="flex items-center gap-3 cursor-pointer">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="logo" className="w-12 h-12 rounded-xl object-cover border border-[#ECEFF3]" />
                    : <span className="w-12 h-12 rounded-xl bg-[#F1FAF9] text-[#0F766E] flex items-center justify-center"><Upload className="w-4 h-4" /></span>}
                  <span className="text-sm text-[#0F766E] font-medium">{form.logo_url ? 'Change logo' : 'Upload your logo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} />
                </label>
                <p className="text-[11px] text-[#9AA4B2] mt-1.5">Upload your logo and clients + your dashboard show your brand instead of Unclinq’s.</p>
              </div>
              <Field label="Practice / clinic name" value={form.practice_name} onChange={(v) => set('practice_name', v)} placeholder="Still Waters Therapy" />
              <Field label="Specializations (comma-separated)" value={form.specializations} onChange={(v) => set('specializations', v)} placeholder="Anxiety, Trauma, CBT" />
              <div className="mt-3">
                <Field label="Emergency contact number" value={form.emergency_phone} onChange={(v) => set('emergency_phone', v)} placeholder="+91 98765 43210" />
                <p className="text-[11px] text-[#9AA4B2] mt-1.5">If a connected client shows signs of crisis in the app, they’ll be urged to call you at this number first, alongside national helplines. Leave blank to show helplines only.</p>
              </div>
              <div className="mt-3">
                <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">Short bio (optional)</label>
                <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={3} placeholder="A sentence about your practice…"
                  className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white" />
              </div>
            </Card>
          )}

          {step === 'how' && (
            <Card eyebrow="How Unclinq works" title="Unclinq works around your sessions.">
              <div className="relative">
                {/* connecting spine */}
                <div className="absolute left-[19px] top-6 bottom-14 w-0.5 bg-gradient-to-b from-[#0D9488]/40 via-[#0D9488]/25 to-[#0D9488]/10" />
                {[
                  { Icon: Mic, title: 'Session', sub: 'You meet — recorded in the client’s app, with consent.' },
                  { Icon: MessageCircle, title: 'The client’s week', sub: 'Journal · Emora · actions, between sessions.' },
                  { Icon: Sparkles, title: 'AI synthesis', sub: 'Woven into Therapy Moments — evidence, not noise.' },
                  { Icon: FileText, title: 'Next-session briefing', sub: 'One-minute, evidence-backed prep.' },
                ].map(({ Icon, title, sub }, i) => (
                  <div key={i} className="relative flex items-start gap-3.5 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F1FAF9] border border-[#CCE9E6] flex items-center justify-center shrink-0 z-10">
                      <Icon className="w-[18px] h-[18px] text-[#0D9488]" />
                    </div>
                    <div className="pt-1.5 flex-1 bg-white rounded-xl border border-[#ECEFF3] px-4 py-3 -mt-0.5">
                      <p className="text-sm font-semibold text-[#10151F]">{title}</p>
                      <p className="text-xs text-[#6B7686] mt-0.5 leading-relaxed">{sub}</p>
                    </div>
                  </div>
                ))}
                {/* loops back */}
                <div className="relative flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center shrink-0 z-10">
                    <Repeat className="w-[18px] h-[18px] text-white" />
                  </div>
                  <p className="text-sm font-medium text-[#0F766E]">…and the next session starts warmer than the last.</p>
                </div>
              </div>
              <div className="mt-5 p-3.5 rounded-xl bg-[#F1FAF9] border border-[#CCE9E6]">
                <p className="text-sm text-[#0F766E] font-medium">Less time piecing together context — more time on the session.</p>
              </div>
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
              {error && <p className="text-xs text-[#B0332F] mt-4">{error}</p>}
            </div>

            {/* nav footer */}
            <div className="flex items-center gap-2 px-7 py-5 border-t border-[#F2F5F8] bg-[#FCFDFE]">
              {i > 0 && step !== 'done' && <button onClick={back} disabled={busy} className="u-btn-ghost"><ArrowLeft className="w-4 h-4" /><span>Back</span></button>}
              <div className="flex-1" />
              {step === 'professional' ? (
                <button onClick={() => saveProfile()} disabled={busy} className="u-btn-primary"><span>Continue</span><ArrowRight className="w-4 h-4" /></button>
              ) : step === 'practice' ? (
                <button onClick={() => saveProfile()} disabled={busy} className="u-btn-primary"><span>Continue</span><ArrowRight className="w-4 h-4" /></button>
              ) : step === 'invite' ? (
                code ? (
                  <button onClick={next} className="u-btn-primary"><span>Continue</span><ArrowRight className="w-4 h-4" /></button>
                ) : (
                  <>
                    <button onClick={next} className="u-btn-ghost"><span>Skip for now</span></button>
                    <button onClick={generateInvite} disabled={busy || !invName.trim() || !invEmail.trim()} className="u-btn-primary"><span>Generate invitation</span><ArrowRight className="w-4 h-4" /></button>
                  </>
                )
              ) : step === 'done' ? (
                <button onClick={finish} disabled={busy} className="u-btn-primary"><span>Go to my dashboard</span><ArrowRight className="w-4 h-4" /></button>
              ) : (
                <button onClick={next} disabled={busy} className="u-btn-primary"><span>Continue</span><ArrowRight className="w-4 h-4" /></button>
              )}
            </div>
          </div>
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
      className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/15 transition-all" />
  </div>
);
const Principle: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="flex gap-3 mb-3">
    <ShieldCheck className="w-4 h-4 text-[#0D9488] mt-0.5 shrink-0" />
    <div><p className="text-sm font-medium text-[#10151F]">{title}</p><p className="text-xs text-[#6B7686] mt-0.5">{body}</p></div>
  </div>
);
