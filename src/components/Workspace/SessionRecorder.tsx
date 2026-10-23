import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, Square, Upload, Loader2, Check, ShieldCheck, MonitorSmartphone, Users, AlertTriangle } from 'lucide-react';
import { therapistApi } from '../../api';
import { LevelTracker, ACTIVE_LEVEL, isHeadsetMic, isBluetoothMic } from './levelTracker';

/*
 * SessionRecorder — the therapist records (or uploads) a session for a client.
 * Audio is streamed to the backend for transcription and never stored.
 * Three ways in:
 *   • In person  — the mic in the room captures both people.
 *   • Online call — captures the meeting TAB's audio (the client, over Meet/Zoom)
 *                   + the therapist's mic, mixed into one recording.
 *   • Upload      — an existing audio file (e.g. a Meet/Zoom recording).
 * Live meters show each source is actually being heard (a headset mic in the
 * room, or an unticked "Share tab audio", would otherwise only show up as a
 * half-empty briefing). Online recordings also upload a loudness timeline so
 * the backend labels therapist vs client by source, not by guesswork.
 * On submit we POST /sessions with the client_id and poll the processing status.
 */
const MIME = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(
  (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t)
) || '';
const extFor = (m: string) => (m.includes('mp4') ? 'm4a' : m.includes('ogg') ? 'ogg' : 'webm');
// Online capture needs getDisplayMedia (desktop browsers). iOS Safari lacks it.
const CAN_CAPTURE_TAB = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;

const STAGES = ['uploaded', 'transcribing', 'transcribed', 'understanding', 'ready'];
const STAGE_LABEL: Record<string, string> = {
  uploaded: 'Uploaded', transcribing: 'Transcribing…', transcribed: 'Transcribed',
  understanding: 'Understanding the session…', ready: 'Ready', failed: 'Failed',
};

const NOT_HEARD_SEC = 15;   // warn if a source has been silent since recording began
const WENT_QUIET_SEC = 90;  // warn if a source that was working goes quiet this long
const PSEUDO_MICS = ['default', 'communications'];
const micKey = (mode: string) => `unclinq.recorder.mic.${mode}`;

function fmt(s: number) { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }

// The OS default mic: Chrome lists it as a 'default' pseudo-device; elsewhere it's the first one.
function defaultMicLabel(list: MediaDeviceInfo[]) {
  const d = list.find((x) => x.deviceId === 'default') || list[0];
  return (d?.label || '').replace(/^Default\s*-\s*/i, '');
}

// Pick a mic for this mode: the therapist's saved choice, else the system default —
// except in person, where a headset/earbuds default would only hear the therapist.
function chooseMic(list: MediaDeviceInfo[], mode: string): string {
  let saved = '';
  try { saved = localStorage.getItem(micKey(mode)) || ''; } catch { /* noop */ }
  if (saved && list.some((d) => d.deviceId === saved)) return saved;
  if (mode === 'inperson' && isHeadsetMic(defaultMicLabel(list))) {
    const room = list.find((d) => !PSEUDO_MICS.includes(d.deviceId) && !isHeadsetMic(d.label));
    if (room) return room.deviceId;
  }
  return '';
}

const Meter: React.FC<{ label: string; level: number }> = ({ label, level }) => {
  const pct = Math.max(0, Math.min(100, ((level - 20) / 50) * 100));
  const live = level >= ACTIVE_LEVEL;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-24 shrink-0 text-[12px] text-[#3A4453]">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#ECEFF3] overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${pct}%`, background: live ? '#0D9488' : '#9AA4B2' }} />
      </div>
    </div>
  );
};

const Warning: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 rounded-lg bg-[#FFF7EB] border border-[#F3DDB8] px-3 py-2 text-[12px] text-[#8A5A12] leading-snug">
    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>{children}</span>
  </div>
);

