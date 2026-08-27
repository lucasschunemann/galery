import { useEffect, useRef } from "react";
import { useOS } from "../os/store";

/* ============================================================
   WALLPAPER — 木漏れ日.

   Not a poster. A room with light in it: four soft colour masses
   drifting on their own slow cycles, one large ring like a paper
   lantern, a faint horizon, and grain. Everything is low
   frequency on purpose — it has to survive 40px of blur behind
   the glass and still be pleasant in the gaps.
   ============================================================ */

type Bloom = {
  hue: "a" | "b" | "c" | "accent";
  x: number; y: number; r: number;
  ax: number; ay: number;   // drift amplitude
  sx: number; sy: number;   // drift speed
  phase: number;
  alpha: number;
};

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
        a: g("--wall-a", "#0c1210"),
        b: g("--wall-b", "#16241f"),
        c: g("--wall-c", "#2b4a3d"),
        accent: g("--accent", "#7fc9a8"),
        light: g("--n-80", "#9fb3ac"),
      };
    }

    const blooms: Bloom[] = [
      { hue: "c",      x: 0.22, y: 0.24, r: 0.66, ax: 0.05, ay: 0.04, sx: 0.037, sy: 0.029, phase: 0.0, alpha: 1 },
      { hue: "c",      x: 0.8,  y: 0.74, r: 0.6,  ax: 0.06, ay: 0.05, sx: 0.024, sy: 0.041, phase: 1.7, alpha: 0.9 },
      { hue: "accent", x: 0.66, y: 0.2,  r: 0.44, ax: 0.07, ay: 0.05, sx: 0.031, sy: 0.023, phase: 3.1, alpha: 0.3 },
      { hue: "b",      x: 0.12, y: 0.84, r: 0.54, ax: 0.04, ay: 0.04, sx: 0.019, sy: 0.033, phase: 4.4, alpha: 0.95 },
    ];

    function makeGrain(size = 150) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const x = c.getContext("2d")!;
      const img = x.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (Math.random() * 2 - 1) * 26;
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

    function base() {
      const g = ctx!.createLinearGradient(0, 0, w * 0.5, h);
      g.addColorStop(0, C.b);
      g.addColorStop(1, C.a);
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);
    }

    /* the soft masses — this is the whole composition */
    function drift() {
      const D = Math.max(w, h);
      for (const b of blooms) {
        const cx = (b.x + Math.sin(t * b.sx + b.phase) * b.ax) * w + (pointer.x - 0.5) * -28;
        const cy = (b.y + Math.cos(t * b.sy + b.phase * 1.3) * b.ay) * h + (pointer.y - 0.5) * -20;
        const r = b.r * D * (1 + Math.sin(t * 0.05 + b.phase) * 0.06);
        const col = b.hue === "accent" ? C.accent : b.hue === "c" ? C.c : C.b;

        const g = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, hexA(col, b.alpha));
        g.addColorStop(0.42, hexA(col, b.alpha * 0.42));
        g.addColorStop(1, hexA(col, 0));
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, w, h);
      }
    }

    /* one large ring, like a paper lantern seen through the room */
    function lantern() {
      const cx = w * 0.7 + Math.sin(t * 0.028) * 24 + (pointer.x - 0.5) * -40;
      const cy = h * 0.34 + Math.cos(t * 0.022) * 18 + (pointer.y - 0.5) * -28;
      const r = Math.min(w, h) * 0.3;

      ctx!.save();
      ctx!.lineWidth = 1.4;
      ctx!.strokeStyle = hexA(C.light, 0.1);
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, Math.PI * 2);
      ctx!.stroke();

      ctx!.lineWidth = 2.2;
      ctx!.strokeStyle = hexA(C.accent, 0.26 + Math.sin(t * 0.3) * 0.07);
      ctx!.beginPath();
      // an open arc, never a closed circle — closed reads as a dial
      ctx!.arc(cx, cy, r, Math.PI * 0.15, Math.PI * 1.28);
      ctx!.stroke();

      const glow = ctx!.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.5);
      glow.addColorStop(0, hexA(C.accent, 0.08));
      glow.addColorStop(1, hexA(C.accent, 0));
      ctx!.fillStyle = glow;
      ctx!.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
      ctx!.restore();
    }

    /* a barely-there horizon: gives the field a floor to sit on */
    function horizon() {
      const y = h * 0.74;
      const g = ctx!.createLinearGradient(0, y - h * 0.2, 0, h);
      g.addColorStop(0, hexA(C.a, 0));
      g.addColorStop(1, hexA(C.a, 0.42));
      ctx!.fillStyle = g;
      ctx!.fillRect(0, y - h * 0.2, w, h * 0.2 + h);
    }

    function finish() {
      if (grainRef.current && grainTile) {
        ctx!.save();
        ctx!.globalCompositeOperation = "overlay";
        ctx!.globalAlpha = 0.06;
        ctx!.fillStyle = grainTile;
        ctx!.fillRect(0, 0, w, h);
        ctx!.restore();
      }
      const v = ctx!.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.max(w, h) * 0.82);
      v.addColorStop(0, hexA(C.a, 0));
      v.addColorStop(1, hexA(C.a, 0.42));
      ctx!.fillStyle = v;
      ctx!.fillRect(0, 0, w, h);
    }

    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;

      base();
      drift();
      lantern();
      horizon();
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

function hexA(hex: string, a: number): string {
  let s = hex.trim().replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s, 16);
  if (Number.isNaN(n)) return `rgba(255,255,255,${a})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
