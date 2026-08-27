import { useEffect, useRef } from "react";
import { useOS } from "../os/store";

/* ============================================================
   WALLPAPER — where the two languages meet.

   Aero  : volumetric sky, lit clouds, sun with anamorphic flare,
           iridescent soap bubbles.
   Swiss : a fan of concentric arcs anchored off-canvas, stroke
           weights following a geometric progression — one single
           geometric gesture, rendered in chrome so it belongs to
           the material world around it.

   Everything is procedural and re-tints from CSS custom properties.
   ============================================================ */

type Bubble = { x: number; y: number; r: number; speed: number; drift: number; phase: number; alpha: number };
type Cloud = { sprite: HTMLCanvasElement; x: number; y: number; scale: number; layer: number; alpha: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* ---------------------------------------------------------------
   A cloud is baked once into its own sprite: a shadowed silhouette
   with a lit cap composited on top. Blitting sprites is what buys
   the volume — per-frame radial gradients cannot afford it.
   --------------------------------------------------------------- */
function makeCloud(w: number): HTMLCanvasElement {
  const h = Math.round(w * 0.58);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;

  const blobs: { cx: number; cy: number; r: number }[] = [];
  const n = 7 + Math.floor(rand(0, 5));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    blobs.push({
      cx: w * (0.12 + t * 0.76) + rand(-1, 1) * w * 0.05,
      cy: h * (0.62 - Math.sin(t * Math.PI) * 0.24) + rand(-1, 1) * h * 0.05,
      r: h * rand(0.26, 0.46) * (0.62 + Math.sin(t * Math.PI) * 0.6),
    });
  }

  // 1 — shadowed body, a cool grey-blue underside
  for (const b of blobs) {
    const g = x.createRadialGradient(b.cx, b.cy, b.r * 0.05, b.cx, b.cy, b.r);
    g.addColorStop(0, "rgba(196,216,238,0.95)");
    g.addColorStop(0.55, "rgba(196,216,238,0.62)");
    g.addColorStop(1, "rgba(196,216,238,0)");
    x.fillStyle = g;
    x.beginPath();
    x.arc(b.cx, b.cy, b.r, 0, Math.PI * 2);
    x.fill();
  }

  // 2 — the lit cap, painted only where the body already is
  x.globalCompositeOperation = "source-atop";
  for (const b of blobs) {
    const ly = b.cy - b.r * 0.34;
    const g = x.createRadialGradient(b.cx, ly, b.r * 0.04, b.cx, ly, b.r * 0.92);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,0.72)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.beginPath();
    x.arc(b.cx, ly, b.r * 0.92, 0, Math.PI * 2);
    x.fill();
  }
  x.globalCompositeOperation = "source-over";
  return c;
}

