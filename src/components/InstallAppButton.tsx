import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { canPromptInstall, isIOS, isStandalone, onInstallAvailabilityChange, promptInstall } from '../pwa';

// "Add to home screen" for the therapist dashboard. One-tap install where the
// browser supports it (Chrome/Edge/Android/desktop); manual steps on iOS Safari.
export const InstallAppButton: React.FC = () => {
  const [, force] = useState(0);
  const [showIOS, setShowIOS] = useState(false);
  useEffect(() => onInstallAvailabilityChange(() => force((n) => n + 1)), []);

  if (isStandalone()) return null; // already installed
  const ios = isIOS();
  if (!canPromptInstall() && !ios) return null; // no install path on this browser

  return (
    <>
      <button
        onClick={async () => { if (canPromptInstall()) { await promptInstall(); } else { setShowIOS(true); } }}
        className="inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-lg border border-[#DCE6E6] text-[#0F766E] font-medium hover:border-[#0D9488] hover:bg-[#F1FAF9] transition-colors cursor-pointer"
        title="Install Unclinq as an app"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Install app</span>
      </button>

      {showIOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowIOS(false)}>
          <div className="bg-white rounded-2xl border border-[#ECEFF3] max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-serif font-semibold text-[#10151F]">Add Unclinq to your home screen</h3>
              <button onClick={() => setShowIOS(false)} className="p-1 text-[#9AA4B2] hover:text-[#10151F] cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[13px] text-[#6B7686] mb-4">On iPhone/iPad, install Unclinq from Safari:</p>
            <ol className="space-y-3">
              {[
                <>Tap the <b>Share</b> button <span className="inline-block align-middle px-1.5 py-0.5 rounded border border-[#ECEFF3] bg-[#FAFBFC]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/></svg></span> in Safari's toolbar.</>,
                <>Scroll down and tap <b>Add to Home Screen</b>.</>,
                <>Tap <b>Add</b> — Unclinq now opens like an app.</>,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-[#3A4453]">
                  <span className="shrink-0 inline-flex items-center justify-center rounded-full text-white font-semibold" style={{ width: 22, height: 22, fontSize: 12, background: '#0D9488' }}>{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
};
