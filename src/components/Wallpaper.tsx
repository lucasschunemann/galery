import { useEffect, useRef } from "react";
import { useOS } from "../os/store";

/* ============================================================
   The wallpaper is fully procedural: sky gradient, volumetric
   clouds, a Bliss-shaped hill, a sun with anamorphic flare, and
   iridescent soap bubbles that rise and parallax with the mouse.
   Colours are read from CSS custom properties, so switching the
   OS appearance re-tints the entire scene.
   ============================================================ */

type Bubble = {
  x: number; y: number; r: number;
  speed: number; drift: number; phase: number; alpha: number;
};

type Puff = { x: number; y: number; r: number; a: number; layer: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

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

    let w = 0, h = 0, dpr = 1;
    let raf = 0;
    let t = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    let bubbles: Bubble[] = [];
    let puffs: Puff[] = [];
    let colors = readColors();

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
      bubbles = Array.from({ length: 22 }, () => ({
        x: rand(0, w),
        y: rand(0, h * 1.4),
        r: rand(7, 54),
        speed: rand(6, 26),
        drift: rand(10, 34),
        phase: rand(0, Math.PI * 2),
        alpha: rand(0.3, 0.78),
      }));

      puffs = [];
      // three parallax layers of cloud puffs
      for (let layer = 0; layer < 3; layer++) {
        const count = 7 + layer * 5;
        for (let i = 0; i < count; i++) {
          const cx = rand(-0.1, 1.1) * w;
          const cy = rand(0.04, 0.34 + layer * 0.12) * h;
          const scale = (1 - layer * 0.22) * rand(0.75, 1.35);
          // each cloud is a cluster of overlapping blobs
          const blobs = 5 + Math.floor(rand(0, 4));
          for (let b = 0; b < blobs; b++) {
            puffs.push({
              x: cx + rand(-1, 1) * 90 * scale,
              y: cy + rand(-0.35, 0.35) * 34 * scale,
              r: rand(34, 92) * scale,
              a: rand(0.16, 0.5) * (1 - layer * 0.16),
              layer,
            });
          }
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
      seed();
    }

    /* ---------------- scene passes ---------------- */

    function sky() {
      const g = ctx!.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, colors.top);
      g.addColorStop(0.45, colors.mid);
      g.addColorStop(0.82, colors.low);
      g.addColorStop(1, colors.low);
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);
    }

    function sun() {
      const sx = w * 0.78 + (mouse.x - 0.5) * -22;
      const sy = h * 0.17 + (mouse.y - 0.5) * -14;
      const pulse = 1 + Math.sin(t * 0.6) * 0.03;

      const glow = ctx!.createRadialGradient(sx, sy, 0, sx, sy, 340 * pulse);
      glow.addColorStop(0, "rgba(255,255,255,0.95)");
      glow.addColorStop(0.14, "rgba(255,255,245,0.55)");
      glow.addColorStop(0.42, "rgba(255,250,220,0.16)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(sx - 360, sy - 360, 720, 720);

      // anamorphic streak — the horizontal lens flare of every 2004 render
      ctx!.save();
      ctx!.globalCompositeOperation = "lighter";
      const streak = ctx!.createLinearGradient(sx - 420, sy, sx + 420, sy);
      streak.addColorStop(0, "rgba(255,255,255,0)");
      streak.addColorStop(0.5, "rgba(210,240,255,0.30)");
      streak.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = streak;
      ctx!.fillRect(sx - 420, sy - 2.5, 840, 5);

      // ghost aperture discs along the flare axis
      for (let i = 1; i <= 4; i++) {
        const gx = sx + (w / 2 - sx) * (i * 0.42);
        const gy = sy + (h / 2 - sy) * (i * 0.42);
        const gr = 12 + i * 9;
        const gg = ctx!.createRadialGradient(gx, gy, 0, gx, gy, gr);
        gg.addColorStop(0, `rgba(180,230,255,${0.1 - i * 0.015})`);
        gg.addColorStop(0.8, `rgba(255,220,255,${0.06 - i * 0.01})`);
        gg.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.fillStyle = gg;
        ctx!.beginPath();
        ctx!.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    function clouds() {
      ctx!.save();
      for (const p of puffs) {
        const par = (p.layer + 1) * 6;
        const dx = (mouse.x - 0.5) * -par + ((t * (4 + p.layer * 5)) % (w + 400)) - 200;
        const x = ((p.x + dx) % (w + 400) + w + 400) % (w + 400) - 200;
        const y = p.y + (mouse.y - 0.5) * -par * 0.5;

        const g = ctx!.createRadialGradient(x, y - p.r * 0.25, p.r * 0.06, x, y, p.r);
        g.addColorStop(0, `rgba(255,255,255,${p.a})`);
        g.addColorStop(0.55, `rgba(255,255,255,${p.a * 0.5})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(x, y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    function hill() {
      const base = h * 0.74;
      const sway = Math.sin(t * 0.12) * 4;

      ctx!.save();
      ctx!.beginPath();
      ctx!.moveTo(-10, h + 10);
      ctx!.lineTo(-10, base + 40);
      ctx!.bezierCurveTo(w * 0.18, base - 70 + sway, w * 0.42, base - 96 - sway, w * 0.66, base - 26);
      ctx!.bezierCurveTo(w * 0.82, base + 14, w * 0.92, base + 4, w + 10, base + 30);
      ctx!.lineTo(w + 10, h + 10);
      ctx!.closePath();

      const g = ctx!.createLinearGradient(0, base - 90, 0, h);
      g.addColorStop(0, colors.landHi);
      g.addColorStop(0.42, colors.landHi);
      g.addColorStop(1, colors.landLo);
      ctx!.fillStyle = g;
      ctx!.fill();

      // sunlit rim along the crest
      ctx!.clip();
      const rim = ctx!.createLinearGradient(0, base - 100, 0, base + 30);
      rim.addColorStop(0, "rgba(255,255,255,0.55)");
      rim.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = rim;
      ctx!.fillRect(0, base - 110, w, 150);
      ctx!.restore();

      // haze where hill meets sky
      const haze = ctx!.createLinearGradient(0, base - 130, 0, base + 20);
      haze.addColorStop(0, "rgba(255,255,255,0)");
      haze.addColorStop(1, "rgba(255,255,255,0.22)");
      ctx!.fillStyle = haze;
      ctx!.fillRect(0, base - 130, w, 150);
    }

    function bubble(b: Bubble) {
      const x = b.x + Math.sin(t * 0.5 + b.phase) * b.drift + (mouse.x - 0.5) * -30;
      const y = b.y + (mouse.y - 0.5) * -16;
      const r = b.r;

      ctx!.save();
      ctx!.globalAlpha = b.alpha;

      // body: barely-there refraction
      const body = ctx!.createRadialGradient(x - r * 0.3, y - r * 0.34, r * 0.05, x, y, r);
      body.addColorStop(0, "rgba(255,255,255,0.42)");
      body.addColorStop(0.62, "rgba(190,235,255,0.10)");
      body.addColorStop(1, "rgba(255,255,255,0.04)");
      ctx!.fillStyle = body;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();

      // iridescent rim — the thin-film interference that sells "soap"
      ctx!.globalCompositeOperation = "lighter";
      const anyCtx = ctx as unknown as {
        createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
      };
      let rim: CanvasGradient;
      if (anyCtx.createConicGradient) {
        rim = anyCtx.createConicGradient(t * 0.35 + b.phase, x, y);
        rim.addColorStop(0, "rgba(255,120,220,0.55)");
        rim.addColorStop(0.22, "rgba(120,240,255,0.55)");
        rim.addColorStop(0.48, "rgba(170,255,150,0.5)");
        rim.addColorStop(0.72, "rgba(255,235,130,0.55)");
        rim.addColorStop(1, "rgba(255,120,220,0.55)");
      } else {
        rim = ctx!.createLinearGradient(x - r, y - r, x + r, y + r);
        rim.addColorStop(0, "rgba(255,120,220,0.5)");
        rim.addColorStop(0.5, "rgba(120,240,255,0.5)");
        rim.addColorStop(1, "rgba(255,235,130,0.5)");
      }
      ctx!.strokeStyle = rim;
      ctx!.lineWidth = Math.max(1, r * 0.09);
      ctx!.beginPath();
      ctx!.arc(x, y, r * 0.95, 0, Math.PI * 2);
      ctx!.stroke();

      // two speculars: a big soft one and a tiny hard one
      ctx!.globalCompositeOperation = "source-over";
      ctx!.fillStyle = "rgba(255,255,255,0.85)";
      ctx!.beginPath();
      ctx!.ellipse(x - r * 0.34, y - r * 0.4, r * 0.24, r * 0.16, -0.6, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = "rgba(255,255,255,0.5)";
      ctx!.beginPath();
      ctx!.arc(x + r * 0.36, y + r * 0.42, r * 0.09, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.restore();
    }

    /* ---------------- loop ---------------- */

    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      sky();
      sun();
      clouds();
      hill();

      for (const b of bubbles) {
        b.y -= b.speed * dt;
        if (b.y < -b.r * 2) {
          b.y = h + b.r * 2;
          b.x = rand(0, w);
          b.r = rand(7, 54);
        }
        bubble(b);
      }

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

    // re-read palette whenever the appearance changes
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
