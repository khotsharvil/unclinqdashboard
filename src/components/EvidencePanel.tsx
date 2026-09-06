import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  MessageSquare, 
  Mic, 
  Activity, 
  CheckCircle2, 
  Quote, 
  Search, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  Highlighter 
} from 'lucide-react';
import { EvidenceGroup, EvidenceItem } from '../types';

interface EvidencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceGroup: EvidenceGroup | null;
  clientName: string;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  isOpen,
  onClose,
  evidenceGroup,
  clientName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [highlightKeywords, setHighlightKeywords] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  if (!isOpen || !evidenceGroup) return null;

  const clinicalKeywords = [
    'sleeping', 'sleep', 'overthinking', 'stress', 'work-related', 'anxiety', 
    'breathing', 'reframing', 'overwhelmed', 'deadline', 'disengaging', 'panic',
    'heart rate', 'tightness', 'perfectionism', 'standup', 'presentation'
  ];

  const getSourceIcon = (source: EvidenceItem['source']) => {
    switch (source) {
      case 'Journal':
        return <BookOpen className="w-3.5 h-3.5 text-[#0F766E]" />;
      case 'Emora':
        return <MessageSquare className="w-3.5 h-3.5 text-[#4338CA]" />;
      case 'Voice':
        return <Mic className="w-3.5 h-3.5 text-[#0D9488]" />;
      case 'Check-in':
        return <Activity className="w-3.5 h-3.5 text-[#6B7686]" />;
      case 'Exercise':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E]" />;
      default:
        return <Quote className="w-3.5 h-3.5 text-[#6B7686]" />;
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePlayVoice = (id: string) => {
    if (playingVoiceId === id) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(id);
    }
  };

  // Filter items
  const filteredItems = evidenceGroup.items.filter((item) => {
    const matchesSearch = searchQuery === '' || 
      item.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.context && item.context.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSource = selectedSource === 'all' || item.source.toLowerCase() === selectedSource.toLowerCase();

    return matchesSearch && matchesSource;
  });

  // Source options present in this group
  const availableSources: string[] = Array.from(new Set(evidenceGroup.items.map(i => i.source as string)));

  // Highlight helper
  const renderHighlightedSnippet = (text: string) => {
    if (!highlightKeywords) return text;

    const regex = new RegExp(`\\b(${clinicalKeywords.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = clinicalKeywords.some(k => k.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark
            key={i}
            className="bg-[#F1FAF9] text-[#0F766E] px-1 py-0.5 rounded font-medium"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#10151F]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 pl-4 max-w-full flex">
        <div className="w-screen max-w-xl bg-white border-l border-[#ECEFF3] shadow-[0_8px_40px_rgba(16,21,31,0.10)] flex flex-col transform transition-transform ease-out duration-300 animate-in slide-in-from-right">

          {/* Panel Header */}
          <div className="px-6 sm:px-8 py-6 bg-white border-b border-[#ECEFF3] flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 u-eyebrow">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]"></span>
                <span>Longitudinal Evidence · {clientName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#10151F] tracking-tight pt-1">
                {evidenceGroup.title}
              </h2>
              {evidenceGroup.subtitle && (
                <p className="text-[13px] text-[#6B7686]">
                  {evidenceGroup.subtitle}
                </p>
              )}
            </div>

            <button
              id="close-evidence-panel-btn"
              onClick={onClose}
              className="p-2.5 rounded-lg text-[#6B7686] hover:text-[#10151F] hover:bg-[#F7F9FB] transition-colors -mr-2 cursor-pointer"
              title="Close panel (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="px-6 sm:px-8 py-4 bg-white border-b border-[#ECEFF3] space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#9AA4B2]" />
                <input
                  type="text"
                  placeholder="Filter evidence moments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg text-sm font-medium text-[#10151F] placeholder-[#9AA4B2] focus:outline-none focus:bg-white focus:border-[#0D9488] transition-colors"
                />
              </div>

              {/* Keyword Highlight Toggle */}
              <button
                onClick={() => setHighlightKeywords(!highlightKeywords)}
                className={`px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors border cursor-pointer font-medium ${
                  highlightKeywords
                    ? 'bg-[#F1FAF9] border-[#ECEFF3] text-[#0F766E]'
                    : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:border-[#DCE2EA]'
                }`}
                title="Toggle clinical keywords highlighting"
              >
                <Highlighter className="w-4 h-4" />
                <span className="hidden sm:inline">Keywords</span>
              </button>
            </div>

            {/* Source Pills */}
            {availableSources.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto text-sm pb-0.5">
                <button
                  onClick={() => setSelectedSource('all')}
                  className={`px-3.5 py-1.5 rounded-lg transition-colors font-medium border cursor-pointer ${
                    selectedSource === 'all'
                      ? 'bg-[#10151F] border-[#10151F] text-white'
                      : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:text-[#10151F] hover:border-[#DCE2EA]'
                  }`}
                >
                  All (<span className="font-mono tabular-nums">{evidenceGroup.items.length}</span>)
                </button>
                {availableSources.map((source) => (
                  <button
                    key={source}
                    onClick={() => setSelectedSource(source)}
                    className={`px-3.5 py-1.5 rounded-lg transition-colors capitalize font-medium border cursor-pointer ${
                      selectedSource.toLowerCase() === source.toLowerCase()
                        ? 'bg-[#10151F] border-[#10151F] text-white'
                        : 'bg-white border-[#ECEFF3] text-[#6B7686] hover:text-[#10151F] hover:border-[#DCE2EA]'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Items List */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-4 bg-white">
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center text-sm text-[#6B7686] space-y-2 bg-[#FCFDFE] border border-[#ECEFF3] rounded-2xl p-8">
                <p className="font-serif">No matching evidence items found.</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[#0F766E] hover:text-[#0D9488] font-medium underline cursor-pointer transition-colors"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            ) : (
              filteredItems.map((item) => {
                const isVoice = item.source === 'Voice';
                const isPlaying = playingVoiceId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-[#ECEFF3] space-y-3.5 u-card-hover group"
                  >
                    {/* Item Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="p-1.5 rounded-lg bg-[#F7F9FB] border border-[#ECEFF3]">
                          {getSourceIcon(item.source)}
                        </span>
                        <span className="text-sm font-serif font-semibold text-[#10151F]">
                          {item.source}
                        </span>
                        <span className="text-xs text-[#C3CBD6]">·</span>
                        <span className="text-xs sm:text-sm font-mono text-[#6B7686] tabular-nums">
                          {item.date}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleCopy(item.id, item.snippet)}
                          className="p-1.5 text-[#9AA4B2] hover:text-[#10151F] rounded transition-colors cursor-pointer"
                          title="Copy text snippet"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-[#0F766E]" />
                          ) : (
                            <Copy className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Audio snippet player if Voice */}
                    {isVoice && (
                      <div className="p-3.5 rounded-xl bg-[#F1FAF9] border border-[#ECEFF3] flex items-center space-x-3">
                        <button
                          onClick={() => togglePlayVoice(item.id)}
                          className="w-9 h-9 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-xs shrink-0 hover:bg-[#0F766E] transition-colors cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-sm text-[#0F766E] font-medium">
                            <span>{isPlaying ? 'Playing audio clip...' : 'Voice Reflection'}</span>
                            <span className="font-mono tabular-nums">0:42</span>
                          </div>
                          {/* Visual waveform mockup */}
                          <div className="flex items-center gap-1 h-3.5">
                            {[40, 60, 30, 80, 100, 50, 70, 90, 40, 60, 85, 95, 45, 30, 70, 80, 60, 40, 20].map((h, i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all ${
                                  isPlaying && i < 8 ? 'bg-[#0D9488]' : 'bg-[#CFEDEA]'
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Snippet Blockquote */}
                    <blockquote className="text-base sm:text-lg text-[#10151F] leading-relaxed font-serif pl-3 border-l-2 border-[#0D9488] font-normal">
                      “{renderHighlightedSnippet(item.snippet)}”
                    </blockquote>

                    {item.context && (
                      <div className="text-[13px] text-[#6B7686] pt-2 border-t border-[#F2F5F8] font-serif flex items-center justify-between">
                        <span>{item.context}</span>
                        <span className="text-xs text-[#9AA4B2]">Grounded snippet</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div className="px-6 sm:px-8 py-5 bg-white border-t border-[#ECEFF3] flex items-center justify-between text-sm text-[#6B7686]">
            <span className="text-[13px]">
              <span className="font-mono tabular-nums">{filteredItems.length}</span> of <span className="font-mono tabular-nums">{evidenceGroup.items.length}</span> moments verified
            </span>
            <button
              onClick={onClose}
              className="u-btn-primary"
            >
              Done reading
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
