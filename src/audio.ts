/* ============================================================
   Som, todo sintetizado na hora. Nenhum arquivo de áudio.

   A cadeia: tudo passa por um compressor leve; a música e os
   sons de interface mandam um pouco para uma sala (um impulso
   de 3,6 s gerado com ruído que escurece com o tempo) e para um
   eco pingue-pongue no tempo da música.

   A música é generativa: um colchão de acordes macios, um sub
   embaixo, um sopro de ar filtrado, e sinos de vidro (síntese
   FM com razão inarmônica) tocando uma melodia que anda por
   graus vizinhos. O dia toca em Fá lídio; a noite, em Ré bemol,
   mais lenta e mais escura. Cada sala tem a sua nota.
   ============================================================ */

export type Theme = "day" | "night";
type Surface = "tile" | "grass";

const BPM = 74;
const BEAT = 60 / BPM;
const EIGHTH = BEAT / 2;
const STEPS_PER_CHORD = 16;

interface Chord { bass: number; pad: number[]; mel: number[] }

const SONGS: Record<Theme, Chord[]> = {
  day: [
    { bass: 41, pad: [57, 60, 64, 67, 72], mel: [65, 67, 69, 72, 74, 76, 79, 81] }, // Fmaj9
    { bass: 38, pad: [53, 57, 60, 64, 65], mel: [62, 65, 69, 72, 74, 76, 77, 81] }, // Dm9
    { bass: 46, pad: [53, 57, 60, 62, 64], mel: [65, 69, 72, 74, 76, 77, 79, 81] }, // Sib maj9(#11)
    { bass: 48, pad: [55, 60, 62, 64, 69], mel: [64, 67, 69, 72, 74, 76, 79, 81] }, // Dó 6/9
  ],
  night: [
    { bass: 37, pad: [53, 56, 60, 63, 65], mel: [63, 65, 68, 70, 72, 75, 77, 80] }, // Réb maj9
    { bass: 34, pad: [53, 56, 60, 61, 65], mel: [61, 65, 68, 70, 72, 73, 77, 80] }, // Sibm9
    { bass: 42, pad: [53, 58, 60, 61, 65], mel: [61, 65, 68, 70, 72, 73, 77, 80] }, // Solb maj7(#11)
    { bass: 44, pad: [51, 56, 58, 60, 65], mel: [63, 65, 68, 70, 72, 75, 77, 80] }, // Láb 6/9
  ],
};

/** a nota de cada sala, numa pentatônica do tema */
const ROOM_NOTES: Record<Theme, number[]> = {
  day: [72, 74, 76, 79, 81, 84, 86, 88, 91, 93],
  night: [68, 70, 73, 75, 77, 80, 82, 85, 87, 89],
};

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let fxBus: GainNode;
let reverb: GainNode;
let echo: GainNode;
let padFilter: BiquadFilterNode;
let airFilter: BiquadFilterNode;
let rollGain: GainNode;
let rollFilter: BiquadFilterNode;
let waterGain: GainNode;
let windGain: GainNode;
let lastWater = 0;
let lastWind = 0;
let noise: AudioBuffer;

let on = false;
let theme: Theme = "day";
let timer = 0;
let nextTime = 0;
let step = 0;
let chord = 0;
let melPos = 3;
let lastRoll = 0;
let lastHover = 0;

/* ---------------- montagem ---------------- */

function impulse(c: BaseAudioContext, dur: number) {
  const n = Math.floor(c.sampleRate * dur);
  const b = c.createBuffer(2, n, c.sampleRate);
  const fade = c.sampleRate * 0.012;
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      // passa-baixa que vai fechando: a cauda fica mais escura que o ataque
      lp += (Math.random() * 2 - 1 - lp) * (0.6 - t * 0.5);
      d[i] = lp * Math.pow(1 - t, 2.4) * Math.min(1, i / fade);
    }
  }
  return b;
}

