import { useEffect, useRef } from "react";
import { useOS } from "../os/store";

/* ============================================================
   WALLPAPER.

   A desktop still needs a ground, but this one is meant to be
   forgotten: a near-flat neutral field, one very slow accent
   glow, a faint modular grid inherited from Total Design, and
   grain to keep the gradient from banding.

   The test is simple — if you notice it while reading a window,
   it is too loud.
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
        a: g("--wall-a", "#08090a"),
        b: g("--wall-b", "#0d0e10"),
        c: g("--wall-c", "#16171b"),
        accent: g("--accent", "#6e79d6"),
        line: g("--n-40", "#2e3034"),
      };
    }

    function makeGrain(size = 160) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const x = c.getContext("2d")!;
      const img = x.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (Math.random() * 2 - 1) * 22;
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

    function field() {
      const g = ctx!.createLinearGradient(0, 0, w * 0.35, h);
      g.addColorStop(0, C.b);
      g.addColorStop(1, C.a);
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);

      // one wide, very slow mass — it reads as light in the room
      const cx = w * (0.72 + Math.sin(t * 0.021) * 0.05) + (pointer.x - 0.5) * -18;
      const cy = h * (0.18 + Math.cos(t * 0.017) * 0.05) + (pointer.y - 0.5) * -12;
      const r = Math.max(w, h) * 0.78;
      const g2 = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
      g2.addColorStop(0, hexA(C.c, 0.7));
      g2.addColorStop(0.5, hexA(C.c, 0.22));
      g2.addColorStop(1, hexA(C.c, 0));
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, w, h);

      // and a single restrained accent, barely above the noise floor
      const ax = w * (0.24 + Math.cos(t * 0.014) * 0.04);
      const ay = h * (0.76 + Math.sin(t * 0.019) * 0.04);
      const ar = Math.max(w, h) * 0.46;
      const g3 = ctx!.createRadialGradient(ax, ay, 0, ax, ay, ar);
      g3.addColorStop(0, hexA(C.accent, 0.05));
      g3.addColorStop(1, hexA(C.accent, 0));
      ctx!.fillStyle = g3;
      ctx!.fillRect(0, 0, w, h);
    }

    /* the modular grid: present, never assertive */
    function grid() {
      const step = Math.max(72, Math.round(w / 16));
      ctx!.save();
      ctx!.strokeStyle = hexA(C.line, 0.22);
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      for (let x = step; x < w; x += step) {
        ctx!.moveTo(Math.round(x) + 0.5, 0);
        ctx!.lineTo(Math.round(x) + 0.5, h);
      }
      for (let y = step; y < h; y += step) {
        ctx!.moveTo(0, Math.round(y) + 0.5);
        ctx!.lineTo(w, Math.round(y) + 0.5);
      }
      ctx!.stroke();
      ctx!.restore();
    }

    function finish() {
      if (grainRef.current && grainTile) {
        ctx!.save();
        ctx!.globalCompositeOperation = "overlay";
        ctx!.globalAlpha = 0.05;
        ctx!.fillStyle = grainTile;
        ctx!.fillRect(0, 0, w, h);
        ctx!.restore();
      }
    }

    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.035;
      pointer.y += (pointer.ty - pointer.y) * 0.035;

      field();
      grid();
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