export const SessionRecorder: React.FC<{
  clientId: string; clientName: string; onClose: () => void; onDone?: () => void;
}> = ({ clientId, clientName, onClose, onDone }) => {
  const [consent, setConsent] = useState(false);
  const [mode, setMode] = useState<'inperson' | 'online'>('inperson');
  const [phase, setPhase] = useState<'idle' | 'recording' | 'uploading' | 'tracking'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [micId, setMicId] = useState('');        // '' = system default
  const [micReady, setMicReady] = useState(false);
  const [levels, setLevels] = useState<number[]>([0, 0]); // [call/client, mic]

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);       // the stream being recorded (mic, or mixed)
  const displayStreamRef = useRef<MediaStream | null>(null); // the shared tab (online mode)
  const micStreamRef = useRef<MediaStream | null>(null);     // the therapist mic (also the pre-record check)
  const audioCtxRef = useRef<AudioContext | null>(null);     // mixer + meters
  const trackerRef = useRef<LevelTracker | null>(null);
  const heardRef = useRef([false, false]);                   // has each source been heard this recording
  const lastActiveRef = useRef([0, 0]);                      // when each source was last heard (ms)
  const userPickedRef = useRef(false);
  const timerRef = useRef<any>(null);
  const pollRef = useRef<any>(null);
  const live = useRef({ mode, micId, micReady, phase });
  live.current = { mode, micId, micReady, phase };

  function stopMic() {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    trackerRef.current?.setSource(1, null);
  }

  function teardownStreams() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    stopMic();
    trackerRef.current?.close();
    try { audioCtxRef.current?.close(); } catch { /* noop */ }
    streamRef.current = null; displayStreamRef.current = null; audioCtxRef.current = null; trackerRef.current = null;
  }

  async function ensureAudio() {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtxRef.current = new Ctx();
    }
    const ctx = audioCtxRef.current!;
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    if (!trackerRef.current) {
      const t = await LevelTracker.create(ctx);
      if (t) {
        t.onLevels = (lv) => {
          setLevels(lv);
          const now = Date.now();
          lv.forEach((v, k) => { if (v >= ACTIVE_LEVEL) { heardRef.current[k] = true; lastActiveRef.current[k] = now; } });
        };
        trackerRef.current = t;
      }
    }
    return ctx;
  }

  async function refreshDevices() {
    const all = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
    const mics = all.filter((d) => d.kind === 'audioinput');
    setDevices(mics);
    return mics;
  }

  // Open (or switch) the therapist's mic and feed it to the meter.
  async function openMic(id: string) {
    stopMic();
    const mic = await navigator.mediaDevices.getUserMedia({ audio: id ? { deviceId: { exact: id } } : true });
    micStreamRef.current = mic;
    await ensureAudio();
    trackerRef.current?.setSource(1, mic);
    return mic;
  }

  // "Check microphone": get permission (so device names are visible), pick the right mic, show its meter.
  async function enableMic() {
    setError('');
    try {
      await openMic(micId);
      const list = await refreshDevices();
      const id = userPickedRef.current ? micId : chooseMic(list, mode);
      if (id !== micId) { setMicId(id); await openMic(id); }
      setMicReady(true);
    } catch {
      setError('Microphone access was blocked. Allow it, or upload a file instead.');
    }
  }

  function pickMic(id: string) {
    userPickedRef.current = true;
    try { localStorage.setItem(micKey(mode), id); } catch { /* noop */ }
    setMicId(id);
    if (micReady) openMic(id).catch(() => setError('Couldn’t open that microphone. Try another one.'));
  }

  function switchMode(m: 'inperson' | 'online') {
    setMode(m); setError('');
    if (userPickedRef.current || !devices.length) return;
    const id = chooseMic(devices, m);
    if (id !== micId) {
      setMicId(id);
      if (micReady) openMic(id).catch(() => {});
    }
  }

  useEffect(() => {
    // Mic already allowed → open it right away so the meter is live before Start.
    (navigator as any).permissions?.query({ name: 'microphone' })
      .then((p: PermissionStatus) => { if (p.state === 'granted') enableMic(); })
      .catch(() => { /* Firefox etc. — the "Check microphone" button covers it */ });

    // Earbuds connected/disconnected mid-setup: refresh the list, and if our mic vanished, re-pick.
    const onChange = async () => {
      const list = await refreshDevices();
      const { micId: cur, micReady: ready, phase: ph, mode: md } = live.current;
      if (cur && !list.some((d) => d.deviceId === cur)) {
        const id = chooseMic(list, md);
        setMicId(id);
        if (ready && ph === 'idle') openMic(id).catch(() => {});
      }
    };
    navigator.mediaDevices?.addEventListener?.('devicechange', onChange);

    return () => { // cleanup on unmount
      navigator.mediaDevices?.removeEventListener?.('devicechange', onChange);
      clearInterval(timerRef.current); clearInterval(pollRef.current);
      teardownStreams();
    };
  }, []);

  function beginRecording(recordStream: MediaStream) {
    streamRef.current = recordStream;
    chunksRef.current = [];
    heardRef.current = [false, false];
    lastActiveRef.current = [0, 0];
    const rec = new MediaRecorder(recordStream, MIME ? { mimeType: MIME } : undefined);
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.start(1000);
    recRef.current = rec;
    setSeconds(0); setPhase('recording');
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function startRecording() {
    setError('');
    if (mode === 'online') {
      try {
        // 1) The meeting tab's audio (the client, over Meet/Zoom). Chrome shows the
        //    audio option only when video is requested too — we drop the video track.
        const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true } as any);
        displayStreamRef.current = display;
        display.getVideoTracks().forEach((t) => t.stop());
        const tabAudio = display.getAudioTracks();
        if (!tabAudio.length) {
          display.getTracks().forEach((t) => t.stop());
          displayStreamRef.current = null;
          setError('No call audio was shared. Start again and tick the audio box — “Share tab audio” for a browser tab, or “Share system audio” for the Entire Screen (desktop app).');
          return;
        }
        // 2) The therapist's mic (already open from the mic check, or open it now).
        const mic = micStreamRef.current?.active ? micStreamRef.current : await openMic(micId);
        setMicReady(true);
        // 3) Mix both into one recordable stream, and meter each on its own.
        const ctx = await ensureAudio();
        const dest = ctx.createMediaStreamDestination();
        const tab = new MediaStream([tabAudio[0]]);
        ctx.createMediaStreamSource(tab).connect(dest);
        ctx.createMediaStreamSource(mic).connect(dest);
        trackerRef.current?.setSource(0, tab);
        trackerRef.current?.startTimeline();
        // If the therapist ends screen-share from the browser bar, stop cleanly.
        tabAudio[0].onended = () => { if (recRef.current && recRef.current.state !== 'inactive') stopRecording(); };
        beginRecording(dest.stream);
      } catch {
        displayStreamRef.current?.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
        setError('Screen sharing was cancelled or blocked. Start again, pick the meeting tab, and tick “Share tab audio”.');
      }
      return;
    }
    // In-person: the room mic captures both people.
    try {
      const mic = micStreamRef.current?.active ? micStreamRef.current : await openMic(micId);
      setMicReady(true);
      beginRecording(mic);
    } catch { setError('Microphone access was blocked. Allow it, or upload a file instead.'); }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    const rec = recRef.current;
    if (!rec || rec.state === 'inactive') return;
    const levelsTimeline = mode === 'online' ? trackerRef.current?.takeTimeline() ?? null : null;
    rec.onstop = () => {
      teardownStreams();
      const blob = new Blob(chunksRef.current, { type: MIME || 'audio/webm' });
      submit(blob, `session.${extFor(MIME)}`, levelsTimeline);
    };
    rec.stop();
  }

  // In demo mode there's no backend to accept the audio — simulate the pipeline so
  // the feature is fully demoable (the real path below runs unchanged in prod).
  const DEMO = (import.meta as any).env?.VITE_DEMO === '1';

  async function submit(blob: Blob, filename: string, levelsTimeline: string | null = null) {
    setPhase('uploading'); setError('');
    if (DEMO) {
      setPhase('tracking');
      let i = 0;
      setStatus(STAGES[0]);
      pollRef.current = setInterval(() => {
        i += 1;
        if (i < STAGES.length) { setStatus(STAGES[i]); }
        else { clearInterval(pollRef.current); setStatus('ready'); onDone?.(); }
      }, 1100);
      return;
    }
    try {
      const res = await therapistApi.uploadSession(clientId, blob, filename, new Date().toISOString(), levelsTimeline);
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

  // Which mic is in use, by name — for the headset warnings.
  const micLabel = micId ? (devices.find((d) => d.deviceId === micId)?.label || '') : defaultMicLabel(devices);
  const micChoices = devices.filter((d) => !PSEUDO_MICS.includes(d.deviceId));

  // Live problems while recording: a source never heard, or gone quiet.
  const recWarnings: string[] = [];
  if (phase === 'recording' && trackerRef.current) {
    const quietFor = (k: number) => (Date.now() - lastActiveRef.current[k]) / 1000;
    if (mode === 'online') {
      if (!heardRef.current[0] && seconds >= NOT_HEARD_SEC) recWarnings.push(`We can’t hear ${clientName} from the call yet. If they’ve been talking, stop, start again, and tick “Share tab audio” (or “Share system audio” for the desktop app).`);
      else if (heardRef.current[0] && quietFor(0) >= WENT_QUIET_SEC) recWarnings.push('No sound from the call for over a minute. Is the call still on?');
    }
    if (!heardRef.current[1] && seconds >= NOT_HEARD_SEC) recWarnings.push(mode === 'online'
      ? 'We can’t hear your mic. It may be muted, or not the one you’re speaking into. Stop and pick the same mic you use in Meet/Zoom.'
      : 'We can’t hear anything from the mic. Check it isn’t muted, then stop and start again.');
    else if (heardRef.current[1] && quietFor(1) >= WENT_QUIET_SEC) recWarnings.push('The mic has been silent for over a minute. Did your earbuds disconnect?');
  }

  const stageIdx = STAGES.indexOf(status);
  const inp = 'w-full';
  const modeBtn = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
      active ? 'bg-white text-[#0F766E] shadow-sm border border-[#DCE6E6]' : 'text-[#6B7686] hover:text-[#10151F]'
    }`;

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
              {/* Mode toggle — hidden while recording so it can't be switched mid-session */}
              {phase !== 'recording' && CAN_CAPTURE_TAB && (
                <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-[#F4F6F9]">
                  <button className={modeBtn(mode === 'inperson')} onClick={() => switchMode('inperson')}>
                    <Users className="w-4 h-4" /> In person
                  </button>
                  <button className={modeBtn(mode === 'online')} onClick={() => switchMode('online')}>
                    <MonitorSmartphone className="w-4 h-4" /> Online call
                  </button>
                </div>
              )}

              <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span className="text-[13px] text-[#3A4453] leading-snug">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488] inline mr-1" />
                  {clientName} has consented to this session being recorded for continuity of care.
                </span>
              </label>

              {mode === 'online' && phase !== 'recording' && (
                <div className="mb-4 rounded-xl bg-[#F1FAF9] border border-[#D6EDEA] px-3.5 py-3 text-[12px] text-[#0F766E] leading-relaxed">
                  <p className="font-semibold mb-1">Recording an online call — when the picker opens:</p>
                  <ul className="space-y-1 list-disc pl-4">
                    <li><b>Call in a browser tab</b> (Meet/Zoom in Chrome): pick the <b>tab</b> and tick <b>“Share tab audio”</b>.</li>
                    <li><b>Zoom / Meet desktop app</b>: pick <b>“Entire Screen”</b> and tick <b>“Share system audio”</b>.</li>
                  </ul>
                  <p className="mt-1.5">Unclinq records the client’s voice from the call plus your mic. Nothing is stored — only the transcript.</p>
                </div>
              )}

              {/* Microphone: pick it, and see it's actually hearing you before you start */}
              {phase !== 'recording' && (
                <div className="mb-4 space-y-2.5">
                  {!micReady ? (
                    <button onClick={enableMic} className="u-btn-ghost w-full justify-center">
                      <Mic className="w-4 h-4" /> Check microphone
                    </button>
                  ) : (
                    <>
                      <select value={micId} onChange={(e) => pickMic(e.target.value)}
                        className="w-full bg-[#F7F9FB] border border-[#ECEFF3] rounded-lg px-3.5 py-2.5 text-sm text-[#10151F] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors cursor-pointer">
                        <option value="">System default{defaultMicLabel(devices) ? ` (${defaultMicLabel(devices)})` : ''}</option>
                        {micChoices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${i + 1}`}</option>)}
                      </select>
                      {trackerRef.current && <Meter label="Your mic" level={levels[1]} />}
                      {mode === 'inperson' && isHeadsetMic(micLabel) && (
                        <Warning>This looks like a headset or earbuds mic. In the room it mostly hears you, not {clientName}. Pick your laptop or phone mic instead.</Warning>
                      )}
                      {mode === 'online' && (
                        <p className="text-[11px] text-[#6B7686]">
                          Pick the same mic you use in Meet/Zoom.
                          {isBluetoothMic(micLabel) && ' Bluetooth mics record at phone-call quality, so wired earphones give a cleaner transcript of your side.'}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {phase === 'recording' && trackerRef.current && (
                <div className="mb-4 space-y-2.5">
                  {mode === 'online' && <Meter label={`${clientName.split(' ')[0]} (call)`} level={levels[0]} />}
                  <Meter label={mode === 'online' ? 'You (mic)' : 'Room mic'} level={levels[1]} />
                  {recWarnings.map((w) => <Warning key={w}>{w}</Warning>)}
                </div>
              )}

              {phase === 'recording' ? (
                <button onClick={stopRecording} className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-white font-semibold" style={{ background: '#B0332F' }}>
                  <Square className="w-5 h-5" /> Stop &amp; process · {fmt(seconds)}
                </button>
              ) : (
                <button onClick={() => (consent ? startRecording() : setError('Please confirm client consent first.'))}
                  disabled={phase === 'uploading'} className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-semibold disabled:opacity-50"
                  style={{ background: 'var(--accent, #0D9488)', color: '#fff' }}>
                  {phase === 'uploading' ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'online' ? <MonitorSmartphone className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {phase === 'uploading' ? 'Uploading…' : mode === 'online' ? 'Share call & record' : 'Start recording'}
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
