import React, { useState, useRef, useEffect } from 'react';
import { 
  Lock, 
  Database,
  Compass,
  CheckCircle2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { TherapistProfile } from '../types';
import { PRACTICE_LOGO_PRESETS } from '../data/therapistData';

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
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'practice' | 'notifications' | 'privacy'>('privacy');
  const [briefingPrepLeadTime, setBriefingPrepLeadTime] = useState('2 hours before session');
  const [somaticEmphasis, setSomaticEmphasis] = useState(true);
  const [separateInterpretation, setSeparateInterpretation] = useState(true);

  // Local editable profile state
  const [name, setName] = useState(therapistProfile?.name || 'Dr. Elena Vance');
  const [specialization, setSpecialization] = useState(therapistProfile?.specialization || 'Clinical Psychology, CBT & Somatic Integration');
  const [licenseNumber, setLicenseNumber] = useState(therapistProfile?.licenseNumber || 'PSY-884920-CA');
  const [email, setEmail] = useState(therapistProfile?.email || 'dr.vance@mindfulpractice.health');
  const [practiceName, setPracticeName] = useState(therapistProfile?.practiceName || 'Mindful Practice Clinic');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(therapistProfile?.logoUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSaveProfile = () => {
    if (onUpdateTherapistProfile && therapistProfile) {
      onUpdateTherapistProfile({
        ...therapistProfile,
        name,
        specialization,
        licenseNumber,
        email,
        practiceName,
        logoUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
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
            Clinician profile, briefing parameters, and longitudinal data safeguards
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
          Privacy & Model
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
        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`px-4 py-2 rounded-lg transition-colors font-medium border cursor-pointer ${
            activeSubTab === 'notifications'
              ? 'bg-[#10151F] border-[#10151F] text-white'
              : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:text-[#10151F] hover:border-[#DCE2EA]'
          }`}
        >
          Briefing Prep
        </button>
      </div>

      {/* Privacy & Longitudinal Model Section */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl space-y-5">
            <div className="flex items-center space-x-2.5">
              <Database className="w-5 h-5 text-[#0D9488]" />
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">
                Longitudinal Model Architecture
              </h2>
            </div>

            <p className="text-base sm:text-lg font-serif text-[#3A4453] leading-relaxed font-normal">
              The clinical workspace operates on a single longitudinal model rather than disconnected report generators. Session context provided by the therapist and client activity between sessions are synthesized into grounded briefings, journey patterns, and actions.
            </p>

            {/* Architecture Flow Representation */}
            <div className="p-5 rounded-xl bg-white border border-[#ECEFF3] space-y-3">
              <div className="u-eyebrow">Underlying Loop</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-xl bg-white border border-[#ECEFF3]">
                  <div className="font-semibold text-[#10151F] text-base font-serif">Session</div>
                  <div className="text-[13px] text-[#6B7686] mt-0.5 font-medium">Therapist context</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#ECEFF3]">
                  <div className="font-semibold text-[#10151F] text-base font-serif">Between Session</div>
                  <div className="text-[13px] text-[#6B7686] mt-0.5 font-medium">Client journals & logs</div>
                </div>
                <div className="p-4 rounded-xl bg-[#F1FAF9] border border-[#ECEFF3] text-[#0F766E]">
                  <div className="font-semibold text-base font-serif">AI Synthesis</div>
                  <div className="text-[13px] mt-0.5 font-medium">Next-session briefing</div>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={separateInterpretation}
                  onChange={(e) => setSeparateInterpretation(e.target.checked)}
                  className="rounded border-[#ECEFF3] text-[#0D9488] focus:ring-0 w-4 h-4"
                />
                <span className="text-sm sm:text-base text-[#10151F] font-medium">
                  Strictly separate observed facts from AI interpretation in all briefings
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={somaticEmphasis}
                  onChange={(e) => setSomaticEmphasis(e.target.checked)}
                  className="rounded border-[#ECEFF3] text-[#0D9488] focus:ring-0 w-4 h-4"
                />
                <span className="text-sm sm:text-base text-[#10151F] font-medium">
                  Highlight somatic tension and physiological logs in evidence drawer
                </span>
              </label>
            </div>
          </div>

          <div className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl space-y-3">
            <div className="flex items-center space-x-2.5">
              <Lock className="w-5 h-5 text-[#0D9488]" />
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">
                Data Privacy & HIPAA Isolation
              </h2>
            </div>
            <p className="text-base sm:text-lg font-serif text-[#3A4453] leading-relaxed font-normal">
              Private therapist notes are encrypted client-side and never fed back into patient-accessible models. Zero-retention LLM inference ensures clinical notes stay strictly within your authenticated boundary.
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
              <label className="u-eyebrow block mb-1.5">Specialization</label>
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
              <label className="u-eyebrow block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-base font-serif text-[#10151F] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
              />
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
              {saveSuccess && (
                <span className="text-[13px] text-[#0F766E] font-medium animate-in fade-in flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Profile updated!</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveProfile}
                className="u-btn-primary"
              >
                Save Profile
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

            <div>
              <label className="u-eyebrow block mb-1.5">Default Session Length</label>
              <select className="w-full px-4 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-base font-serif text-[#10151F] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors cursor-pointer">
                <option>50 minutes</option>
                <option>60 minutes</option>
                <option>45 minutes</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#F2F5F8]">
            {saveSuccess && (
              <span className="text-[13px] text-[#0F766E] font-medium animate-in fade-in flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Practice configuration saved!</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveProfile}
              className="u-btn-primary ml-auto"
            >
              Save Practice Settings
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeSubTab === 'notifications' && (
        <div className="p-6 sm:p-7 bg-white border border-[#ECEFF3] rounded-2xl space-y-5">
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F]">
            Briefing Preparation Timing
          </h2>
          <p className="text-base font-serif text-[#6B7686]">
            When should the system synthesize the latest between-session client activity?
          </p>
          <div className="space-y-2.5">
            {['1 hour before session', '2 hours before session', 'Morning of session (07:00 AM)'].map((opt) => (
              <label key={opt} className="flex items-center space-x-3 p-3.5 rounded-lg bg-white border border-[#ECEFF3] cursor-pointer hover:border-[#DCE2EA] transition-colors">
                <input
                  type="radio"
                  name="prepTime"
                  checked={briefingPrepLeadTime === opt}
                  onChange={() => setBriefingPrepLeadTime(opt)}
                  className="text-[#0D9488] focus:ring-0"
                />
                <span className="text-[#10151F] font-medium text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
