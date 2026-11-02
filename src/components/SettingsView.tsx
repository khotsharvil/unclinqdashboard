import React, { useState, useRef, useEffect } from 'react';
import { 
  Lock, 
  Compass,
  CheckCircle2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { TherapistProfile } from '../types';
import { TwoFactorCard } from './TwoFactorCard';
import { PRACTICE_LOGO_PRESETS } from '../data/therapistData';
import { api, legalUrl } from '../api';

const DEMO = (import.meta as any).env?.VITE_DEMO === '1';

interface SettingsViewProps {
  therapistProfile?: TherapistProfile;
  onUpdateTherapistProfile?: (profile: TherapistProfile) => void;
  onOpenOnboarding?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  therapistProfile,
  onUpdateTherapistProfile,
  onOpenOnboarding,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'practice' | 'privacy'>('privacy');

  // Local editable profile state
  const [name, setName] = useState(therapistProfile?.name || '');
  const [specialization, setSpecialization] = useState(therapistProfile?.specialization || '');
  const [licenseNumber, setLicenseNumber] = useState(therapistProfile?.licenseNumber || '');
  const [email, setEmail] = useState(therapistProfile?.email || '');
  const [practiceName, setPracticeName] = useState(therapistProfile?.practiceName || '');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(therapistProfile?.logoUrl);
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load the therapist's real profile (for fields not carried on the prop, e.g.
  // their emergency number). Skipped in demo — there's no backend there.
  useEffect(() => {
    if (DEMO) return;
    api.get('/therapist/profile').then((r: any) => {
      const p = r?.profile; if (!p) return;
      if (p.emergency_phone) setEmergencyPhone(p.emergency_phone);
      if (p.professional_title) setSpecialization(p.professional_title);
      if (p.registration_no) setLicenseNumber(p.registration_no);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (therapistProfile) {
      setName(therapistProfile.name || '');
      setSpecialization(therapistProfile.specialization || '');
      setLicenseNumber(therapistProfile.licenseNumber || '');
      setEmail(therapistProfile.email || '');
      setPracticeName(therapistProfile.practiceName || '');
      setLogoUrl(therapistProfile.logoUrl);
    }
  }, [therapistProfile]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true); setSaveError('');
    // Persist to the backend (maps dashboard fields → therapist profile columns).
    try {
      if (!DEMO) {
        await api.patch('/therapist/profile', {
          name,
          display_name: name,
          professional_title: specialization,
          registration_no: licenseNumber,
          practice_name: practiceName,
          logo_url: logoUrl,
          emergency_phone: emergencyPhone,
        });
      }
    } catch (e: any) {
      setSaveError(e?.data?.error || 'Could not save to the server. Please try again.');
      setSaving(false);
      return;
    }
    // Reflect locally too (drives header/branding without a refetch).
    if (onUpdateTherapistProfile && therapistProfile) {
      onUpdateTherapistProfile({ ...therapistProfile, name, specialization, licenseNumber, email, practiceName, logoUrl } as any);
    }
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="p-6 sm:p-7 bg-white rounded-2xl border border-[#ECEFF3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#10151F] tracking-tight">
            Practice Settings
          </h1>
          <p className="text-[13px] text-[#6B7686] mt-1">
            Your profile, practice details and account security
          </p>
        </div>

        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="u-btn-ghost self-start sm:self-auto"
          >
            <Compass className="w-4 h-4 text-[#0D9488]" />
            <span>Launch Onboarding Wizard</span>
          </button>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-[13px]">
        <button
          onClick={() => setActiveSubTab('privacy')}
          className={`px-4 py-2 rounded-lg transition-colors font-medium border cursor-pointer ${
            activeSubTab === 'privacy'
              ? 'bg-[#10151F] border-[#10151F] text-white'
              : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:text-[#10151F] hover:border-[#DCE2EA]'
          }`}
        >
          Security & privacy
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-lg transition-colors font-medium border cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-[#10151F] border-[#10151F] text-white'
              : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:text-[#10151F] hover:border-[#DCE2EA]'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveSubTab('practice')}
          className={`px-4 py-2 rounded-lg transition-colors font-medium border cursor-pointer ${
            activeSubTab === 'practice'
              ? 'bg-[#10151F] border-[#10151F] text-white'
              : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:text-[#10151F] hover:border-[#DCE2EA]'
          }`}
        >
          Practice
        </button>
      </div>

      {/* Privacy & Longitudinal Model Section */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-6">
          <TwoFactorCard />
          <div className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl">
            <h2 className="text-lg font-serif font-semibold text-[#10151F] mb-1">Legal &amp; data</h2>
            <p className="text-sm text-[#6B7686] mb-3">Client content is encrypted at rest. Review the documents anytime.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a href={legalUrl('terms-therapist')} target="_blank" rel="noreferrer" className="text-[#0D9488] underline">Therapist Terms &amp; DPA</a>
              <a href={legalUrl('privacy')} target="_blank" rel="noreferrer" className="text-[#0D9488] underline">Privacy Policy</a>
              <a href={legalUrl('disclaimer')} target="_blank" rel="noreferrer" className="text-[#0D9488] underline">Medical &amp; Crisis</a>
            </div>
          </div>
          <div className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl space-y-3">
            <div className="flex items-center space-x-2.5">
              <Lock className="w-5 h-5 text-[#0D9488]" />
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">
                Data privacy
              </h2>
            </div>
            <p className="text-base sm:text-lg font-serif text-[#3A4453] leading-relaxed font-normal">
              Session transcripts, notes and client messages are encrypted at rest. Your private notes are never shown to the client. A client’s full chats stay private unless they choose to share them with you, and they can stop sharing anytime.
            </p>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeSubTab === 'profile' && (
        <div className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">
                Clinician Profile
              </h2>
              <p className="text-[13px] text-[#6B7686] mt-0.5">
                Manage your credentials, specialties, and onboarding status
              </p>
            </div>
            {therapistProfile?.onboardingCompleted && (
              <span className="u-chip u-chip-accent">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Onboarding Completed</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="u-eyebrow block mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-base font-serif text-[#10151F] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
              />
            </div>
            <div>
              <label className="u-eyebrow block mb-1.5">Professional title</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-base font-serif text-[#10151F] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
              />
            </div>
            <div>
              <label className="u-eyebrow block mb-1.5">License #</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-base font-serif text-[#10151F] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
              />
            </div>
            <div>
              <label className="u-eyebrow block mb-1.5">Sign-in email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-2.5 bg-[#F2F4F7] border border-[#ECEFF3] rounded-lg text-base font-serif text-[#6B7686] cursor-not-allowed"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="u-eyebrow block mb-1.5">Emergency contact number</label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-base font-serif text-[#10151F] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
              />
              <p className="text-[12px] text-[#6B7686] mt-1.5">
                If a connected client shows signs of crisis in the app, they’ll be urged to call you at this number first, alongside national helplines. Leave blank to show helplines only.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#F2F5F8]">
            {onOpenOnboarding && (
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="text-[13px] font-medium text-[#0F766E] hover:text-[#0D9488] cursor-pointer flex items-center space-x-1.5 transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Rerun full 4-step onboarding wizard</span>
              </button>
            )}

            <div className="flex items-center space-x-3 ml-auto">
              {saveError && (
                <span className="text-[13px] text-[#B0332F] font-medium">{saveError}</span>
              )}
              {saveSuccess && (
                <span className="text-[13px] text-[#0F766E] font-medium animate-in fade-in flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Profile updated!</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="u-btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Tab */}
      {activeSubTab === 'practice' && (
        <div className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">
              Practice Configuration & Branding
            </h2>
            <p className="text-[13px] text-[#6B7686] mt-0.5">
              Practice identity, custom clinical logo, and session defaults
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="u-eyebrow block mb-1.5">Practice Name</label>
              <input
                type="text"
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-base font-serif text-[#10151F] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
              />
            </div>

            {/* Practice Logo Manager */}
            <div className="p-5 rounded-xl bg-[#FCFDFE] border border-[#F2F5F8] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="u-eyebrow">
                    Practice Logo & Emblem
                  </h4>
                  <p className="text-[13px] text-[#6B7686] mt-1">
                    Displayed in the workspace header, client portal invitation cards, and clinical exports
                  </p>
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(undefined)}
                    className="text-[13px] font-medium text-[#6B7686] hover:text-[#10151F] flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Practice logo"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-[#ECEFF3] bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#F7F9FB] border border-dashed border-[#DCE2EA] flex items-center justify-center text-[#9AA4B2] shrink-0">
                      <ImageIcon className="w-6 h-6 text-[#9AA4B2]" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-[#ECEFF3] hover:border-[#DCE2EA] text-[#10151F] text-[13px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#0D9488]" />
                      <span>Upload Logo File</span>
                    </button>
                    <span className="text-[11px] text-[#9AA4B2] block mt-1">
                      PNG, SVG, or JPG under 5MB
                    </span>
                  </div>
                </div>

                <div className="sm:border-l sm:border-[#F2F5F8] sm:pl-4 space-y-1.5">
                  <span className="u-eyebrow block">
                    Or select preset:
                  </span>
                  <div className="flex items-center gap-2">
                    {PRACTICE_LOGO_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setLogoUrl(p.url)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          logoUrl === p.url
                            ? 'border-[#0D9488] bg-[#F1FAF9] ring-1 ring-[#0D9488]'
                            : 'border-[#ECEFF3] bg-white hover:bg-[#F7F9FB]'
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="w-6 h-6 rounded" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#F2F5F8]">
            {saveSuccess && (
              <span className="text-[13px] text-[#0F766E] font-medium animate-in fade-in flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveProfile}
              className="u-btn-primary ml-auto"
            >
              Save
            </button>
          </div>
        </div>
      )}


    </div>
  );
};
