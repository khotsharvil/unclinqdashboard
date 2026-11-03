import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Mic, Square, PenLine } from 'lucide-react';
import { therapistApi } from '../../api';

// "Add your take": right after the session, while it's being processed, the therapist
// can speak (or type) their own read: impressions, what they noticed, what to try next.
// The summary waits for it (or for Skip). Private: never shown to the client, and only
// their explicit plan can reach Emora.

const MAX_SEC = 5 * 60;
type Stage = 'offer' | 'recording' | 'typing' | 'saving' | 'added' | 'skipped';

export const TherapistNoteStep: React.FC<{ sessionId: string; micId?: string; onSettled?: () => void }> = ({ sessionId, micId, onSettled }) => {
  const [stage, setStage] = useState<Stage>('offer');
  const [secs, setSecs] = useState(0);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<any>(null);
  const cancelled = useRef(false);

  const cleanup = () => {
    clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => () => { cancelled.current = true; try { rec.current?.stop(); } catch { /* */ } cleanup(); }, []);

  const send = async (body: { blob?: Blob; text?: string }) => {
    setStage('saving'); setError('');
    try {
      const r = await therapistApi.addTherapistNote(sessionId, body);
      setSaved(r.therapist_note || body.text || '');
      setStage('added'); onSettled?.();
    } catch (e: any) {
      setError(e?.data?.error || 'Couldn’t save your note. Try again, type it, or skip.');
      setStage('offer');
    }
  };

  const start = async () => {
    setError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: micId ? { deviceId: { exact: micId } } : true });
      stream.current = s;
      chunks.current = [];
      const mr = new MediaRecorder(s);
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' });
        cleanup();
        if (!cancelled.current && blob.size) send({ blob });
      };
      rec.current = mr;
      mr.start();
      setSecs(0); setStage('recording');
      timer.current = setInterval(() => setSecs((n) => {
        if (n + 1 >= MAX_SEC) { try { mr.stop(); } catch { /* */ } }
        return n + 1;
      }), 1000);
    } catch {
      setError('We couldn’t open the microphone. You can type your take instead.');
    }
  };
  const stop = () => { try { rec.current?.stop(); } catch { /* */ } };
  const cancel = () => { cancelled.current = true; stop(); cleanup(); cancelled.current = false; setStage('offer'); };
  const skip = async () => {
    setStage('skipped');
    try { await therapistApi.skipNote(sessionId); } catch { /* the 30-min timeout still covers it */ }
    onSettled?.();
  };

  if (stage === 'skipped') return null;
  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const btn = 'inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-lg cursor-pointer';

  return (
    <div className="mb-5 rounded-xl border border-[#CDEBE7] bg-[#F7FCFB] p-4">
      {stage === 'added' ? (
        <div className="space-y-1.5">
          <p className="text-[13px] font-semibold text-[#0F766E] flex items-center gap-1.5"><Check className="w-4 h-4" /> Your take is saved</p>
          <p className="text-[12px] text-[#6B7686]">The summary will include it. Only you can see it.</p>
          {saved && <p className="text-[13px] text-[#3A4453] line-clamp-3">“{saved}”</p>}
        </div>
      ) : (
        <>
          <p className="text-[14px] font-semibold text-[#10151F]">Add your take <span className="font-normal text-[#9AA4B2]">(optional)</span></p>
          <p className="text-[12px] text-[#6B7686] mt-0.5">
            1 to 5 minutes, in your own words: what you noticed, your read, what to try next. The summary waits for it. Only you see it; the client never does.
          </p>

          {stage === 'offer' && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button onClick={start} className={`${btn} text-white`} style={{ background: '#0D9488' }}><Mic className="w-4 h-4" /> Start talking</button>
              <button onClick={() => setStage('typing')} className={`${btn} border border-[#E2E7EE] bg-white text-[#3A4453]`}><PenLine className="w-4 h-4" /> Type instead</button>
              <button onClick={skip} className="text-[13px] text-[#6B7686] hover:text-[#10151F] cursor-pointer ml-auto">Skip</button>
            </div>
          )}

          {stage === 'recording' && (
            <div className="flex items-center gap-3 mt-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse" />
              <span className="font-mono text-[14px] text-[#10151F] tabular-nums">{mmss}</span>
              <span className="text-[12px] text-[#9AA4B2]">up to 5:00</span>
              <button onClick={stop} className={`${btn} text-white ml-auto`} style={{ background: '#10151F' }}><Square className="w-3.5 h-3.5" /> Done</button>
              <button onClick={cancel} className="text-[13px] text-[#6B7686] cursor-pointer">Cancel</button>
            </div>
          )}

          {stage === 'typing' && (
            <div className="mt-3 space-y-2">
              <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={4}
                className="w-full rounded-lg border border-[#E2E7EE] bg-white px-3 py-2 text-[14px] text-[#10151F] focus:outline-none focus:border-[#0D9488]"
                placeholder="Your impressions, what you noticed, what to work on next time…" />
              <div className="flex items-center gap-2">
                <button disabled={!text.trim()} onClick={() => send({ text: text.trim() })} className={`${btn} text-white disabled:opacity-40`} style={{ background: '#0D9488' }}>Save</button>
                <button onClick={() => setStage('offer')} className="text-[13px] text-[#6B7686] cursor-pointer">Back</button>
                <button onClick={skip} className="text-[13px] text-[#6B7686] hover:text-[#10151F] cursor-pointer ml-auto">Skip</button>
              </div>
            </div>
          )}

          {stage === 'saving' && (
            <p className="mt-3 text-[13px] text-[#6B7686] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-[#0D9488]" /> Saving your take…</p>
          )}
          {error && <p className="mt-2 text-[12px] text-[#B42318]">{error}</p>}
        </>
      )}
    </div>
  );
};
