import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, Square, Upload, Loader2, Check, ShieldCheck } from 'lucide-react';
import { therapistApi } from '../../api';

/*
 * SessionRecorder — the therapist records (or uploads) the in-person session for
 * a client. Audio is streamed to the backend for transcription and never stored.
 * Two ways in: live mic recording, or upload an existing audio file. On submit we
 * POST /sessions with the client_id and poll the session's processing status.
 */
const MIME = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(
  (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t)
) || '';
const extFor = (m: string) => (m.includes('mp4') ? 'm4a' : m.includes('ogg') ? 'ogg' : 'webm');

const STAGES = ['uploaded', 'transcribing', 'transcribed', 'understanding', 'ready'];
const STAGE_LABEL: Record<string, string> = {
  uploaded: 'Uploaded', transcribing: 'Transcribing…', transcribed: 'Transcribed',
  understanding: 'Understanding the session…', ready: 'Ready', failed: 'Failed',
};

function fmt(s: number) { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }

export const SessionRecorder: React.FC<{
  clientId: string; clientName: string; onClose: () => void; onDone?: () => void;
}> = ({ clientId, clientName, onClose, onDone }) => {
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'recording' | 'uploading' | 'tracking'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState('');

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const pollRef = useRef<any>(null);

  useEffect(() => () => { // cleanup on unmount
    clearInterval(timerRef.current); clearInterval(pollRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, MIME ? { mimeType: MIME } : undefined);
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.start(1000);
      recRef.current = rec;
      setSeconds(0); setPhase('recording');
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch { setError('Microphone access was blocked. Allow it, or upload a file instead.'); }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    const rec = recRef.current;
    if (!rec) return;
    rec.onstop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: MIME || 'audio/webm' });
      submit(blob, `session.${extFor(MIME)}`);
    };
    rec.stop();
  }

  async function submit(blob: Blob, filename: string) {
    setPhase('uploading'); setError('');
    try {
      const res = await therapistApi.uploadSession(clientId, blob, filename, new Date().toISOString());
      const id = res.id;
      setPhase('tracking'); setStatus('uploaded');
      pollRef.current = setInterval(async () => {
        try {
          const s = await therapistApi.session(id);
          const st = s?.session?.status || s?.status || 'uploaded';
          setStatus(st);
          if (st === 'ready' || st === 'failed') {
            clearInterval(pollRef.current);
            if (st === 'ready') { onDone?.(); }
            else setError('Processing failed. You can try again.');
          }
        } catch { /* keep polling */ }
      }, 3000);
    } catch (e: any) {
      setPhase('idle');
      setError(e?.data?.error || e?.message || 'Upload failed. Please try again.');
    }
  }

  function onFile(file?: File) {
    if (!file) return;
    if (!consent) { setError('Please confirm client consent first.'); return; }
    submit(file, file.name);
  }

  const stageIdx = STAGES.indexOf(status);
  const inp = 'w-full';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(16,21,31,0.45)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl border border-[#ECEFF3] shadow-[0_24px_64px_rgba(16,21,31,0.18)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2F5F8]">
          <div>
            <h2 className="text-[17px] font-serif font-semibold text-[#10151F]">Record session</h2>
            <p className="text-[12px] text-[#6B7686]">with {clientName}</p>
          </div>
          <button onClick={onClose} className="text-[#9AA4B2] hover:text-[#10151F]"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5">
          {phase === 'tracking' ? (
            <div className="py-2">
              <p className="text-[14px] font-medium text-[#10151F] mb-3">{STAGE_LABEL[status] || 'Processing…'}</p>
              <div className="space-y-2">
                {STAGES.map((st, i) => (
                  <div key={st} className="flex items-center gap-2 text-[13px]">
                    {i < stageIdx || status === 'ready' ? <Check className="w-4 h-4 text-[#0F766E]" />
                      : i === stageIdx ? <Loader2 className="w-4 h-4 text-[#0D9488] animate-spin" />
                      : <span className="w-4 h-4 rounded-full border border-[#E0E5EC] inline-block" />}
                    <span style={{ color: i <= stageIdx ? '#10151F' : '#9AA4B2' }}>{STAGE_LABEL[st]}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#9AA4B2] mt-4">Audio is transcribed and discarded — never stored. You can close this; processing continues.</p>
              {status === 'ready' && <button onClick={onClose} className="u-btn-primary w-full justify-center mt-4">Done</button>}
            </div>
          ) : (
            <>
              <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span className="text-[13px] text-[#3A4453] leading-snug">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488] inline mr-1" />
                  {clientName} has consented to this session being recorded for continuity of care.
                </span>
              </label>

              {phase === 'recording' ? (
                <button onClick={stopRecording} className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-white font-semibold" style={{ background: '#B0332F' }}>
                  <Square className="w-5 h-5" /> Stop &amp; process · {fmt(seconds)}
                </button>
              ) : (
                <button onClick={() => (consent ? startRecording() : setError('Please confirm client consent first.'))}
                  disabled={phase === 'uploading'} className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-semibold disabled:opacity-50"
                  style={{ background: 'var(--accent, #0D9488)', color: '#fff' }}>
                  {phase === 'uploading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                  {phase === 'uploading' ? 'Uploading…' : 'Start recording'}
                </button>
              )}

              <div className="flex items-center gap-3 my-4"><span className="flex-1 h-px bg-[#ECEFF3]" /><span className="text-[11px] text-[#9AA4B2]">or</span><span className="flex-1 h-px bg-[#ECEFF3]" /></div>

              <label className={`${inp} flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#D8E0E8] py-3 text-[13px] text-[#3A4453] cursor-pointer hover:border-[#0D9488]`}>
                <Upload className="w-4 h-4 text-[#0D9488]" /> Upload an audio file
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} disabled={phase === 'uploading'} />
              </label>
              <p className="text-[11px] text-[#9AA4B2] mt-3">Audio is transcribed and discarded — never stored.</p>
            </>
          )}
          {error && <p className="text-[12px] text-[#B0332F] mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
};
