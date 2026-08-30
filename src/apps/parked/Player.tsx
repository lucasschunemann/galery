import { useEffect, useRef, useState } from "react";
import { audioCtx, audioOut } from "../../os/sound";
import { useSfx } from "../../os/useSfx";

/* ============================================================
   AeroTunes: a generative ambient patch. Four detuned voices
   walk a pentatonic scale through a slowly-breathing lowpass;
   an AnalyserNode drives the visualiser. No audio files.
   ============================================================ */

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const ROOT = 110; // A2
const TRACKS = ["grid.001", "signal.002", "helvetica.003"];

export default function Player() {
  const [playing, setPlaying] = useState(false);
  const [density, setDensity] = useState(52);
  const [bright, setBright] = useState(58);
  const [track, setTrack] = useState(0);
  const sfx = useSfx();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const busRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const densRef = useRef(density);
  const brightRef = useRef(bright);
  densRef.current = density;
  brightRef.current = bright;

  /* ---------------- audio graph ---------------- */
  useEffect(() => {
    if (!playing) return;
    const ctx = audioCtx();
    const out = audioOut();
    if (!ctx || !out) return;

    const bus = ctx.createGain();
    bus.gain.value = 0.0001;
    bus.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 1.4);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 1.2;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;

    bus.connect(filter);
    filter.connect(analyser);
    analyser.connect(out);

    busRef.current = bus;
    filterRef.current = filter;
    analyserRef.current = analyser;

    /* one plucked/padded voice */
    const note = () => {
      const c = audioCtx();
      if (!c) return;
      const semi = SCALE[Math.floor(Math.random() * SCALE.length)];
      const oct = Math.random() < 0.3 ? 2 : 1;
      const freq = ROOT * Math.pow(2, semi / 12) * oct;
      const now = c.currentTime;
      const dur = 3.2 + Math.random() * 4.5;

      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.09 + Math.random() * 0.07, now + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      const pan = c.createStereoPanner?.();
      if (pan) pan.pan.value = Math.random() * 1.6 - 0.8;

      [1, 1.005, 0.5].forEach((m, i) => {
        const o = c.createOscillator();
        o.type = i === 2 ? "triangle" : "sine";
        o.frequency.value = freq * m;
        o.connect(g);
        o.start(now);
        o.stop(now + dur + 0.1);
      });

      if (pan) { g.connect(pan); pan.connect(bus); }
      else g.connect(bus);
    };

    // a low drone under everything
    const drone = ctx.createGain();
    drone.gain.value = 0.055;
    [ROOT / 2, (ROOT / 2) * 1.5].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(drone);
      o.start();
      (o as OscillatorNode & { _keep?: boolean })._keep = true;
      setTimeout(() => { try { o.stop(); } catch { /* already gone */ } }, 1000 * 3600);
    });
    drone.connect(bus);

    const schedule = () => {
      note();
      const gap = 2400 - densRef.current * 18 + Math.random() * 900;
      timerRef.current = window.setTimeout(schedule, Math.max(180, gap));
    };
    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const c = audioCtx();
      if (c) {
        bus.gain.cancelScheduledValues(c.currentTime);
        bus.gain.setValueAtTime(bus.gain.value, c.currentTime);
        bus.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
        setTimeout(() => { try { bus.disconnect(); drone.disconnect(); } catch { /* noop */ } }, 700);
      }
    };
  }, [playing]);

  /* filter follows the "brilho" slider */
  useEffect(() => {
    const f = filterRef.current;
    const c = audioCtx();
    if (f && c) f.frequency.setTargetAtTime(320 + bright * 42, c.currentTime, 0.2);
  }, [bright]);

  /* ---------------- visualiser ---------------- */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx2d = cv.getContext("2d");
    if (!ctx2d) return;
    let raf = 0;
    const data = new Uint8Array(64);

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, w, h);

      const an = analyserRef.current;
      if (an) an.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
      else data.fill(0);

      const css = getComputedStyle(document.documentElement);
      const accent = css.getPropertyValue("--accent").trim() || "#ff4d2e";
      const dim = css.getPropertyValue("--n-40").trim() || "#363c46";

      const bars = 28;
      const gap = 3;
      const bw = (w - gap * (bars - 1)) / bars;

      for (let i = 0; i < bars; i++) {
        const v = (data[i * 2] ?? 0) / 255;
        const bh = Math.max(2, v * h * 0.78);
        const x = i * (bw + gap);
        const y = h * 0.8 - bh;

        const g = ctx2d.createLinearGradient(0, y, 0, y + bh);
        g.addColorStop(0, accent);
        g.addColorStop(1, dim);
        ctx2d.fillStyle = g;
        roundRect(ctx2d, x, y, bw, bh, Math.min(3, bw / 2));
        ctx2d.fill();

        // reflection
        ctx2d.globalAlpha = 0.18;
        ctx2d.fillStyle = accent;
        roundRect(ctx2d, x, h * 0.8 + 1, bw, bh * 0.5, Math.min(3, bw / 2));
        ctx2d.fill();
        ctx2d.globalAlpha = 1;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="tunes">
      <div className="tunes__screen">
        <canvas ref={canvasRef} className="tunes__viz" />
        <div className="tunes__meta">
          <span className="tunes__title">{TRACKS[track]}</span>
          <span className="tunes__artist">
            {playing ? "gerando em tempo real" : "parado"} · helvetia
          </span>
        </div>
      </div>

      <div className="tunes__transport">
        <button
          className="tunes__btn"
          onClick={() => { setTrack((t) => (t + TRACKS.length - 1) % TRACKS.length); sfx("click"); }}
          aria-label="Anterior"
        >◀◀</button>
        <button
          className="gel tunes__play"
          onClick={() => { setPlaying((p) => !p); sfx("click"); }}
          aria-label={playing ? "Pausar" : "Tocar"}
        >{playing ? "❚❚" : "▶"}</button>
        <button
          className="tunes__btn"
          onClick={() => { setTrack((t) => (t + 1) % TRACKS.length); sfx("click"); }}
          aria-label="Próxima"
        >▶▶</button>
      </div>

      <label className="slider">
        <span className="slider__label">Densidade<b>{density}</b></span>
        <input type="range" min={0} max={100} value={density} className="flow__slider"
          onChange={(e) => setDensity(+e.target.value)} />
      </label>
      <label className="slider">
        <span className="slider__label">Brilho<b>{bright}</b></span>
        <input type="range" min={0} max={100} value={bright} className="flow__slider"
          onChange={(e) => setBright(+e.target.value)} />
      </label>
    </div>
  );
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
