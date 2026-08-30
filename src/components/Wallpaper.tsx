import { useEffect, useRef } from "react";
import { useOS } from "../os/store";

/* ============================================================
   WALLPAPER.

   A desktop still needs a ground, but this one is meant to be
   forgotten: a near-flat field, one slow mass of light, a faint
   modular grid, and grain to keep the gradient from banding.

   The light is not decorative. It sits where the sun would sit
   at the reader's actual hour and carries the colour temperature
   of that hour, so the room at seven in the morning is not the
   room at midnight. Nobody is meant to notice this. It is the
   kind of change you feel a week later without being able to
   say what moved.

   The test for everything else: if you notice it while reading a
   window, it is too loud.
   ============================================================ */

/** where the light sits, and how warm it is, at a given hour */
function daylight(now: Date) {
  const h = now.getHours() + now.getMinutes() / 60;
  // the arc runs from the lower left before dawn to the lower right
  // after dusk, passing overhead around one in the afternoon
  const t = ((h - 6) / 12) * Math.PI;          // 06h → 0, 18h → π
  const above = h > 5.5 && h < 18.5;
  const x = 0.5 - Math.cos(t) * 0.34;
  const y = above ? 0.5 - Math.sin(t) * 0.42 : 0.86;

  // warmth peaks at the two edges of the day and bottoms out at noon
  const noonDistance = Math.min(Math.abs(h - 13), 12) / 12;
  const warmth = above ? Math.pow(noonDistance, 1.6) : 0.12;
  const strength = above ? 0.55 + Math.sin(Math.max(0, t)) * 0.45 : 0.34;

  return { x, y, warmth, strength };
}

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
    let sun = daylight(new Date());
    // the hour only needs checking now and then
    const clock = setInterval(() => { sun = daylight(new Date()); }, 60_000);

    function read() {
      const cs = getComputedStyle(document.documentElement);
      const g = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      return {
        /* fallbacks follow the default theme; the previous ones were
           left over from a palette that no longer exists, so a failed
           read painted a different theme entirely */
        a: g("--wall-a", "#f0efec"),
        b: g("--wall-b", "#f8f7f5"),
        c: g("--wall-c", "#e5e3df"),
        accent: g("--accent", "#d8332a"),
        line: g("--n-40", "#c5c3be"),
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
      if (still) paint();
    }

    function field() {
      const g = ctx!.createLinearGradient(0, 0, w * 0.35, h);
      g.addColorStop(0, C.b);
      g.addColorStop(1, C.a);
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);

      const d = sun;
      // the mass of light, placed at this hour's sun
      const cx = w * d.x + Math.sin(t * 0.021) * 26 + (pointer.x - 0.5) * -18;
      const cy = h * d.y + Math.cos(t * 0.017) * 20 + (pointer.y - 0.5) * -12;
      const r = Math.max(w, h) * 0.82;
      const g2 = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
      g2.addColorStop(0, hexA(C.c, 0.72 * d.strength));
      g2.addColorStop(0.5, hexA(C.c, 0.22 * d.strength));
      g2.addColorStop(1, hexA(C.c, 0));
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, w, h);

      // the hour's colour temperature, laid over the same spot
      if (d.warmth > 0.02) {
        const g3 = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r * 0.8);
        g3.addColorStop(0, `rgba(255, 186, 112, ${0.07 * d.warmth})`);
        g3.addColorStop(1, "rgba(255, 186, 112, 0)");
        ctx!.fillStyle = g3;
        ctx!.fillRect(0, 0, w, h);
      }

      // a single restrained accent, barely above the noise floor
      const ax = w * (1 - d.x) + Math.cos(t * 0.014) * 22;
      const ay = h * (1 - d.y * 0.6);
      const ar = Math.max(w, h) * 0.46;
      const g4 = ctx!.createRadialGradient(ax, ay, 0, ax, ay, ar);
      g4.addColorStop(0, hexA(C.accent, 0.045));
      g4.addColorStop(1, hexA(C.accent, 0));
      ctx!.fillStyle = g4;
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

    /* A portfolio sits open in a background tab for hours. Painting
       a canvas nobody is looking at costs the reader battery for
       nothing, so the loop stops with the tab and picks up again on
       return. Anyone who asked for less motion gets a single frame. */
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** draws exactly one frame */
    function paint() {
      field();
      grid();
      finish();
    }

    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.035;
      pointer.y += (pointer.ty - pointer.y) * 0.035;

      paint();
      // the id has to be cleared when the loop stops, otherwise
      // `repaint` still sees a live frame and declines to draw
      raf = still ? 0 : requestAnimationFrame(frame);
    }

    /* When the loop is stopped (reduced motion, or a hidden tab),
       nothing would ever redraw, so a theme change left the old
       colours on the canvas while the rest of the interface moved on.
       Anything that invalidates the picture repaints it directly. */
    const repaint = () => { if (!raf) paint(); };

    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = e.clientY / window.innerHeight;
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (still) {
        paint();
      } else {
        cancelAnimationFrame(raf);
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    const obs = new MutationObserver(() => { C = read(); repaint(); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-flavour"] });

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(clock);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
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
