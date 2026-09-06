import { TherapistProfile } from '../types';

export const PRACTICE_LOGO_PRESETS = [
  {
    id: 'lotus',
    name: 'Mindful Lotus',
    description: 'Somatic grounding & mindfulness balance',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%230F766E"/><path d="M50 22 C42 36 34 46 34 58 C34 67 41 74 50 74 C59 74 66 67 66 58 C66 46 58 36 50 22 Z" fill="%23FFFFFF" fill-opacity="0.95"/><path d="M50 40 C44 48 38 56 38 64 C38 71 43 76 50 76 C57 76 62 71 62 64 C62 56 56 48 50 40 Z" fill="%230D9488"/><circle cx="50" cy="56" r="5" fill="%23CCFBF1"/></svg>'
  },
  {
    id: 'growth',
    name: 'Resilient Branch',
    description: 'Longitudinal growth & cognitive change',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%23065F46"/><path d="M50 78 V30 M50 52 C42 46 36 46 32 48 M50 40 C58 34 64 34 68 36 M50 62 C42 58 36 60 30 64 M50 50 C58 46 64 48 70 52" stroke="%23A7F3D0" stroke-width="4.5" stroke-linecap="round"/><circle cx="50" cy="24" r="5" fill="%23FFFFFF"/></svg>'
  },
  {
    id: 'neuro',
    name: 'Neural Clarity',
    description: 'Evidence-based cognitive networks & synthesis',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%231E293B"/><circle cx="50" cy="35" r="7" fill="%23818CF8"/><circle cx="32" cy="62" r="7" fill="%2338BDF8"/><circle cx="68" cy="62" r="7" fill="%23A78BFA"/><path d="M50 35 L32 62 M50 35 L68 62 M32 62 L68 62" stroke="%23E2E8F0" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 3"/><circle cx="50" cy="53" r="4" fill="%23FFFFFF"/></svg>'
  },
  {
    id: 'monogram',
    name: 'Clinical Crest',
    description: 'Authoritative private practice typography',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%230F172A"/><text x="50" y="65" text-anchor="middle" font-family="serif" font-size="44" font-weight="bold" fill="%23F8FAFC">M</text><circle cx="50" cy="20" r="3.5" fill="%230D9488"/></svg>'
  }
];

export const INITIAL_THERAPIST_PROFILE: TherapistProfile = {
  name: 'Dr. Elena Vance',
  title: 'Licensed Clinical Psychologist',
  credentials: 'Psy.D., ABPP',
  licenseNumber: 'PSY-884920-CA',
  email: 'dr.vance@mindfulpractice.health',
  phone: '(415) 890-2341',
  practiceName: 'Mindful Practice Clinic',
  logoUrl: PRACTICE_LOGO_PRESETS[0].url,
  modalities: [
    'Cognitive Behavioral Therapy (CBT)',
    'Acceptance & Commitment Therapy (ACT)',
    'Somatic Integration',
    'Mindfulness-Based Cognitive Therapy (MBCT)'
  ],
  specializations: [
    'Work & Burnout',
    'Sleep & Insomnia',
    'Anxiety & Rumination',
    'High-Performance Stress'
  ],
  defaultSessionDuration: '50 min',
  briefingPrepTime: '2 hours before session',
  separateInterpretation: true,
  somaticEmphasis: true,
  onboardingCompleted: true,
  onboardingStep: 4,
};

export const AVAILABLE_MODALITIES = [
  'Cognitive Behavioral Therapy (CBT)',
  'Acceptance & Commitment Therapy (ACT)',
  'Somatic Integration & Experiencing',
  'Mindfulness-Based (MBCT / MBSR)',
  'Psychodynamic & Relational',
  'Dialectical Behavior Therapy (DBT)',
  'Internal Family Systems (IFS)',
  'EMDR & Trauma-Informed',
  'Solution-Focused Brief Therapy (SFBT)',
  'Emotion-Focused Therapy (EFT)',
];

export const AVAILABLE_SPECIALIZATIONS = [
  'Work & Burnout',
  'Sleep Disruption & Insomnia',
  'Anxiety & Rumination',
  'Depression & Mood Dysregulation',
  'Trauma & PTSD Recovery',
  'Life & Career Transitions',
  'Executive & High-Stress Demands',
  'Grief & Chronic Loss',
  'Interpersonal & Relational Patterns',
];