function noiseBuffer(c: BaseAudioContext) {
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function ensure() {
  if (ctx) return ctx;
  const c = new AudioContext({ latencyHint: "interactive" });
  ctx = c;

  const comp = new DynamicsCompressorNode(c, { threshold: -16, knee: 10, ratio: 3.5, attack: 0.006, release: 0.22 });
  master = new GainNode(c, { gain: 0 });
  comp.connect(master).connect(c.destination);

  reverb = new GainNode(c);
  const conv = new ConvolverNode(c, { buffer: impulse(c, 3.6) });
  const wet = new GainNode(c, { gain: 0.55 });
  reverb.connect(conv).connect(wet).connect(comp);

  echo = new GainNode(c);
  const tone = new BiquadFilterNode(c, { type: "lowpass", frequency: 3200 });
  const dl = new DelayNode(c, { maxDelayTime: 2, delayTime: BEAT * 0.75 });
  const dr = new DelayNode(c, { maxDelayTime: 2, delayTime: BEAT * 0.75 });
  const fbL = new GainNode(c, { gain: 0.36 });
  const fbR = new GainNode(c, { gain: 0.36 });
  const out = new GainNode(c, { gain: 0.34 });
  echo.connect(tone).connect(dl);
  dl.connect(new StereoPannerNode(c, { pan: -0.75 })).connect(out);
  dl.connect(fbL).connect(dr);
  dr.connect(new StereoPannerNode(c, { pan: 0.75 })).connect(out);
  dr.connect(fbR).connect(dl);
  out.connect(comp);
  out.connect(reverb);

  musicBus = new GainNode(c, { gain: 0.5 });
  musicBus.connect(comp);
  fxBus = new GainNode(c, { gain: 0.9 });
  fxBus.connect(comp);

  // o colchão passa por um filtro que respira devagar
  padFilter = new BiquadFilterNode(c, { type: "lowpass", frequency: 1500, Q: 0.6 });
  const padOut = new GainNode(c);
  padFilter.connect(padOut).connect(musicBus);
  padOut.connect(new GainNode(c, { gain: 0.8 })).connect(reverb);
  const lfo = new OscillatorNode(c, { frequency: 0.06 });
  lfo.connect(new GainNode(c, { gain: 420 })).connect(padFilter.frequency);
  lfo.start();

  noise = noiseBuffer(c);

  // o ar: ruído filtrado, como vento entre as ilhas
  const air = new AudioBufferSourceNode(c, { buffer: noise, loop: true });
  airFilter = new BiquadFilterNode(c, { type: "bandpass", frequency: 800, Q: 0.7 });
  const airLfo = new OscillatorNode(c, { frequency: 0.045 });
  airLfo.connect(new GainNode(c, { gain: 380 })).connect(airFilter.frequency);
  const airGain = new GainNode(c, { gain: 0.016 });
  air.connect(airFilter).connect(airGain).connect(musicBus);
  airGain.connect(reverb);
  air.start();
  airLfo.start();

  // a bolinha rolando: ruído num passa-banda que segue a velocidade
  const roll = new AudioBufferSourceNode(c, { buffer: noise, loop: true });
  rollFilter = new BiquadFilterNode(c, { type: "bandpass", frequency: 300, Q: 1.3 });
  rollGain = new GainNode(c, { gain: 0 });
  roll.connect(rollFilter).connect(rollGain).connect(fxBus);
  roll.start();

  // perto da lagoa: água correndo, filtrada e mexendo devagar
  const water = new AudioBufferSourceNode(c, { buffer: noise, loop: true, playbackRate: 0.7 });
  const wf = new BiquadFilterNode(c, { type: "lowpass", frequency: 650, Q: 0.4 });
  const wLfo = new OscillatorNode(c, { frequency: 0.3 });
  wLfo.connect(new GainNode(c, { gain: 220 })).connect(wf.frequency);
  waterGain = new GainNode(c, { gain: 0 });
  water.connect(wf).connect(waterGain).connect(fxBus);
  waterGain.connect(new GainNode(c, { gain: 0.5 })).connect(reverb);
  water.start();
  wLfo.start();

  // no mirante: vento, mais agudo e com rajadas
  const wind = new AudioBufferSourceNode(c, { buffer: noise, loop: true, playbackRate: 1.1 });
  const vf = new BiquadFilterNode(c, { type: "bandpass", frequency: 1200, Q: 0.6 });
  const vLfo = new OscillatorNode(c, { frequency: 0.11 });
  vLfo.connect(new GainNode(c, { gain: 700 })).connect(vf.frequency);
  windGain = new GainNode(c, { gain: 0 });
  wind.connect(vf).connect(windGain).connect(fxBus);
  windGain.connect(new GainNode(c, { gain: 0.6 })).connect(reverb);
  wind.start();
  vLfo.start();

  document.addEventListener("visibilitychange", () => {
    if (!ctx || !on) return;
    if (document.hidden) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      setTimeout(() => document.hidden && ctx?.suspend(), 200);
    } else {
      ctx.resume();
      master.gain.setTargetAtTime(0.85, ctx.currentTime, 0.3);
    }
  });
  return c;
}

