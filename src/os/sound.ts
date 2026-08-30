/* ============================================================
   Synthesized UI audio.
   Every sound is generated at runtime with the Web Audio API,
   so the whole OS ships with zero audio assets.
   ============================================================ */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() { ac(); }

type Wave = OscillatorType;

/** a single enveloped voice */
function voice(
  freq: number,
  opts: {
    t?: number; dur?: number; wave?: Wave; gain?: number;
    attack?: number; glide?: number; filter?: number; q?: number;
  } = {}
) {
  const c = ac();
  if (!c || !master) return;
  const {
    t = 0, dur = 0.22, wave = "sine", gain = 0.5,
    attack = 0.004, glide, filter, q = 1,
  } = opts;

  const now = c.currentTime + t;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, now);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glide), now + dur);

  let node: AudioNode = osc;
  if (filter) {
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(filter, now);
    lp.Q.value = q;
    osc.connect(lp);
    node = lp;
  }

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  node.connect(g);
  g.connect(master);
  osc.start(now);
  osc.stop(now + dur + 0.05);
}

/** filtered noise burst, used for whooshes and the trash crunch */
function noise(opts: { t?: number; dur?: number; gain?: number; from?: number; to?: number } = {}) {
  const c = ac();
  if (!c || !master) return;
  const { t = 0, dur = 0.3, gain = 0.2, from = 900, to = 200 } = opts;
  const now = c.currentTime + t;
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(from, now);
  bp.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(bp); bp.connect(g); g.connect(master);
  src.start(now);
}

export const SFX = {
  /** boot: two dry notes and a low swell, no cathedral reverb here */
  boot() {
    voice(196, { dur: 1.5, wave: "sine", gain: 0.16, attack: 0.06, filter: 900 });
    voice(587.33, { t: 0.06, dur: 0.5, wave: "sine", gain: 0.16, filter: 4000 });
    voice(880, { t: 0.2, dur: 0.7, wave: "sine", gain: 0.12, filter: 5000 });
    noise({ t: 0, dur: 0.9, gain: 0.03, from: 2600, to: 300 });
  },

  /** kept for reference; the old Aqua chord */
  startup() {
    // F#/Gb major-ish stack, detuned & staggered like the real thing
    const stack = [92.5, 185, 277.2, 370, 554.4, 740];
    stack.forEach((f, i) => {
      voice(f, { t: i * 0.012, dur: 3.4, wave: "sine", gain: 0.24 - i * 0.024, attack: 0.09, filter: 3200 });
      voice(f * 1.004, { t: i * 0.012, dur: 3.2, wave: "triangle", gain: 0.09, attack: 0.12, filter: 2400 });
    });
    noise({ dur: 1.6, gain: 0.05, from: 3000, to: 400 });
  },

  /** window opens: rising gel pop */
  open() {
    voice(520, { dur: 0.16, wave: "sine", gain: 0.32, glide: 980, filter: 4000 });
    voice(1560, { t: 0.03, dur: 0.1, wave: "sine", gain: 0.08 });
  },

  /** window closes: falling counterpart */
  close() {
    voice(760, { dur: 0.15, wave: "sine", gain: 0.26, glide: 300, filter: 3000 });
  },

  /** the "poik" of a click on glass */
  click() {
    voice(1180, { dur: 0.05, wave: "sine", gain: 0.2, filter: 5200 });
    voice(2360, { t: 0.008, dur: 0.035, wave: "sine", gain: 0.05 });
  },

  /** hover over an icon: barely-there tick */
  hover() {
    voice(2100, { dur: 0.028, wave: "sine", gain: 0.045 });
  },

  /** genie into the dock */
  minimize() {
    voice(900, { dur: 0.34, wave: "sine", gain: 0.18, glide: 180, filter: 2200 });
    noise({ dur: 0.34, gain: 0.06, from: 1600, to: 180 });
  },

  restore() {
    voice(220, { dur: 0.3, wave: "sine", gain: 0.18, glide: 900, filter: 3000 });
    noise({ dur: 0.28, gain: 0.05, from: 240, to: 1800 });
  },

  /** the drop into the trash */
  trash() {
    noise({ dur: 0.5, gain: 0.22, from: 2600, to: 120 });
    voice(150, { t: 0.04, dur: 0.3, wave: "square", gain: 0.09, glide: 60, filter: 800 });
  },

  /** theme switch: a small arpeggio */
  chime(base = 523.25) {
    [1, 1.26, 1.5].forEach((m, i) =>
      voice(base * m, { t: i * 0.055, dur: 0.4, wave: "sine", gain: 0.14, filter: 5000 })
    );
  },

  error() {
    voice(180, { dur: 0.18, wave: "square", gain: 0.14, filter: 900 });
    voice(140, { t: 0.16, dur: 0.24, wave: "square", gain: 0.13, filter: 700 });
  },
};

export type SfxName = keyof typeof SFX;

/* --- shared graph access, so apps can plug into the same context --- */
export function audioCtx(): AudioContext | null { return ac(); }
export function audioOut(): GainNode | null { ac(); return master; }
