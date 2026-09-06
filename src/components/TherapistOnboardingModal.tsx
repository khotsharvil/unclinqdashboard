import React, { useState, useRef } from 'react';
import { 
  X, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  Building, 
  Lock, 
  UserPlus,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { TherapistProfile } from '../types';
import { AVAILABLE_MODALITIES, AVAILABLE_SPECIALIZATIONS, INITIAL_THERAPIST_PROFILE } from '../data/therapistData';

interface TherapistOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: TherapistProfile;
  initialProfile?: TherapistProfile;
  onSaveProfile: (updated: TherapistProfile) => void;
  onOpenInviteClient?: () => void;
  onInviteClient?: () => void;
}

export const TherapistOnboardingModal: React.FC<TherapistOnboardingModalProps> = ({
  isOpen,
  onClose,
  profile,
  initialProfile,
  onSaveProfile,
  onOpenInviteClient,
  onInviteClient,
}) => {
  const activeProfile = profile || initialProfile || INITIAL_THERAPIST_PROFILE;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<TherapistProfile>({ ...activeProfile });
  const [hasSavedStep, setHasSavedStep] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync formData when modal opens or profile changes
  React.useEffect(() => {
    if (isOpen) {
      const p = profile || initialProfile || INITIAL_THERAPIST_PROFILE;
      setFormData({ ...p });
      setLogoUploadError(null);
      setCurrentStep(1);
    }
  }, [isOpen, profile, initialProfile]);

  if (!isOpen) return null;

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoUploadError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.onerror = () => {
      setLogoUploadError('Failed to read image file. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: undefined }));
    setLogoUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleModality = (modality: string) => {
    setFormData(prev => {
      const exists = prev.modalities.includes(modality);
      return {
        ...prev,
        modalities: exists 
          ? prev.modalities.filter(m => m !== modality)
          : [...prev.modalities, modality]
      };
    });
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => {
      const exists = prev.specializations.includes(spec);
      return {
        ...prev,
        specializations: exists 
          ? prev.specializations.filter(s => s !== spec)
          : [...prev.specializations, spec]
      };
    });
  };

  const handleNextStep = () => {
    setHasSavedStep(true);
    setTimeout(() => setHasSavedStep(false), 1500);

    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finish onboarding
      const finalized = {
        ...formData,
        onboardingCompleted: true,
        onboardingStep: 3,
      };
      onSaveProfile(finalized);
      onClose();
    }
  };

  const handleSaveAndExit = () => {
    onSaveProfile({
      ...formData,
      onboardingStep: currentStep,
    });
    onClose();
  };

  const handleFinishAndInvite = () => {
    const finalized = {
      ...formData,
      onboardingCompleted: true,
      onboardingStep: 3,
    };
    onSaveProfile(finalized);
    onClose();
    if (onOpenInviteClient) {
      onOpenInviteClient();
    } else if (onInviteClient) {
      onInviteClient();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#10151F]/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-[#ECEFF3] shadow-[0_20px_60px_rgba(16,21,31,0.18)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">

        {/* Header with Step Tracker */}
        <div className="p-6 sm:p-7 border-b border-[#F2F5F8] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="u-eyebrow">
                Clinician Onboarding
              </span>
              <span className="text-xs font-mono text-[#9AA4B2]">
                Step {currentStep} of 3
              </span>
            </div>
            <h2 className="text-2xl font-serif font-semibold text-[#10151F] mt-1.5">
              {currentStep === 1 && 'Clinician Identity & Credentials'}
              {currentStep === 2 && 'Modalities & Specializations'}
              {currentStep === 3 && 'Practice Ready & Client Setup'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#9AA4B2] hover:text-[#10151F] hover:bg-[#F1F5F9] transition-colors self-end sm:self-auto cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 h-1.5 bg-[#F2F5F8] border-b border-[#F2F5F8]">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-full transition-colors ${
                step <= currentStep ? 'bg-[#0D9488]' : 'bg-[#F2F5F8]'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 max-h-[68vh] overflow-y-auto space-y-6">

          {/* STEP 1: IDENTITY & CREDENTIALS */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <p className="text-sm sm:text-base text-[#6B7686] font-serif leading-relaxed">
                Provide your clinical credentials and licensing information. These are used in confidential documentation, intake consent notes, and clinical session metadata.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">
                    Full Clinician Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Elena Vance"
                    className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">
                    Professional Title / Degree
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Licensed Clinical Psychologist"
                    className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">
                    Post-Nominals / Degree Designations
                  </label>
                  <input
                    type="text"
                    value={formData.credentials}
                    onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                    placeholder="e.g. Psy.D., LMFT, LCSW"
                    className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">
                    License # & Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="e.g. PSY-884920-CA"
                    className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">
                    Practice / Clinic Name
                  </label>
                  <input
                    type="text"
                    value={formData.practiceName}
                    onChange={(e) => setFormData({ ...formData, practiceName: e.target.value })}
                    placeholder="e.g. Mindful Practice Clinic"
                    className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">
                    Direct Clinical Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. dr.vance@clinic.org"
                    className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* PRACTICE LOGO & BRANDING */}
              <div className="p-5 bg-white rounded-2xl border border-[#ECEFF3] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F5F8] pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-[#0D9488]" />
                      <h4 className="u-eyebrow">
                        Practice Logo & Clinic Branding
                      </h4>
                    </div>
                    <p className="text-xs text-[#6B7686] mt-0.5">
                      Upload your practice logo. This custom branding appears in your top navigation, client portal invitations, and clinical briefings.
                    </p>
                  </div>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-xs font-medium text-[#BE123C] hover:text-[#9F1239] flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
                      title="Remove current logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left: Active Logo Preview & Context Lockup */}
                  <div className="md:col-span-4 p-4 rounded-xl bg-[#F7F9FB] border border-[#ECEFF3] flex flex-col items-center text-center space-y-3">
                    <span className="u-eyebrow">
                      Live Branding Preview
                    </span>

                    {formData.logoUrl ? (
                      <div className="relative group">
                        <img
                          src={formData.logoUrl}
                          alt="Practice Logo Preview"
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover border border-[#ECEFF3] bg-white"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0D9488] rounded-full text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] border border-dashed border-[#DCE2EA] flex flex-col items-center justify-center text-[#9AA4B2]">
                        <ImageIcon className="w-6 h-6 text-[#9AA4B2]" />
                        <span className="text-[9px] font-mono mt-0.5">No Logo</span>
                      </div>
                    )}

                    <div className="w-full">
                      <p className="text-xs font-serif font-semibold text-[#10151F] truncate">
                        {formData.practiceName || 'Mindful Practice Clinic'}
                      </p>
                      <p className="text-[10px] text-[#6B7686] truncate">
                        {formData.name || 'Dr. Elena Vance'}
                      </p>
                    </div>

                    <div className="w-full pt-2 border-t border-[#F2F5F8] flex items-center justify-center space-x-2">
                      <span className="text-[10px] text-[#6B7686]">Navigation Avatar:</span>
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Avatar mini"
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover border border-[#ECEFF3]"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#F1FAF9] text-[#0F766E] text-[10px] font-serif font-semibold flex items-center justify-center">
                          {formData.name ? formData.name[0] : 'U'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Upload Trigger Only */}
                  <div className="md:col-span-8 space-y-4">
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                        id="therapist-logo-file-input"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 bg-white hover:bg-[#F7F9FB] border border-dashed border-[#DCE2EA] hover:border-[#0D9488] rounded-xl flex flex-col items-center justify-center space-y-2 transition-all text-xs font-medium text-[#10151F] cursor-pointer group"
                      >
                        <Upload className="w-6 h-6 text-[#0D9488] group-hover:scale-110 transition-transform" />
                        <span>Upload Custom Logo (PNG, SVG, JPG, WebP up to 5MB)</span>
                        <span className="text-[11px] text-[#6B7686] font-normal">
                          Only your custom practice logo and name will be displayed across the workspace and client portal
                        </span>
                      </button>
                    </div>

                    {logoUploadError && (
                      <p className="text-xs text-[#BE123C] font-medium">{logoUploadError}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F9FB] border border-[#ECEFF3] flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                <div className="text-xs text-[#3A4453] leading-relaxed">
                  <span className="font-semibold text-[#10151F]">Confidential Practice Boundary:</span> Your licensing information and practice details remain securely stored in your private browser sandbox and are never shared publicly.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MODALITIES & CLINICAL FOCUS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="u-eyebrow mb-1">
                  Primary Therapeutic Modalities
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7686] mb-3">
                  Select the clinical frameworks you employ in your practice. These calibrate pre-session journey summaries and intervention tracking.
                </p>

                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_MODALITIES.map((mod) => {
                    const isSelected = formData.modalities.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModality(mod)}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-2 border cursor-pointer ${
                          isSelected
                            ? 'bg-[#F1FAF9] border-[#0D9488] text-[#0F766E]'
                            : 'bg-white border-[#ECEFF3] text-[#3A4453] hover:border-[#DCE2EA]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0D9488]" />}
                        <span>{mod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F2F5F8]">
                <h3 className="u-eyebrow mb-1">
                  Caseload Specializations & Presenting Concerns
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7686] mb-3">
                  Identify your primary clinical areas of focus to tailor longitudinal pattern detection.
                </p>

                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SPECIALIZATIONS.map((spec) => {
                    const isSelected = formData.specializations.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-2 border cursor-pointer ${
                          isSelected
                            ? 'bg-[#F1FAF9] border-[#0D9488] text-[#0F766E]'
                            : 'bg-white border-[#ECEFF3] text-[#3A4453] hover:border-[#DCE2EA]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0D9488]" />}
                        <span>{spec}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRACTICE READY & LAUNCHPAD */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-[#F1FAF9] border border-[#CCE9E6] space-y-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-semibold text-[#0F766E]">
                      Onboarding Configuration Complete
                    </h3>
                    <p className="text-xs sm:text-sm text-[#0F766E]/80">
                      Your custom practice profile is verified and ready.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-[#ECEFF3] text-xs">
                    <span className="text-[#6B7686] block">Clinician</span>
                    <span className="font-medium text-[#10151F] truncate">{formData.name}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#ECEFF3] text-xs">
                    <span className="text-[#6B7686] block">Practice</span>
                    <span className="font-medium text-[#10151F] truncate">{formData.practiceName}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#ECEFF3] text-xs flex items-center space-x-2.5">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo"
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-lg object-cover border border-[#ECEFF3] shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#F1FAF9] text-[#0F766E] flex items-center justify-center font-semibold text-xs shrink-0">
                        {formData.practiceName ? formData.practiceName[0] : (formData.name ? formData.name[0] : 'P')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[#6B7686] block text-[10px]">Practice Logo</span>
                      <span className="font-medium text-[#0F766E] text-xs truncate block">
                        {formData.logoUrl ? 'Uploaded Logo' : 'Practice Monogram'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#ECEFF3] text-xs">
                    <span className="text-[#6B7686] block">Modalities</span>
                    <span className="font-medium text-[#10151F]"><span className="font-mono tabular-nums">{formData.modalities.length}</span> active</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#ECEFF3] space-y-4">
                <h4 className="text-sm font-serif font-semibold text-[#10151F]">
                  Next Recommended Action: Connect Your First Client
                </h4>
                <p className="text-xs sm:text-sm text-[#6B7686] leading-relaxed">
                  Send a secure client invite to connect their between-session companion. They will receive an intake questionnaire, informed consent, and confidential journaling portal.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleFinishAndInvite}
                    className="u-btn-primary justify-center"
                  >
                    <UserPlus className="w-4 h-4 text-[#2DD4BF]" />
                    <span>Invite Client Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="u-btn-ghost justify-center"
                  >
                    <span>Go to Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-5 sm:p-6 border-t border-[#F2F5F8] bg-white flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="u-btn-ghost"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#6B7686] hover:text-[#10151F] transition-colors cursor-pointer"
            >
              Save & Exit
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              className="u-btn-primary"
            >
              <span>{currentStep === 3 ? 'Finish Onboarding' : 'Continue'}</span>
              {currentStep < 3 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