/** a tiny noise tile, used as a repeating pattern for film grain */
function makeGrain(size = 128): HTMLCanvasElement {
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

export default function Wallpaper() {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useOS((s) => s.theme);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, t = 0, raf = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let bubbles: Bubble[] = [];
    let clouds: Cloud[] = [];
    let colors = readColors();
    const grain = makeGrain();
    let grainPattern: CanvasPattern | null = null;

    function readColors() {
      const cs = getComputedStyle(document.documentElement);
      const g = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      return {
        top: g("--sky-top", "#1f6fd0"),
        mid: g("--sky-mid", "#6fc0f7"),
        low: g("--sky-low", "#cfeeff"),
        landHi: g("--land-hi", "#9ddb4e"),
        landLo: g("--land-lo", "#2f7d1f"),
      };
    }

    function seed() {
      bubbles = Array.from({ length: 16 }, () => ({
        x: rand(0, w),
        y: rand(0, h * 1.4),
        r: rand(6, 58),
        speed: rand(7, 24),
        drift: rand(10, 32),
        phase: rand(0, Math.PI * 2),
        alpha: rand(0.28, 0.75),
      }));

      // three depth layers; near clouds are bigger, slower to parallax
      clouds = [];
      const perLayer = [3, 4, 5];
      for (let layer = 0; layer < 3; layer++) {
        for (let i = 0; i < perLayer[layer]; i++) {
          const base = w * (0.34 - layer * 0.07);
          clouds.push({
            sprite: makeCloud(Math.round(rand(base * 0.7, base * 1.15))),
            x: rand(-0.15, 1.15) * w,
            y: h * (0.05 + layer * 0.11) + rand(-0.04, 0.06) * h,
            scale: 1,
            layer,
            alpha: 0.9 - layer * 0.2,
          });
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cv!.width = Math.floor(w * dpr);
      cv!.height = Math.floor(h * dpr);
      cv!.style.width = w + "px";
      cv!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      grainPattern = ctx!.createPattern(grain, "repeat");
      seed();
    }

    /* ------------------------- passes ------------------------- */

    function sky() {
      const g = ctx!.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, colors.top);
      g.addColorStop(0.42, colors.mid);
      g.addColorStop(0.78, colors.low);
      g.addColorStop(1, colors.low);
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);
    }

    function sun() {
      const sx = w * 0.79 + (mouse.x - 0.5) * -20;
      const sy = h * 0.15 + (mouse.y - 0.5) * -12;
      const pulse = 1 + Math.sin(t * 0.55) * 0.025;

      const glow = ctx!.createRadialGradient(sx, sy, 0, sx, sy, 380 * pulse);
      glow.addColorStop(0, "rgba(255,255,255,0.96)");
      glow.addColorStop(0.11, "rgba(255,255,248,0.5)");
      glow.addColorStop(0.4, "rgba(255,250,224,0.14)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(sx - 400, sy - 400, 800, 800);

      ctx!.save();
      ctx!.globalCompositeOperation = "lighter";
      const streak = ctx!.createLinearGradient(sx - 460, sy, sx + 460, sy);
      streak.addColorStop(0, "rgba(255,255,255,0)");
      streak.addColorStop(0.5, "rgba(206,238,255,0.26)");
      streak.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = streak;
      ctx!.fillRect(sx - 460, sy - 2, 920, 4);
      ctx!.restore();
    }

    /* --- the Swiss gesture: one fan of concentric arcs, in chrome --- */
    function arcs() {
      const ox = w * 1.04;
      const oy = h * -0.14;
      const spin = t * 0.011;

      ctx!.save();
      ctx!.translate(ox, oy);
      ctx!.rotate(spin + (mouse.x - 0.5) * 0.045);
      ctx!.lineCap = "butt";

      const base = Math.max(w, h) * 0.19;
      const K = 1.185;                      // geometric progression of radii
      const A0 = Math.PI * 0.5;
      const A1 = Math.PI * 1.06;

      for (let i = 0; i < 10; i++) {
        const r = base * Math.pow(K, i);
        // stroke weight rides its own progression — the Basel cadence
        const lw = 1.5 + Math.pow(i / 9, 2) * 30;
        const breathe = Math.sin(t * 0.35 + i * 0.55) * 0.035;
        const a = Math.max(0, 0.3 - i * 0.017 + breathe);
        if (a <= 0.005) continue;

        // the band: brushed chrome, brightest where the light would catch
        const g = ctx!.createLinearGradient(-r, 0, r * 0.15, r);
        g.addColorStop(0, `rgba(255,255,255,${a * 0.35})`);
        g.addColorStop(0.34, `rgba(236,250,255,${a})`);
        g.addColorStop(0.52, `rgba(255,255,255,${a * 1.5})`);
        g.addColorStop(0.68, `rgba(170,208,246,${a * 0.75})`);
        g.addColorStop(1, `rgba(214,238,255,${a * 0.3})`);
        ctx!.strokeStyle = g;
        ctx!.lineWidth = lw;
        ctx!.beginPath();
        ctx!.arc(0, 0, r, A0, A1);
        ctx!.stroke();

        // the specular edge that turns a band into polished metal
        if (lw > 4) {
          ctx!.strokeStyle = `rgba(255,255,255,${a * 1.25})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.arc(0, 0, r - lw / 2 + 0.5, A0, A1);
          ctx!.stroke();
          ctx!.strokeStyle = `rgba(96,150,210,${a * 0.5})`;
          ctx!.beginPath();
          ctx!.arc(0, 0, r + lw / 2 - 0.5, A0, A1);
          ctx!.stroke();
        }
      }
      ctx!.restore();
    }

    function drawClouds() {
      for (const c of clouds) {
        const par = 1 + c.layer * 0.9;
        const speed = 5 + c.layer * 7;
        const span = w + c.sprite.width * 2;
        let x = (c.x + t * speed - (mouse.x - 0.5) * 14 * par) % span;
        if (x < -c.sprite.width) x += span;
        x -= c.sprite.width;
        const y = c.y - (mouse.y - 0.5) * 9 * par;

        ctx!.globalAlpha = c.alpha;
        ctx!.drawImage(c.sprite, x, y);
        ctx!.globalAlpha = 1;
      }
    }

    function hill() {
      const base = h * 0.76;
      const sway = Math.sin(t * 0.1) * 3;

      // atmospheric haze sitting on the horizon
      const haze = ctx!.createLinearGradient(0, base - 150, 0, base + 24);
      haze.addColorStop(0, "rgba(255,255,255,0)");
      haze.addColorStop(1, "rgba(255,255,255,0.3)");
      ctx!.fillStyle = haze;
      ctx!.fillRect(0, base - 150, w, 174);

      ctx!.save();
      ctx!.beginPath();
      ctx!.moveTo(-10, h + 10);
      ctx!.lineTo(-10, base + 42);
      ctx!.bezierCurveTo(w * 0.2, base - 66 + sway, w * 0.44, base - 92 - sway, w * 0.68, base - 22);
      ctx!.bezierCurveTo(w * 0.84, base + 16, w * 0.93, base + 6, w + 10, base + 32);
      ctx!.lineTo(w + 10, h + 10);
      ctx!.closePath();

      const g = ctx!.createLinearGradient(0, base - 90, 0, h);
      g.addColorStop(0, colors.landHi);
      g.addColorStop(0.4, colors.landHi);
      g.addColorStop(1, colors.landLo);
      ctx!.fillStyle = g;
      ctx!.fill();

      ctx!.clip();
      const rim = ctx!.createLinearGradient(0, base - 100, 0, base + 40);
      rim.addColorStop(0, "rgba(255,255,255,0.5)");
      rim.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = rim;
      ctx!.fillRect(0, base - 110, w, 160);
      ctx!.restore();
    }

    function bubble(b: Bubble) {
      const x = b.x + Math.sin(t * 0.45 + b.phase) * b.drift + (mouse.x - 0.5) * -26;
      const y = b.y + (mouse.y - 0.5) * -14;
      const r = b.r;

      ctx!.save();
      ctx!.globalAlpha = b.alpha;

      const body = ctx!.createRadialGradient(x - r * 0.3, y - r * 0.34, r * 0.05, x, y, r);
      body.addColorStop(0, "rgba(255,255,255,0.4)");
      body.addColorStop(0.62, "rgba(190,235,255,0.09)");
      body.addColorStop(1, "rgba(255,255,255,0.04)");
      ctx!.fillStyle = body;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.globalCompositeOperation = "lighter";
      const anyCtx = ctx as unknown as {
        createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
      };
      let rim: CanvasGradient;
      if (anyCtx.createConicGradient) {
        rim = anyCtx.createConicGradient(t * 0.3 + b.phase, x, y);
        rim.addColorStop(0, "rgba(255,120,220,0.5)");
        rim.addColorStop(0.22, "rgba(120,240,255,0.5)");
        rim.addColorStop(0.48, "rgba(170,255,150,0.45)");
        rim.addColorStop(0.72, "rgba(255,235,130,0.5)");
        rim.addColorStop(1, "rgba(255,120,220,0.5)");
      } else {
        rim = ctx!.createLinearGradient(x - r, y - r, x + r, y + r);
        rim.addColorStop(0, "rgba(255,120,220,0.45)");
        rim.addColorStop(0.5, "rgba(120,240,255,0.45)");
        rim.addColorStop(1, "rgba(255,235,130,0.45)");
      }
      ctx!.strokeStyle = rim;
      ctx!.lineWidth = Math.max(1, r * 0.085);
      ctx!.beginPath();
      ctx!.arc(x, y, r * 0.95, 0, Math.PI * 2);
      ctx!.stroke();

      ctx!.globalCompositeOperation = "source-over";
      ctx!.fillStyle = "rgba(255,255,255,0.85)";
      ctx!.beginPath();
      ctx!.ellipse(x - r * 0.34, y - r * 0.4, r * 0.23, r * 0.15, -0.6, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = "rgba(255,255,255,0.45)";
      ctx!.beginPath();
      ctx!.arc(x + r * 0.36, y + r * 0.42, r * 0.085, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.restore();
    }

    function finish() {
      // film grain — the one modern texture that makes gradients feel printed
      if (grainPattern) {
        ctx!.save();
        ctx!.globalCompositeOperation = "overlay";
        ctx!.globalAlpha = 0.055;
        ctx!.fillStyle = grainPattern;
        ctx!.fillRect(0, 0, w, h);
        ctx!.restore();
      }
      const vig = ctx!.createRadialGradient(w / 2, h * 0.44, Math.min(w, h) * 0.32, w / 2, h * 0.44, Math.max(w, h) * 0.78);
      vig.addColorStop(0, "rgba(0,10,30,0)");
      vig.addColorStop(1, "rgba(0,12,34,0.3)");
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, w, h);
    }

    /* ------------------------- loop ------------------------- */

    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      mouse.x += (mouse.tx - mouse.x) * 0.055;
      mouse.y += (mouse.ty - mouse.y) * 0.055;

      sky();
      sun();
      arcs();
      drawClouds();
      hill();
      for (const b of bubbles) {
        b.y -= b.speed * dt;
        if (b.y < -b.r * 2) {
          b.y = h + b.r * 2;
          b.x = rand(0, w);
          b.r = rand(6, 58);
        }
        bubble(b);
      }
      finish();

      raf = requestAnimationFrame(frame);
    }

    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(frame);

    const obs = new MutationObserver(() => { colors = readColors(); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      obs.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="wallpaper" aria-hidden />;
}
