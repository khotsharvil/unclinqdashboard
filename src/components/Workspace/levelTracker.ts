/*
 * LevelTracker — measures how loud each recording source is, every 250 ms.
 * Input 0 = the meeting tab (the client, online mode); input 1 = the therapist's mic.
 *
 * Runs in an AudioWorklet (the audio thread), so it keeps ticking while the
 * therapist is on the Meet tab and this tab is in the background — timers here
 * would be throttled. Drives the live meters and, in online mode, a loudness
 * timeline uploaded with the audio so the backend can tell who spoke when.
 * Levels are dB above -80 dBFS: 0 = silence, 80 = full scale.
 */

export const FRAME_MS = 250;
export const ACTIVE_LEVEL = 30; // ≥ -50 dBFS — someone is speaking on that source

const WORKLET = `
class LevelMeter extends AudioWorkletProcessor {
  constructor() { super(); this.sums = [0, 0]; this.n = 0; this.frame = Math.round(sampleRate * ${FRAME_MS} / 1000); }
  process(inputs) {
    let len = 128;
    for (let k = 0; k < 2; k++) {
      const d = inputs[k] && inputs[k][0];
      if (!d) continue;
      len = d.length;
      let s = 0;
      for (let i = 0; i < d.length; i++) s += d[i] * d[i];
      this.sums[k] += s;
    }
    this.n += len;
    if (this.n >= this.frame) {
      const lv = this.sums.map((s) => {
        const db = 10 * Math.log10(s / this.n + 1e-12);
        return Math.max(0, Math.min(80, Math.round(db + 80)));
      });
      this.port.postMessage(lv);
      this.sums = [0, 0]; this.n = 0;
    }
    return true;
  }
}
registerProcessor('unclinq-level-meter', LevelMeter);
`;

const workletLoaded = new WeakMap<AudioContext, Promise<void>>();

export class LevelTracker {
  private node: AudioWorkletNode;
  private sink: GainNode;
  private sources: (MediaStreamAudioSourceNode | null)[] = [null, null];
  private timeline: number[][] | null = null;
  onLevels: ((lv: number[]) => void) | null = null;

  private constructor(private ctx: AudioContext) {
    this.node = new AudioWorkletNode(ctx, 'unclinq-level-meter', { numberOfInputs: 2, numberOfOutputs: 1 });
    // The worklet only runs while connected to the rendered graph — route it to a muted sink.
    this.sink = ctx.createGain();
    this.sink.gain.value = 0;
    this.node.connect(this.sink).connect(ctx.destination);
    this.node.port.onmessage = (e) => {
      const lv = e.data as number[];
      if (this.timeline) { this.timeline[0].push(lv[0]); this.timeline[1].push(lv[1]); }
      this.onLevels?.(lv);
    };
  }

  /** null when the browser has no AudioWorklet — recording still works, just no meters. */
  static async create(ctx: AudioContext): Promise<LevelTracker | null> {
    if (!ctx.audioWorklet) return null;
    try {
      if (!workletLoaded.has(ctx)) {
        const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
        workletLoaded.set(ctx, ctx.audioWorklet.addModule(url).finally(() => URL.revokeObjectURL(url)));
      }
      await workletLoaded.get(ctx);
      return new LevelTracker(ctx);
    } catch {
      return null;
    }
  }

  /** Attach a stream to input 0 (tab/client) or 1 (mic), replacing what was there. */
  setSource(input: 0 | 1, stream: MediaStream | null) {
    this.sources[input]?.disconnect();
    this.sources[input] = null;
    if (!stream || !stream.getAudioTracks().length) return;
    const src = this.ctx.createMediaStreamSource(stream);
    src.connect(this.node, 0, input);
    this.sources[input] = src;
  }

  startTimeline() { this.timeline = [[], []]; }

  /** The timeline as the backend expects it (see backend services/speaker-channels.js). */
  takeTimeline(): string | null {
    const tl = this.timeline;
    this.timeline = null;
    if (!tl || !tl[0].length) return null;
    const b64 = (a: number[]) => {
      let s = '';
      for (const v of a) s += String.fromCharCode(v);
      return btoa(s);
    };
    return JSON.stringify({ v: 1, frameMs: FRAME_MS, client: b64(tl[0]), therapist: b64(tl[1]) });
  }

  close() {
    this.sources.forEach((s) => s?.disconnect());
    this.node.port.onmessage = null;
    this.node.disconnect();
    this.sink.disconnect();
  }
}

// Bluetooth / headset mics sit at the therapist's mouth — fine online, but in the
// room they barely hear the client. Labels come from the OS, so this is a best guess.
const HEADSET_RE = /bluetooth|hands-?free|airpods|\bbuds\b|earbuds?|earphones?|headset|\bbt\b/i;
export const isHeadsetMic = (label: string) => HEADSET_RE.test(label || '');
// Bluetooth specifically: its mic drops to phone-call quality (8–16 kHz) while in use.
const BLUETOOTH_RE = /bluetooth|hands-?free|airpods|\bbuds\b|\bbt\b/i;
export const isBluetoothMic = (label: string) => BLUETOOTH_RE.test(label || '');