const live = () => on && !!ctx && ctx.state === "running";

/* ---------------- instrumentos ---------------- */

interface Sends { out?: AudioNode; pan?: number; rev?: number; echo?: number }

function route(node: AudioNode, s: Sends, fallback: AudioNode) {
  const c = ctx!;
  const p = new StereoPannerNode(c, { pan: s.pan ?? 0 });
  node.connect(p);
  p.connect(s.out ?? fallback);
  if (s.rev) p.connect(new GainNode(c, { gain: s.rev })).connect(reverb);
  if (s.echo) p.connect(new GainNode(c, { gain: s.echo })).connect(echo);
}

/** sino de vidro: FM com o modulador numa razão inarmônica */
function bell(m: number, t: number, vel = 1, o: Sends & { ratio?: number; decay?: number; index?: number } = {}) {
  const c = ctx!;
  const f = hz(m);
  const dec = o.decay ?? 2.4;
  const car = new OscillatorNode(c, { frequency: f });
  const mod = new OscillatorNode(c, { frequency: f * (o.ratio ?? 3.5) });
  const depth = new GainNode(c, { gain: 0 });
  const idx = Math.max(2, f * (o.index ?? 1.3) * vel);
  depth.gain.setValueAtTime(idx, t);
  depth.gain.exponentialRampToValueAtTime(idx * 0.01, t + Math.min(0.6, dec));
  mod.connect(depth).connect(car.frequency);
  const amp = new GainNode(c, { gain: 0 });
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(0.075 * vel, t + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  car.connect(amp);
  route(amp, o, musicBus);
  car.start(t);
  mod.start(t);
  car.stop(t + dec + 0.05);
  mod.stop(t + dec + 0.05);
}

/** um tom simples com glissando, para cliques e pulos */
function tone(t: number, f: number, to: number, dur: number, gain: number, o: Sends & { type?: OscillatorType } = {}) {
  const c = ctx!;
  const osc = new OscillatorNode(c, { type: o.type ?? "sine", frequency: f });
  osc.frequency.setValueAtTime(f, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  const amp = new GainNode(c, { gain: 0 });
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(gain, t + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp);
  route(amp, o, fxBus);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** um sopro de ruído filtrado, com varredura opcional */
function puff(t: number, type: BiquadFilterType, f: number, to: number, dur: number, gain: number, o: Sends & { q?: number; attack?: number } = {}) {
  const c = ctx!;
  const src = new AudioBufferSourceNode(c, { buffer: noise });
  const flt = new BiquadFilterNode(c, { type, frequency: f, Q: o.q ?? 0.8 });
  flt.frequency.setValueAtTime(f, t);
  flt.frequency.exponentialRampToValueAtTime(to, t + dur);
  const amp = new GainNode(c, { gain: 0 });
  const a = o.attack ?? 0.004;
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(gain, t + a);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(flt).connect(amp);
  route(amp, o, fxBus);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

function pad(ch: Chord, t: number, dur: number) {
  const c = ctx!;
  const voices: [OscillatorType, number, number][] = [["triangle", -7, 0.02], ["triangle", 7, 0.02], ["sine", 0, 0.028]];
  for (const m of ch.pad) {
    for (const [type, det, g] of voices) {
      const o = new OscillatorNode(c, { type, frequency: hz(m), detune: det + rand(-2, 2) });
      const v = new GainNode(c, { gain: 0 });
      v.gain.setValueAtTime(0, t);
      v.gain.linearRampToValueAtTime(g, t + 2.6);
      v.gain.setValueAtTime(g, t + dur - 0.3);
      v.gain.linearRampToValueAtTime(0, t + dur + 3.2);
      o.connect(v).connect(padFilter);
      o.start(t);
      o.stop(t + dur + 3.4);
    }
  }
  const sub = new OscillatorNode(c, { frequency: hz(ch.bass) });
  const sv = new GainNode(c, { gain: 0 });
  sv.gain.setValueAtTime(0, t);
  sv.gain.linearRampToValueAtTime(0.085, t + 1.4);
  sv.gain.setValueAtTime(0.085, t + dur - 0.4);
  sv.gain.linearRampToValueAtTime(0, t + dur + 2);
  sub.connect(sv).connect(musicBus);
  sub.start(t);
  sub.stop(t + dur + 2.2);
}

/* ---------------- a música ---------------- */

function schedule(t: number) {
  const song = SONGS[theme];
  if (step % STEPS_PER_CHORD === 0) {
    chord = (step / STEPS_PER_CHORD) % song.length;
    pad(song[chord], t, STEPS_PER_CHORD * EIGHTH);
  }
  const ch = song[chord];
  const pos = step % STEPS_PER_CHORD;
  const strong = pos % 4 === 0;
  const density = theme === "day" ? 0.26 : 0.16;
  if (pos > 0 && Math.random() < density * (strong ? 1.5 : 0.75)) {
    const moves = [-2, -1, -1, 0, 1, 1, 2];
    melPos = Math.max(0, Math.min(ch.mel.length - 1, melPos + moves[(Math.random() * moves.length) | 0]));
    const vel = (0.32 + Math.random() * 0.36) * (strong ? 1 : 0.75);
    const opts = { ratio: theme === "day" ? 3.5 : 2.01, decay: theme === "day" ? 2.6 : 3.4, pan: rand(-0.45, 0.45), echo: 0.55, rev: 0.6 };
    bell(ch.mel[melPos], t, vel, opts);
    // às vezes um ornamento, uma terça acima, meio tempo depois
    if (Math.random() < 0.14) bell(ch.mel[Math.min(ch.mel.length - 1, melPos + 2)], t + EIGHTH / 2, vel * 0.55, opts);
  }
  step++;
}

function startMusic() {
  stopMusic();
  const c = ctx!;
  nextTime = c.currentTime + 0.12;
  step = 0;
  timer = window.setInterval(() => {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.3) {
      schedule(nextTime);
      nextTime += EIGHTH;
    }
  }, 60);
}

function stopMusic() {
  clearInterval(timer);
}

/* ---------------- controle ---------------- */

export function setSound(enabled: boolean) {
  on = enabled;
  const c = ensure();
  const now = c.currentTime;
  master.gain.cancelScheduledValues(now);
  if (enabled) {
    c.resume();
    master.gain.setTargetAtTime(0.85, now, 0.25);
    startMusic();
    sfx.startup();
  } else {
    master.gain.setTargetAtTime(0, now, 0.12);
    stopMusic();
    setTimeout(() => !on && ctx?.suspend(), 800);
  }
}

export const soundOn = () => on;

export function setMusicTheme(t: Theme) {
  if (t === theme) return;
  theme = t;
  if (!ctx) return;
  const now = ctx.currentTime;
  padFilter.frequency.setTargetAtTime(t === "day" ? 1500 : 900, now, 1.5);
  airFilter.frequency.setTargetAtTime(t === "day" ? 800 : 480, now, 1.5);
  melPos = 3;
}

const roomNote = (i: number) => ROOM_NOTES[theme][i % ROOM_NOTES[theme].length];

export const sfx = {
  /** o acorde de entrada: o "liga" da galeria */
  startup() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    const notes = theme === "day" ? [60, 65, 69, 72, 76, 79, 84, 88] : [56, 61, 65, 68, 72, 75, 80, 84];
    puff(t, "bandpass", 300, 2400, 1.4, 0.05, { attack: 0.5, rev: 0.8 });
    tone(t, hz(notes[0] - 24), hz(notes[0] - 24), 2.6, 0.12, { rev: 0.4 });
    notes.forEach((m, i) => bell(m, t + 0.18 + i * 0.07, 0.75 - i * 0.04, { pan: -0.6 + (i / notes.length) * 1.2, decay: 3.4, rev: 0.7, echo: 0.35, out: fxBus }));
  },

  step(surface: Surface) {
    if (!live()) return;
    const t = ctx!.currentTime;
    if (surface === "grass") {
      puff(t, "lowpass", rand(900, 1300), 400, 0.09, 0.07, { rev: 0.05 });
      return;
    }
    const f = rand(165, 200);
    tone(t, f, f * 0.55, 0.07, 0.07, { rev: 0.12 });
    puff(t, "highpass", 4200, 3000, 0.022, 0.028, { rev: 0.1 });
  },

  jump(double = false) {
    if (!live()) return;
    const t = ctx!.currentTime;
    if (double) {
      // o mortal: um assobio que sobe e uma cascata curta
      tone(t, 420, 1400, 0.3, 0.04, { type: "triangle", rev: 0.35, echo: 0.2 });
      puff(t, "bandpass", 600, 3200, 0.42, 0.03, { attack: 0.08, rev: 0.3 });
      [84, 88, 91, 96].forEach((m, i) => bell(m, t + 0.1 + i * 0.06, 0.3, { decay: 0.7, out: fxBus, rev: 0.4, pan: -0.4 + i * 0.25 }));
      return;
    }
    tone(t, 300, 640, 0.16, 0.045, { rev: 0.2 });
    bell(91, t + 0.03, 0.25, { decay: 0.6, out: fxBus, rev: 0.3 });
  },

  /** o tubo da TV ligando: estalo, chiado agudo, e o sinal entrando */
  screen() {
    if (!live()) return;
    const t = ctx!.currentTime;
    puff(t, "highpass", 3000, 6000, 0.06, 0.05);
    tone(t + 0.02, 15600, 15000, 0.5, 0.006);
    tone(t + 0.04, 90, 60, 0.25, 0.08, { rev: 0.2 });
    puff(t + 0.05, "bandpass", 400, 3200, 0.45, 0.03, { attack: 0.15, rev: 0.4 });
    [72, 79, 84].forEach((m, i) => bell(m, t + 0.28 + i * 0.07, 0.4, { decay: 1.8, out: fxBus, rev: 0.5, echo: 0.25 }));
  },

  /** trocar de imagem é trocar de canal */
  channel() {
    if (!live()) return;
    const t = ctx!.currentTime;
    puff(t, "bandpass", 2400, 1800, 0.09, 0.04, { q: 1.2 });
    tone(t + 0.02, 1400, 1700, 0.05, 0.02, { type: "square" });
  },

  /** a plataforma de salto: mola e um assobio subindo */
  launch() {
    if (!live()) return;
    const t = ctx!.currentTime;
    tone(t, 110, 520, 0.35, 0.09, { rev: 0.2 });
    tone(t + 0.02, 500, 1900, 0.5, 0.035, { type: "triangle", rev: 0.4, echo: 0.3 });
    puff(t, "bandpass", 300, 4200, 0.6, 0.04, { attack: 0.05, rev: 0.4 });
  },

  /** o tubo: sucção na entrada (um sopro que sobe por toda a viagem), estalo e sino na saída */
  tube(kind: "in" | "out", dur = 3) {
    if (!live()) return;
    const t = ctx!.currentTime;
    if (kind === "in") {
      tone(t, 180, 900, 0.35, 0.06, { type: "triangle", rev: 0.3 });
      puff(t, "bandpass", 300, 2600, Math.max(0.6, dur), 0.05, { attack: 0.25, q: 0.7, rev: 0.4 });
      [79, 84, 91].forEach((m, i) => bell(m, t + 0.08 + i * 0.05, 0.3, { decay: 1, out: fxBus, rev: 0.4 }));
    } else {
      tone(t, 900, 260, 0.2, 0.06, { rev: 0.3 });
      puff(t, "highpass", 2500, 5000, 0.08, 0.05);
      [84, 88, 91, 96].forEach((m, i) => bell(m, t + 0.04 + i * 0.05, 0.4, { decay: 1.6, out: fxBus, rev: 0.5, echo: 0.3, pan: -0.3 + i * 0.2 }));
    }
  },

  /** bolha estourando */
  pop() {
    if (!live()) return;
    const t = ctx!.currentTime;
    const f = rand(700, 1100);
    tone(t, f, f * 2.6, 0.07, 0.07, { rev: 0.3 });
    puff(t, "highpass", 3500, 6000, 0.04, 0.035);
    bell(rand(88, 96) | 0, t + 0.03, 0.25, { decay: 0.6, out: fxBus, rev: 0.4 });
  },

  /** uma estrela achada: um arpejo que sobe com a contagem */
  star(n: number) {
    if (!live()) return;
    const t = ctx!.currentTime;
    const base = ROOM_NOTES[theme][0];
    for (let i = 0; i <= Math.min(n, 7); i++) bell(base + [0, 2, 4, 7, 9, 12, 14, 16][i], t + i * 0.055, 0.5, { decay: 1.8, out: fxBus, rev: 0.5, echo: 0.3, pan: -0.5 + i * 0.14 });
  },

  /** as oito estrelas: fanfarra de sinos */
  gold() {
    if (!live()) return;
    const t = ctx!.currentTime;
    const chord = theme === "day" ? [60, 64, 67, 72, 76, 79, 84, 88, 91] : [56, 60, 63, 68, 72, 75, 80, 84, 87];
    chord.forEach((m, i) => bell(m, t + i * 0.08, 0.7, { decay: 3.2, out: fxBus, rev: 0.7, echo: 0.4, pan: -0.7 + i * 0.17 }));
    chord.slice(0, 4).forEach((m, i) => bell(m + 12, t + 0.9 + i * 0.16, 0.5, { decay: 2.8, out: fxBus, rev: 0.7, echo: 0.4 }));
  },

  /** respiração guiada: um sopro que sobe (inspira) ou desce (expira) */
  breath(inhale: boolean) {
    if (!live()) return;
    const t = ctx!.currentTime;
    puff(t, "bandpass", inhale ? 300 : 900, inhale ? 900 : 260, 4, 0.05, { attack: inhale ? 3.2 : 0.4, q: 0.5, rev: 0.6 });
    bell(inhale ? 72 : 67, t, 0.3, { decay: 3.5, out: fxBus, rev: 0.7, ratio: 2.01 });
  },

  /** o minijogo: pegou, perdeu, acabou */
  game(kind: "catch" | "gold" | "miss" | "over" | "start", combo = 0) {
    if (!live()) return;
    const t = ctx!.currentTime;
    if (kind === "catch") tone(t, hz(76 + Math.min(combo, 12)), hz(83 + Math.min(combo, 12)), 0.08, 0.04, { type: "square", rev: 0.1 });
    else if (kind === "gold") [84, 88, 91].forEach((m, i) => tone(t + i * 0.05, hz(m), hz(m), 0.07, 0.035, { type: "square", rev: 0.15 }));
    else if (kind === "miss") tone(t, 220, 110, 0.18, 0.05, { type: "square" });
    else if (kind === "start") [72, 76, 79, 84].forEach((m, i) => tone(t + i * 0.07, hz(m), hz(m), 0.08, 0.035, { type: "square" }));
    else [79, 75, 72, 67].forEach((m, i) => tone(t + i * 0.12, hz(m), hz(m) * 0.98, 0.14, 0.04, { type: "square", rev: 0.2 }));
  },

  /** sentou no chão: um tum macio e um suspiro */
  sit() {
    if (!live()) return;
    const t = ctx!.currentTime;
    tone(t, 120, 70, 0.14, 0.05, { rev: 0.2 });
    puff(t + 0.05, "lowpass", 900, 300, 0.5, 0.025, { attack: 0.12, rev: 0.4 });
  },

  /** a fala dos NPCs: bipes curtos, um por sílaba, na nota de cada um */
  talk(voice: number, chars: number) {
    if (!live()) return;
    const t = ctx!.currentTime;
    const n = Math.min(14, Math.max(2, Math.round(chars / 3)));
    const steps = [0, 2, 4, 5, 7, 9, 12];
    for (let i = 0; i < n; i++) {
      const m = voice + steps[(Math.random() * steps.length) | 0];
      tone(t + i * 0.062, hz(m), hz(m) * rand(0.94, 1.08), 0.05, 0.022, { type: i % 3 ? "triangle" : "square", rev: 0.12, pan: rand(-0.15, 0.15) });
    }
  },

  /** ambiências de lugar, chamadas todo quadro com a proximidade (0 a 1) */
  ambience(waterLevel: number, windLevel: number) {
    if (!ctx || !waterGain) return;
    if (!live()) { waterLevel = 0; windLevel = 0; }
    const now = ctx.currentTime;
    if (Math.abs(waterLevel - lastWater) > 0.02) {
      waterGain.gain.setTargetAtTime(waterLevel * 0.09, now, 0.3);
      lastWater = waterLevel;
    }
    if (Math.abs(windLevel - lastWind) > 0.02) {
      windGain.gain.setTargetAtTime(windLevel * 0.06, now, 0.4);
      lastWind = windLevel;
    }
    // bolhas estourando de vez em quando
    if (waterLevel > 0.2 && Math.random() < waterLevel * 0.02) {
      const f = rand(380, 700);
      tone(now, f, f * 2.2, 0.07, 0.03 * waterLevel, { rev: 0.4, pan: rand(-0.4, 0.4) });
    }
    // e um brilho no vento
    if (windLevel > 0.3 && Math.random() < windLevel * 0.006) bell(rand(88, 98) | 0, now, 0.18, { decay: 1.6, out: fxBus, rev: 0.7, echo: 0.4, pan: rand(-0.6, 0.6) });
  },

  land(k: number) {
    if (!live()) return;
    const t = ctx!.currentTime;
    tone(t, 140, 70, 0.11, 0.05 + k * 0.05, { rev: 0.15 });
    puff(t, "lowpass", 1800, 500, 0.08, 0.03 * k);
  },

  marble(toMarble: boolean) {
    if (!live()) return;
    const t = ctx!.currentTime;
    if (toMarble) {
      tone(t, 380, 1500, 0.22, 0.04, { type: "triangle", rev: 0.4, echo: 0.2 });
      [86, 91, 96].forEach((m, i) => bell(m, t + 0.05 + i * 0.045, 0.35, { decay: 0.9, out: fxBus, rev: 0.4, pan: -0.3 + i * 0.3 }));
    } else {
      tone(t, 1400, 420, 0.22, 0.035, { type: "triangle", rev: 0.4 });
      bell(79, t + 0.06, 0.3, { decay: 0.8, out: fxBus, rev: 0.3 });
    }
  },

  /** chamada todo quadro com a velocidade normalizada da bolinha */
  roll(level: number) {
    if (!ctx || !rollGain) return;
    if (!live()) level = 0;
    if (Math.abs(level - lastRoll) > 0.02 || (level === 0 && lastRoll !== 0)) {
      const now = ctx.currentTime;
      rollGain.gain.setTargetAtTime(level * 0.11, now, 0.07);
      rollFilter.frequency.setTargetAtTime(240 + level * 1100, now, 0.08);
      lastRoll = level;
    }
    // tilintar de vidro de vez em quando
    if (level > 0.3 && Math.random() < level * 0.025) bell(rand(93, 100) | 0, ctx.currentTime, 0.12, { decay: 0.25, out: fxBus, pan: rand(-0.4, 0.4) });
  },

  near(i: number) {
    if (!live()) return;
    bell(roomNote(i), ctx!.currentTime + 0.02, 0.45, { decay: 2.6, echo: 0.45, rev: 0.6, out: fxBus });
  },

  open(i: number) {
    if (!live()) return;
    const t = ctx!.currentTime;
    const m = roomNote(i);
    puff(t, "bandpass", 500, 2800, 0.32, 0.04, { attack: 0.12, rev: 0.3 });
    bell(m, t + 0.08, 0.6, { decay: 2.4, echo: 0.4, rev: 0.6, out: fxBus });
    bell(m + 7, t + 0.15, 0.45, { decay: 2.2, echo: 0.3, rev: 0.6, out: fxBus });
    bell(m + 12, t + 0.22, 0.3, { decay: 2, rev: 0.6, out: fxBus });
  },

  close() {
    if (!live()) return;
    const t = ctx!.currentTime;
    puff(t, "bandpass", 2200, 400, 0.26, 0.03, { attack: 0.02, rev: 0.2 });
    bell(roomNote(2) - 5, t + 0.04, 0.3, { decay: 1.2, rev: 0.4, out: fxBus });
  },

  catalog() {
    if (!live()) return;
    const t = ctx!.currentTime;
    puff(t, "bandpass", 600, 3600, 0.3, 0.035, { attack: 0.1, rev: 0.3 });
    const top = SONGS[theme][chord].pad.slice(-3).map((m) => m + 12);
    top.forEach((m, i) => bell(m, t + 0.06 + i * 0.05, 0.4, { decay: 1.6, rev: 0.5, echo: 0.2, out: fxBus, pan: -0.3 + i * 0.3 }));
  },

  theme(night: boolean) {
    if (!live()) return;
    const t = ctx!.currentTime;
    const notes = night ? [84, 80, 77, 73, 68] : [72, 76, 79, 84, 88];
    notes.forEach((m, i) => bell(m, t + i * 0.075, 0.5 - i * 0.05, { decay: 2.2, echo: 0.3, rev: 0.6, out: fxBus, pan: -0.5 + i * 0.25 }));
  },

  /** o seletor de pixel fala em 8 bits */
  pixel(n: number) {
    if (!live()) return;
    const t = ctx!.currentTime;
    [72, 76, 79, 84].slice(0, n).forEach((m, i) => tone(t + i * 0.05, hz(m), hz(m), 0.06, 0.03, { type: "square", rev: 0.1 }));
  },

  hover(i = -1) {
    if (!live()) return;
    const now = performance.now();
    if (now - lastHover < 40) return;
    lastHover = now;
    const t = ctx!.currentTime;
    if (i >= 0) bell(roomNote(i) + 12, t, 0.16, { decay: 0.35, out: fxBus, rev: 0.25 });
    else tone(t, 2600, 2900, 0.03, 0.01, { rev: 0.05 });
  },

  click() {
    if (!live()) return;
    const t = ctx!.currentTime;
    tone(t, 1050, 1500, 0.05, 0.028, { rev: 0.1 });
    puff(t, "highpass", 5000, 4000, 0.015, 0.02);
  },

  sent() {
    if (!live()) return;
    const t = ctx!.currentTime;
    const notes = theme === "day" ? [72, 76, 79, 84, 88] : [68, 72, 75, 80, 84];
    notes.forEach((m, i) => bell(m, t + i * 0.06, 0.55, { decay: 2.4, echo: 0.4, rev: 0.6, out: fxBus, pan: -0.4 + i * 0.2 }));
  },

  error() {
    if (!live()) return;
    const t = ctx!.currentTime;
    bell(64, t, 0.4, { ratio: 2.01, decay: 1, out: fxBus, rev: 0.3 });
    bell(61, t + 0.14, 0.4, { ratio: 2.01, decay: 1.2, out: fxBus, rev: 0.3 });
  },
};
