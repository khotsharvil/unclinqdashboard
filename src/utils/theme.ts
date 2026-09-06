export interface AvatarTheme {
  bg: string;
  border: string;
  text: string;
  ring: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accent: string;
}

export const getClientAvatarTheme = (clientId: string): AvatarTheme => {
  switch (clientId) {
    case 'meera-shah':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#0D9488]',
        text: 'text-[#0F766E]',
        ring: 'ring-[#0D9488]/20',
        badgeBg: 'bg-[#FFFFFF]',
        badgeText: 'text-[#0F766E]',
        badgeBorder: 'border-[#0D9488]/40',
        accent: '#0D9488',
      };
    case 'aarav-patil':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#2563EB]',
        text: 'text-[#1D4ED8]',
        ring: 'ring-[#2563EB]/20',
        badgeBg: 'bg-[#FFFFFF]',
        badgeText: 'text-[#1D4ED8]',
        badgeBorder: 'border-[#2563EB]/40',
        accent: '#2563EB',
      };
    case 'riya-sen':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#E11D48]',
        text: 'text-[#BE123C]',
        ring: 'ring-[#E11D48]/20',
        badgeBg: 'bg-[#FFFFFF]',
        badgeText: 'text-[#BE123C]',
        badgeBorder: 'border-[#E11D48]/40',
        accent: '#E11D48',
      };
    case 'david-kim':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#D97706]',
        text: 'text-[#B45309]',
        ring: 'ring-[#D97706]/20',
        badgeBg: 'bg-[#FFFFFF]',
        badgeText: 'text-[#B45309]',
        badgeBorder: 'border-[#D97706]/40',
        accent: '#D97706',
      };
    case 'elena-ortiz':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#16A34A]',
        text: 'text-[#15803D]',
        ring: 'ring-[#16A34A]/20',
        badgeBg: 'bg-[#FFFFFF]',
        badgeText: 'text-[#15803D]',
        badgeBorder: 'border-[#16A34A]/40',
        accent: '#16A34A',
      };
    case 'sam-chen':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#0284C7]',
        text: 'text-[#0369A1]',
        ring: 'ring-[#0284C7]/20',
        badgeBg: 'bg-[#FFFFFF]',
        badgeText: 'text-[#0369A1]',
        badgeBorder: 'border-[#0284C7]/40',
        accent: '#0284C7',
      };
    default:
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#64748B]',
        text: 'text-[#0F172A]',
        ring: 'ring-[#0F172A]/20',
        badgeBg: 'bg-[#FFFFFF]',
        badgeText: 'text-[#0F172A]',
        badgeBorder: 'border-[#CBD5E1]',
        accent: '#0F172A',
      };
  }
};

/**
 * Returns color classes for different action lifecycle states
 */
export const getActionStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#16A34A]',
        text: 'text-[#15803D]',
        dot: 'bg-[#16A34A]',
        label: 'Completed',
      };
    case 'in_progress':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#0D9488]',
        text: 'text-[#0F766E]',
        dot: 'bg-[#0D9488]',
        label: 'In Progress',
      };
    case 'partial':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#D97706]',
        text: 'text-[#B45309]',
        dot: 'bg-[#D97706]',
        label: 'Partial Attempt',
      };
    case 'blocked':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#E11D48]',
        text: 'text-[#BE123C]',
        dot: 'bg-[#E11D48]',
        label: 'Blocked / Avoided',
      };
    default:
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#2563EB]',
        text: 'text-[#1D4ED8]',
        dot: 'bg-[#2563EB]',
        label: 'Planned',
      };
  }
};

/**
 * Returns color classes for evidence data modalities
 */
export const getEvidenceTypeColor = (type: string) => {
  switch (type) {
    case 'journal':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#0D9488]',
        text: 'text-[#0F766E]',
        dot: 'bg-[#0D9488]',
        label: 'Journal Entry',
      };
    case 'somatic':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#D97706]',
        text: 'text-[#B45309]',
        dot: 'bg-[#D97706]',
        label: 'Somatic Log',
      };
    case 'action':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#16A34A]',
        text: 'text-[#15803D]',
        dot: 'bg-[#16A34A]',
        label: 'Action Tracker',
      };
    case 'audio':
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#0284C7]',
        text: 'text-[#0369A1]',
        dot: 'bg-[#0284C7]',
        label: 'Session Audio',
      };
    default:
      return {
        bg: 'bg-[#FFFFFF]',
        border: 'border-[#CBD5E1]',
        text: 'text-[#334155]',
        dot: 'bg-[#64748B]',
        label: 'Clinical Context',
      };
  }
};
