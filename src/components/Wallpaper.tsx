import { useEffect, useRef } from "react";
import { useOS } from "../os/store";

/* ============================================================
   WALLPAPER — "Signal".

   A Müller-Brockmann concentric system: rings in geometric
   progression, a radiating wedge, a modular grid, two slow
   colour blooms and film grain.

   It has to work twice — crisp in the tiling gaps, and as a
   pure field of colour once 30px of blur sits on top of it.
   So: large soft masses for the blurred read, fine geometry
   for the sharp one.
   ============================================================ */

export default function Wallpaper() {
  const ref = useRef<HTMLCanvasElement>(null);
  const flavour = useOS((s) => s.flavour);
  const grain = useOS((s) => s.grain);
  const grainRef = useRef(grain);
  grainRef.current = grain;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, t = 0, raf = 0;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let C = read();
    let grainTile: CanvasPattern | null = null;

    function read() {
      const cs = getComputedStyle(document.documentElement);
      const g = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      return {
        a: g("--wall-a", "#0a0c10"),
        b: g("--wall-b", "#14181f"),
        c: g("--wall-c", "#242a34"),
        accent: g("--accent", "#ff4d2e"),
        line: g("--n-40", "#363c46"),
        light: g("--n-80", "#a3aab5"),
      };
    }

    function makeGrain(size = 140) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const x = c.getContext("2d")!;
      const img = x.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (Math.random() * 2 - 1) * 30;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      return c;
    }
    const grainCanvas = makeGrain();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cv!.width = Math.floor(w * dpr);
      cv!.height = Math.floor(h * dpr);
      cv!.style.width = w + "px";
      cv!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      grainTile = ctx!.createPattern(grainCanvas, "repeat");
    }

    /** the composition's anchor — everything radiates from here */
    const origin = () => ({
      x: w * 0.3 + (pointer.x - 0.5) * -26,
      y: h * 0.46 + (pointer.y - 0.5) * -18,
    });

    function field() {
      const g = ctx!.createLinearGradient(0, 0, w * 0.7, h);
      g.addColorStop(0, C.a);
      g.addColorStop(0.55, C.b);
      g.addColorStop(1, C.a);
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);

      // two slow blooms: one neutral light, one carrying the accent.
      // These are what survive the blur.
      const b1x = w * (0.72 + Math.sin(t * 0.06) * 0.06);
      const b1y = h * (0.2 + Math.cos(t * 0.05) * 0.07);
      const g1 = ctx!.createRadialGradient(b1x, b1y, 0, b1x, b1y, Math.max(w, h) * 0.62);
      g1.addColorStop(0, hexA(C.c, 0.85));
      g1.addColorStop(0.45, hexA(C.c, 0.25));
      g1.addColorStop(1, hexA(C.c, 0));
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, 0, w, h);

      const o = origin();
      const g2 = ctx!.createRadialGradient(o.x, o.y, 0, o.x, o.y, Math.max(w, h) * 0.5);
      g2.addColorStop(0, hexA(C.accent, 0.13));
      g2.addColorStop(0.4, hexA(C.accent, 0.04));
      g2.addColorStop(1, hexA(C.accent, 0));
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, w, h);
    }

    /** modular grid — 12 columns and a matching horizontal rhythm */
    function grid() {
      const m = 0;
      ctx!.save();
      ctx!.strokeStyle = hexA(C.light, 0.05);
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      for (let i = 1; i < 12; i++) {
        const x = Math.round(m + ((w - m * 2) / 12) * i) + 0.5;
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, h);
      }
      const rows = Math.max(4, Math.round(h / ((w - m * 2) / 12)));
      for (let i = 1; i < rows; i++) {
        const y = Math.round((h / rows) * i) + 0.5;
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
      }
      ctx!.stroke();
      ctx!.restore();
    }

    /** the concentric system */
    function rings() {
      const o = origin();
      const base = Math.min(w, h) * 0.085;
      const K = 1.27;

      ctx!.save();
      for (let i = 0; i < 15; i++) {
        const r = base * Math.pow(K, i);
        if (r > Math.max(w, h) * 1.3) break;
        const breathe = Math.sin(t * 0.25 + i * 0.42) * 0.5 + 0.5;
        // weights ride their own progression: the Basel cadence
        const lw = 0.6 + Math.pow(i / 14, 2.4) * 9;
        const isSignal = i === 6;

        ctx!.lineWidth = lw;
        ctx!.strokeStyle = isSignal
          ? hexA(C.accent, 0.42 + breathe * 0.2)
          : hexA(C.light, 0.05 + breathe * 0.05);
        ctx!.beginPath();
        ctx!.arc(o.x, o.y, r, 0, Math.PI * 2);
        ctx!.stroke();
      }
      ctx!.restore();
    }

    /** a radiating wedge — the poster's burst of energy */
    function wedge() {
      const o = origin();
      const spin = t * 0.028;
      const N = 46;
      const R = Math.max(w, h) * 1.15;

      ctx!.save();
      ctx!.translate(o.x, o.y);
      ctx!.rotate(spin);
      ctx!.lineWidth = 1;
      for (let i = 0; i < N; i++) {
        const p = i / (N - 1);
        const ang = -0.42 + p * 0.9;                 // a ~50° fan
        const len = R * (0.34 + Math.pow(Math.sin(p * Math.PI), 0.6) * 0.66);
        const a = 0.035 + Math.sin(t * 0.5 + p * 7) * 0.02;
        ctx!.strokeStyle = hexA(p > 0.52 && p < 0.58 ? C.accent : C.light, Math.max(0, a) * (p > 0.52 && p < 0.58 ? 6 : 1));
        ctx!.beginPath();
        ctx!.moveTo(Math.cos(ang) * base(R), Math.sin(ang) * base(R));
        ctx!.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
        ctx!.stroke();
      }
      ctx!.restore();

      function base(r: number) { return r * 0.12; }
    }

    function finish() {
      if (grainRef.current && grainTile) {
        ctx!.save();
        ctx!.globalCompositeOperation = "overlay";
        ctx!.globalAlpha = 0.08;
        ctx!.fillStyle = grainTile;
        ctx!.fillRect(0, 0, w, h);
        ctx!.restore();
      }
      const v = ctx!.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.8);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx!.fillStyle = v;
      ctx!.fillRect(0, 0, w, h);
    }

    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      field();
      grid();
      wedge();
      rings();
      finish();
      raf = requestAnimationFrame(frame);
    }

    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = e.clientY / window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(frame);

    const obs = new MutationObserver(() => { C = read(); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-flavour"] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      obs.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="wall" data-flavour={flavour} aria-hidden />;
}

/* hex (#rgb/#rrggbb) → rgba() at a given alpha */
function hexA(hex: string, a: number): string {
  let s = hex.trim().replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s, 16);
  if (Number.isNaN(n)) return `rgba(255,255,255,${a})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
