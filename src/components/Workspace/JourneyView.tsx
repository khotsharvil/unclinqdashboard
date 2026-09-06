import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Plus,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Flag,
} from 'lucide-react';
import { Client, TherapyJourneyTrack, TherapyWeekStep, EvidenceGroup } from '../../types';

interface JourneyViewProps {
  client: Client;
  onOpenEvidence: (evidenceGroup: EvidenceGroup) => void;
  onAddJourneyStep?: (trackId: string, newStep: Partial<TherapyWeekStep>) => void;
}

export const JourneyView: React.FC<JourneyViewProps> = ({
  client,
  onOpenEvidence,
  onAddJourneyStep,
}) => {
  const tracks: TherapyJourneyTrack[] = client.therapyJourneys && client.therapyJourneys.length > 0
    ? client.therapyJourneys
    : [
        {
          id: 'default-track',
          title: client.journeyPatterns?.[0]?.name || 'Longitudinal Therapeutic Progress',
          subtitle: 'Evolution of coping skills and therapeutic response over time',
          evidenceGroupId: client.journeyPatterns?.[0]?.evidenceGroupId || 'ev-default',
          supportingMomentsCount: client.journeyPatterns?.[0]?.supportingMomentsCount || 4,
          observedPeriod: `${client.journeyPatterns?.[0]?.firstObserved || 'Aug 05'} → ${client.journeyPatterns?.[0]?.lastObserved || 'Today'} (4 Weeks)`,
          steps: [
            {
              week: 'Week 1',
              phaseTitle: 'Baseline',
              dateRange: 'Week 1',
              therapeuticFocus: {
                title: 'Challenge / Baseline',
                detail: client.journeyPatterns?.[0]?.name || 'Primary presenting concern',
              },
              intervention: {
                name: 'Initial assessment & psychoeducation',
                description: 'Mapping triggers and baseline somatic responses.',
              },
              clientApplication: {
                attemptsCount: 1,
                details: 'Initial reflection logged.',
              },
              clientResponse: {
                verbatimQuote: client.journeyPatterns?.[0]?.clientResponse || 'Early stage engagement.',
                summary: 'Baseline awareness established.',
              },
              observedChange: {
                from: 'Unconscious automatic reaction',
                to: 'Initial identification of pattern',
                summary: 'Baseline established.',
              },
            },
            {
              week: 'Week 2',
              phaseTitle: 'Awareness',
              dateRange: 'Week 2',
              therapeuticFocus: {
                title: 'Therapeutic focus',
                detail: 'Trigger recognition',
              },
              intervention: {
                name: client.journeyPatterns?.[0]?.intervention?.name || 'Coping protocol',
                description: client.journeyPatterns?.[0]?.intervention?.description || 'Active intervention.',
              },
              clientApplication: {
                attemptsCount: client.journeyPatterns?.[0]?.applied?.attemptsCount || 2,
                details: 'Applying intervention in high-stress moments.',
              },
              clientResponse: {
                verbatimQuote: client.journeyPatterns?.[0]?.clientResponse || 'Noticing pattern earlier.',
                summary: 'Increased self-monitoring.',
              },
              observedChange: {
                from: 'Experiencing pattern automatically',
                to: 'Recognising when it starts',
                summary: 'From automatic reaction → recognizing when it starts',
              },
            },
          ],
          synthesis: {
            dimensions: [
              {
                label: 'Awareness',
                trend: 'up',
                statusText: 'Improving',
                description: 'Recognises triggers earlier across recent sessions.',
              },
              {
                label: 'Skill application',
                trend: 'up',
                statusText: 'Emerging',
                description: 'Applying introduced interventions more consistently.',
              },
              {
                label: 'Underlying pattern',
                trend: 'stable',
                statusText: 'Persistent',
                description: 'Underlying triggers remain active in high-pressure contexts.',
              },
            ],
            overallTrajectory: 'Gradual progress',
            therapeuticImplication: 'Therapy appears to be improving recognition and coping, while the underlying trigger remains persistent.',
          },
        },
      ];

  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const currentTrack = tracks[activeTrackIndex] || tracks[0];

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newWeekTitle, setNewWeekTitle] = useState('Week 5');
  const [newPhaseTitle, setNewPhaseTitle] = useState('Integration');
  const [newFocus, setNewFocus] = useState('');
  const [newIntervention, setNewIntervention] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [newObservedChange, setNewObservedChange] = useState('');

  const handleOpenEvidenceDrawer = () => {
    const groupId = currentTrack.evidenceGroupId;
    const group = client.evidenceStore[groupId] || {
      id: groupId,
      title: `${currentTrack.title} — Supporting Evidence`,
      items: [],
    };
    onOpenEvidence(group);
  };

  const handleCreateStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFocus.trim()) return;

    if (onAddJourneyStep) {
      onAddJourneyStep(currentTrack.id, {
        week: newWeekTitle.trim(),
        phaseTitle: newPhaseTitle.trim(),
        dateRange: 'Current Cycle',
        therapeuticFocus: { title: 'Therapeutic focus', detail: newFocus.trim() },
        intervention: {
          name: newIntervention.trim() || 'Adaptive Coping Strategy',
          description: 'Refined intervention for current therapeutic phase.',
        },
        clientApplication: { attemptsCount: 1, details: 'Active in-session and between-session practice.' },
        clientResponse: {
          verbatimQuote: newResponse.trim() || 'Client reports continued practice.',
          summary: 'Reported during clinical review.',
        },
        observedChange: { summary: newObservedChange.trim() || 'Progressing toward integrated coping.' },
      });
    }

    setShowAddStepModal(false);
    setNewFocus('');
    setNewIntervention('');
    setNewResponse('');
    setNewObservedChange('');
  };

  const trendMeta = (trend: string) => {
    if (trend === 'up') return { arrow: '↑', dot: '#0D9488', text: '#0F766E' };
    if (trend === 'stable') return { arrow: '→', dot: '#9AA4B2', text: '#6B7686' };
    return { arrow: '↓', dot: '#E11D48', text: '#BE123C' };
  };

  const steps = currentTrack.steps;
  const activeStep = selectedWeek ?? -1; // -1 = clean roadmap, nothing open

  // ---- Winding roadmap geometry ----
  const n = steps.length;
  const marginY = 8;
  const pts = steps.map((_, i) => ({
    // gentle zig-zag that alternates sides but varies in width — not a rigid symmetrical zig-zag
    x: 50 + (i % 2 === 0 ? -1 : 1) * (12 + 4 * Math.sin(i * 0.9 + 1)),
    y: n === 1 ? 50 : marginY + (100 - 2 * marginY) * (i / (n - 1)),
  }));
  // Catmull-Rom spline → soft, natural curves that ease through every stop
  const smooth = (arr: { x: number; y: number }[]) => {
    if (!arr.length) return '';
    if (arr.length < 2) return `M ${arr[0].x} ${arr[0].y}`;
    let d = `M ${arr[0].x} ${arr[0].y}`;
    for (let i = 0; i < arr.length - 1; i++) {
      const p0 = arr[i - 1] || arr[i];
      const p1 = arr[i];
      const p2 = arr[i + 1];
      const p3 = arr[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
    }
    return d;
  };
  const roadPath = smooth(pts);
  const mapHeight = Math.max(360, n * 66);
  const ZOOM = 1.9;
  const activePt = activeStep >= 0 && activeStep < steps.length ? pts[activeStep] : null;

  const detailBody = (step: TherapyWeekStep) => (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA4B2] mb-1">What we focused on</div>
        <p className="text-[15px] font-serif font-semibold text-[#10151F] leading-snug">{step.therapeuticFocus.detail}</p>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA4B2] mb-1">What we tried</div>
        <p className="text-[14px] font-serif font-semibold text-[#10151F] leading-snug">{step.intervention.name}</p>
        {step.intervention.description && (
          <p className="text-[13px] text-[#6B7686] leading-relaxed mt-0.5">{step.intervention.description}</p>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA4B2]">In your words</div>
          {step.clientApplication?.attemptsCount !== undefined && (
            <span className="text-[11px] font-mono text-[#6B7686] bg-[#F4F6F9] px-2 py-0.5 rounded">
              <span className="tabular-nums">{step.clientApplication.attemptsCount}</span>× practised
            </span>
          )}
        </div>
        <blockquote className="text-[15px] font-serif italic text-[#10151F] leading-[1.55] pl-3.5 border-l-2 border-[#0D9488]">
          “{step.clientResponse.verbatimQuote}”
        </blockquote>
      </div>
      <div className="rounded-lg bg-[#F1FAF9] px-4 py-3">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-[#0D9488]" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#0F766E]">What shifted</span>
        </div>
        {step.observedChange.from && step.observedChange.to ? (
          <p className="text-[14px] font-serif leading-[1.5] flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[#9AA4B2]">{step.observedChange.from}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
            <span className="text-[#10151F] font-semibold">{step.observedChange.to}</span>
          </p>
        ) : (
          <p className="text-[14px] font-serif font-semibold text-[#10151F] leading-[1.5]">{step.observedChange.summary}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 u-eyebrow">
            <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Therapy journey</span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-serif font-semibold text-[#10151F] tracking-tight leading-tight">
            {client.name.split(' ')[0]}’s therapy journey
          </h1>
          <p className="text-[14px] text-[#6B7686]">
            Week by week — what you’ve worked on together, and what’s changing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button onClick={handleOpenEvidenceDrawer} className="text-[13px] font-medium text-[#6B7686] hover:text-[#0F766E] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#F1FAF9] transition-colors cursor-pointer">
            <BookOpen className="w-4 h-4 text-[#0D9488]" />
            <span><span className="font-mono tabular-nums">{currentTrack.supportingMomentsCount}</span> moments</span>
          </button>
          <button onClick={() => setShowAddStepModal(true)} className="u-btn-primary">
            <Plus className="w-4 h-4" />
            <span>Add update</span>
          </button>
        </div>
      </div>

      {/* Track switcher */}
      {tracks.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto">
          {tracks.map((tr, idx) => (
            <button
              key={tr.id}
              onClick={() => setActiveTrackIndex(idx)}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTrackIndex === idx
                  ? 'bg-[#EEF1F5] text-[#10151F]'
                  : 'text-[#6B7686] hover:text-[#10151F] hover:bg-[#F4F6F9]'
              }`}
            >
              {tr.title}
            </button>
          ))}
        </div>
      )}

      {/* ============ THE ANSWER — trajectory synthesis, up top ============ */}
      <section className="bg-white rounded-2xl border border-[#ECEFF3] overflow-hidden">
        <div className="px-6 sm:px-8 py-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[12px] font-semibold tracking-wide text-[#9AA4B2]">How things are changing</h2>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0F766E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
              {currentTrack.synthesis.overallTrajectory}
            </span>
          </div>
          <p className="text-[19px] sm:text-[21px] font-serif text-[#10151F] leading-[1.55] tracking-tight">
            {currentTrack.synthesis.therapeuticImplication}
          </p>
        </div>

        {/* Dimensions — compact scannable columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[#F2F5F8] divide-y md:divide-y-0 md:divide-x divide-[#F2F5F8]">
          {currentTrack.synthesis.dimensions.map((dim, dIdx) => {
            const t = trendMeta(dim.trend);
            return (
              <div key={dIdx} className="px-6 sm:px-8 py-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-semibold text-[#10151F]">{dim.label}</span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: t.text }}>
                    {dim.statusText}
                    <span className="text-[13px]">{t.arrow}</span>
                  </span>
                </div>
                <p className="text-[13px] text-[#6B7686] leading-[1.5]">{dim.description}</p>
              </div>
            );
          })}
        </div>

        <div className="px-6 sm:px-8 py-3.5 border-t border-[#F2F5F8] flex items-center gap-1.5 text-[12px] text-[#9AA4B2]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
          <span>Based on your check-ins and sessions between appointments</span>
        </div>
      </section>

      {/* ============ THE JOURNEY — rising path + focused milestone ============ */}
      <section className="bg-white rounded-2xl border border-[#ECEFF3] px-6 sm:px-8 py-7">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-semibold tracking-wide text-[#9AA4B2]">The journey so far</h2>
          <span className="text-[12px] text-[#9AA4B2] font-mono">{currentTrack.observedPeriod}</span>
        </div>

        {/* Organic roadmap — tap a stop to zoom into that week */}
        <div className="pt-2">
          <div className="relative w-full overflow-hidden rounded-xl bg-[#FCFDFE]" style={{ height: mapHeight }}>
            {/* Zoomable map layer */}
            <div
              className="absolute inset-0 transition-transform duration-500 ease-out"
              style={{
                transformOrigin: '0 0',
                transform: activePt
                  ? `translate(${(0.5 - (activePt.x / 100) * ZOOM) * 100}%, ${(0.24 - (activePt.y / 100) * ZOOM) * 100}%) scale(${ZOOM})`
                  : 'none',
              }}
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2FBCAD" />
                    <stop offset="100%" stopColor="#0E8378" />
                  </linearGradient>
                </defs>
                {/* road bed */}
                <path d={roadPath} fill="none" stroke="#CFEDE9" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {/* the route */}
                <path d={roadPath} fill="none" stroke="url(#roadGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {/* dashed centre line */}
                <path d={roadPath} fill="none" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 6" opacity="0.85" vectorEffect="non-scaling-stroke" />
              </svg>

              {pts.map((p, i) => {
                const isCurrent = i === steps.length - 1;
                const isActive = i === activeStep;
                const leftLane = p.x < 50;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedWeek(isActive ? -1 : i)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    title={`${steps[i].week} · ${steps[i].phaseTitle}`}
                  >
                    <span className="relative flex items-center justify-center">
                      {isCurrent && <Flag className="absolute -top-7 w-4 h-4 text-[#0F766E]" fill="#CFF3EE" />}
                      <span className={`grid place-items-center rounded-full w-7 h-7 font-mono tabular-nums text-[11px] text-white bg-[#0D9488] ring-2 ring-white shadow-[0_2px_6px_rgba(13,148,136,0.4)] transition-transform ${isActive ? 'scale-[1.18]' : 'hover:scale-110'}`}>
                        {i + 1}
                      </span>
                      <span className={`hidden sm:block absolute w-32 transition-opacity ${leftLane ? 'right-full mr-3 text-right' : 'left-full ml-3 text-left'} ${activeStep >= 0 ? 'opacity-0' : 'opacity-100'}`}>
                        <span className="block text-[12px] font-mono font-semibold text-[#10151F]">{steps[i].week}{isCurrent ? ' · here' : ''}</span>
                        <span className="block text-[11px] font-serif text-[#6B7686] truncate">{steps[i].phaseTitle}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tap the map to close */}
            {activePt && <div className="absolute inset-0 z-20" onClick={() => setSelectedWeek(-1)} />}

            {/* Zoomed week — bottom sheet */}
            {activePt && (
              <div className="absolute left-0 right-0 bottom-0 z-30 bg-white border-t border-[#ECEFF3] shadow-[0_-12px_40px_rgba(16,21,31,0.10)] p-5 sm:p-6 max-h-[74%] overflow-y-auto animate-in slide-in-from-bottom-3 fade-in duration-300">
                <div className="flex items-start gap-2.5 mb-4">
                  <span className="w-6 h-6 rounded-full grid place-items-center font-mono text-[11px] tabular-nums bg-[#0D9488] text-white shrink-0 mt-0.5">{activeStep + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[18px] font-serif font-semibold text-[#10151F] tracking-tight">{steps[activeStep].week}</h3>
                      {activeStep === steps.length - 1 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />you are here
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] text-[#6B7686] mt-0.5">{steps[activeStep].phaseTitle}</div>
                  </div>
                  <button onClick={() => setSelectedWeek(-1)} className="ml-auto -m-1 p-1 text-[#9AA4B2] hover:text-[#10151F] transition-colors cursor-pointer shrink-0" title="Close">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {detailBody(steps[activeStep])}

                {/* How far you've come — compare against where you started */}
                {activeStep > 0 && steps[0].observedChange.from && (
                  <div className="mt-4 pt-4 border-t border-[#F2F5F8]">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9AA4B2] mb-1.5">How far you’ve come</div>
                    <p className="text-[13px] leading-[1.55] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[#9AA4B2]">Week 1 · {steps[0].observedChange.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                      <span className="text-[#10151F] font-medium">{steps[activeStep].week} · {steps[activeStep].observedChange.to || steps[activeStep].observedChange.summary}</span>
                    </p>
                  </div>
                )}

                {/* Step between weeks to compare */}
                <div className="mt-4 pt-3 border-t border-[#F2F5F8] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedWeek(Math.max(0, activeStep - 1))}
                    disabled={activeStep === 0}
                    className="text-[13px] font-medium text-[#6B7686] hover:text-[#0F766E] flex items-center gap-1 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Earlier week</span>
                  </button>
                  <span className="text-[11px] font-mono text-[#9AA4B2] tabular-nums">{activeStep + 1} / {steps.length}</span>
                  <button
                    onClick={() => setSelectedWeek(Math.min(steps.length - 1, activeStep + 1))}
                    disabled={activeStep === steps.length - 1}
                    className="text-[13px] font-medium text-[#6B7686] hover:text-[#0F766E] flex items-center gap-1 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
                  >
                    <span>Next week</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hint */}
          {!activePt && (
            <p className="text-center text-[12px] text-[#9AA4B2] mt-3">Tap any stop to open that week · earlier weeks show how far you’ve come</p>
          )}
        </div>
      </section>

      {/* Modal: Log Week Step */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#10151F]/40 backdrop-blur-xs" onClick={() => setShowAddStepModal(false)} />
          <div className="relative w-full max-w-lg bg-white border border-[#ECEFF3] rounded-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150 shadow-[0_20px_60px_rgba(16,21,31,0.18)]">
            <div>
              <h2 className="text-xl font-serif font-semibold text-[#10151F]">Add a weekly update</h2>
              <p className="text-[13px] text-[#6B7686] mt-0.5">
                Capture what you focused on, what was tried, and what changed.
              </p>
            </div>

            <form onSubmit={handleCreateStep} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">Week label</label>
                  <input
                    type="text"
                    required
                    value={newWeekTitle}
                    onChange={(e) => setNewWeekTitle(e.target.value)}
                    placeholder="e.g. Week 5"
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">Phase title</label>
                  <input
                    type="text"
                    required
                    value={newPhaseTitle}
                    onChange={(e) => setNewPhaseTitle(e.target.value)}
                    placeholder="e.g. Behavioral generalization"
                    className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">What we focused on</label>
                <input
                  type="text"
                  required
                  value={newFocus}
                  onChange={(e) => setNewFocus(e.target.value)}
                  placeholder="What is being worked on this week?"
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">What we tried</label>
                <input
                  type="text"
                  value={newIntervention}
                  onChange={(e) => setNewIntervention(e.target.value)}
                  placeholder="What did the therapist introduce or adapt?"
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">In your words</label>
                <input
                  type="text"
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="e.g. “I caught the thought twice before opening laptop.”"
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#3A4453] mb-1.5">What shifted</label>
                <input
                  type="text"
                  value={newObservedChange}
                  onChange={(e) => setNewObservedChange(e.target.value)}
                  placeholder="e.g. From experiencing rumination automatically → recognizing when it starts"
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowAddStepModal(false)} className="u-btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="u-btn-primary">
                  Save update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
