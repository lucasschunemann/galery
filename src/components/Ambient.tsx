import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useOS } from "../os/store";

/* ============================================================
   AMBIENT.

   An empty workspace is the one place this system is allowed to
   show off, because there is nothing to read over. So each theme
   gets a figure of its own, taken from the same lineage the
   palette came from:

     braun     a Braun wall clock, telling the actual time
     zurich    a Müller-Brockmann grid of dots, pulsing on the diagonal
     holanda   a De Stijl grid, colour migrating cell to cell
     alemanha  the Bauhaus primitives in orbit
     brasil    Burle Marx colour fields, drifting
     graphite  embers off hot charcoal
     nino      the faces, now floating

   These bleed off the right edge, poster-scale — the reference is
   less "polite desktop widget" and more the kind of framed print a
   studio hangs behind the espresso machine. The one restraint that
   survives from the wallpaper's rule: it still lives only where an
   empty workspace has nothing to compete with.

   Everything mounts and unmounts with the empty desk. The moment
   a window opens, this is gone.
   ============================================================ */

type Still = { still: boolean };

/** cursor position, springed — the poster leans toward whoever is looking */
function usePointerTilt(still: boolean) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  useEffect(() => {
    if (still) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [still, mx, my]);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  return {
    x: useTransform(sx, (v) => v * -26),
    y: useTransform(sy, (v) => v * -18),
    rotate: useTransform(sx, (v) => v * -3),
  };
}

/** the shared drawing field: every staged figure is 200×200, bled to the edge */
function Stage({ piece, children }: { piece: string; children: React.ReactNode }) {
  const still = !!useReducedMotion();
  const tilt = usePointerTilt(still);
  return (
    <motion.div className="amb__stage" data-piece={piece} style={still ? undefined : tilt}>
      <svg viewBox="0 0 200 200" className="amb__svg">{children}</svg>
    </motion.div>
  );
}

/** SVG groups rotate about the field's centre, not their own bounding box */
const pivot = { transformOrigin: "100px 100px", transformBox: "view-box" } as const;

const turn = (dur: number, dir: 1 | -1 = 1) => ({
  animate: { rotate: 360 * dir },
  transition: { duration: dur, repeat: Infinity, ease: "linear" as const },
});

/* ---------------------------------------------------------------- braun */

/* Rams and Lubs, the wall clock: a plain face, bar markers, and the
   one yellow hand. It keeps real time, so it is the only figure here
   that is doing something rather than being something. */
function BraunClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const s = now.getSeconds();
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;

  const hand = (deg: number, len: number, w: number, stroke: string) => (
    <line
      x1={100} y1={100 + w * 2} x2={100} y2={100 - len}
      stroke={stroke} strokeWidth={w} strokeLinecap="round"
      transform={`rotate(${deg} 100 100)`}
    />
  );

  return (
    <Stage piece="braun">
      <circle cx="100" cy="100" r="92" fill="var(--n-0)" stroke="var(--line-strong)" strokeWidth="1.5" />
      {Array.from({ length: 60 }, (_, i) => {
        const big = i % 5 === 0;
        const a = (i * 6 * Math.PI) / 180;
        const r0 = big ? 73 : 79;
        return (
          <line
            key={i}
            x1={100 + Math.sin(a) * r0} y1={100 - Math.cos(a) * r0}
            x2={100 + Math.sin(a) * 84} y2={100 - Math.cos(a) * 84}
            stroke="var(--text)" strokeWidth={big ? 3 : 1} opacity={big ? 0.75 : 0.28}
          />
        );
      })}
      {hand(h * 30, 44, 6, "var(--text)")}
      {hand(m * 6, 68, 4.5, "var(--text)")}
      {hand(s * 6, 78, 1.6, "var(--accent)")}
      <circle cx="100" cy="100" r="4" fill="var(--accent)" />
    </Stage>
  );
}

/* --------------------------------------------------------------- zurich */

/* Not the Beethoven arcs — the other Müller-Brockmann move, the one
   that ends up on the cover of every "grid systems" book: a field of
   circles whose radius is set by a rule, not by hand, so size reads
   as a diagonal progression rather than a decorative scatter. A slow
   pulse sweeps the same diagonal, one cell of delay at a time. */
const GRID = 8;
function ZurichGrid({ still }: Still) {
  const dots = useMemo(() => {
    const cell = 200 / GRID;
    const out: { x: number; y: number; base: number; accent: boolean; delay: number }[] = [];
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const d = (col + row) / (GRID * 2 - 2);
        out.push({
          x: cell * (col + 0.5),
          y: cell * (row + 0.5),
          base: 2 + d * 8.5,
          accent: (col + row) % 7 === 3,
          delay: (col + row) * 0.055,
        });
      }
    }
    return out;
  }, []);

  return (
    <Stage piece="zurich">
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.x}
          cy={d.y}
          fill={d.accent ? "var(--accent)" : "var(--text)"}
          opacity={d.accent ? 0.88 : 0.5}
          initial={{ r: d.base }}
          animate={still ? undefined : { r: [d.base, d.base * 1.6, d.base] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: d.delay }}
        />
      ))}
    </Stage>
  );
}

/* -------------------------------------------------------------- holanda */

/* De Stijl: the grid holds still and only the colour moves through it,
   one cell at a time. Mondrian did the same thing to Broadway. */
const CELLS = [
  { x: 0,   y: 0,   w: 116, h: 116 },
  { x: 124, y: 0,   w: 76,  h: 50 },
  { x: 124, y: 58,  w: 76,  h: 58 },
  { x: 0,   y: 124, w: 54,  h: 76 },
  { x: 62,  y: 124, w: 54,  h: 76 },
  { x: 124, y: 124, w: 76,  h: 76 },
];
const PAL = ["var(--n-0)", "var(--accent)", "var(--n-0)", "var(--accent-2)", "var(--n-0)", "var(--accent-3)"];

function DeStijl({ still }: Still) {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => setBeat((b) => b + 1), 4200);
    return () => clearInterval(id);
  }, [still]);

  return (
    <Stage piece="holanda">
      {CELLS.map((c, i) => (
        <motion.rect
          key={i}
          x={c.x} y={c.y} width={c.w} height={c.h}
          stroke="var(--text)" strokeWidth="4"
          animate={{ fill: PAL[(i + beat) % PAL.length] }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
      ))}
    </Stage>
  );
}

/* ------------------------------------------------------------- alemanha */

/* Circle, square, triangle — the Bauhaus primitives, each on its own
   orbit at its own speed, so they only occasionally line up. */
/* the palette is the flag, so black takes the circle; it carries more
   weight than the other two at the same opacity and is dialled back */
const PRIMITIVES = [
  { dur: 168, o: 0.62, node: <circle cx="100" cy="100" r="23" fill="var(--accent-3)" /> },
  { dur: 124, o: 0.8,  node: <rect x="79" y="79" width="42" height="42" fill="var(--accent)" /> },
  { dur: 202, o: 0.88, node: <path d="M100 76 L124 121 L76 121 Z" fill="var(--accent-2)" /> },
];

function Bauhaus({ still }: Still) {
  return (
    <Stage piece="alemanha">
      <circle cx="100" cy="100" r="56" fill="none" stroke="var(--text)" strokeWidth="1.5" opacity="0.3" />
      {PRIMITIVES.map((p, i) => (
        <motion.g key={i} style={pivot} {...(still ? {} : turn(p.dur, i % 2 ? -1 : 1))}>
          <g transform={`rotate(${i * 120} 100 100) translate(0 -56)`} opacity={p.o}>
            {p.node}
          </g>
        </motion.g>
      ))}
    </Stage>
  );
}

/* --------------------------------------------------------------- brasil */

/* Burle Marx laid gardens out as flat overlapping colour, and Niemeyer
   said it was the free curve he was after and not the right angle.
   Three fields, drifting slowly enough that you catch it only if you
   look away and come back. */
/* the shapes have to hook inward somewhere or they read as three
   circles on top of each other, which is decoration and not a plan */
const FIELDS = [
  { d: "M30,120 C14,84 34,40 76,32 C110,26 136,46 132,72 C129,92 106,96 92,86 C74,73 54,84 58,106 C63,134 96,146 124,136 C150,127 164,142 150,158 C130,180 84,178 58,160 C36,145 38,140 30,120 Z",
    fill: "var(--accent)",   o: 0.5, dur: 68,  x: 12,  y: -9, rot: 6 },
  { d: "M22,88 C34,52 76,34 116,42 C152,49 176,74 170,102 C165,126 138,132 118,124 C100,117 84,124 84,140 C84,158 66,168 48,158 C26,146 12,120 22,88 Z",
    fill: "var(--accent-2)", o: 0.44, dur: 86,  x: -14, y: 11, rot: -8 },
  { d: "M56,150 C30,138 24,104 44,80 C64,56 100,52 122,66 C140,77 138,96 122,102 C106,108 96,122 108,134 C122,148 152,144 162,158 C172,172 140,182 108,178 C84,175 74,158 56,150 Z",
    fill: "var(--accent-3)", o: 0.4, dur: 104, x: 9,   y: 14, rot: 5 },
];

function BurleMarx({ still }: Still) {
  return (
    <Stage piece="brasil">
      {FIELDS.map((f, i) => (
        <motion.path
          key={i}
          d={f.d} fill={f.fill} opacity={f.o}
          style={{ ...pivot, mixBlendMode: "multiply" }}
          animate={still ? undefined : { x: [0, f.x, 0], y: [0, f.y, 0], rotate: [0, f.rot, 0] }}
          transition={{ duration: f.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </Stage>
  );
}

/* ------------------------------------------------------------- graphite */

/* The only dark theme, so it gets the only figure made of light.
   Its accent is cool, not orange, so these are motes caught in it
   rather than sparks off the charcoal underneath.

   Driven by CSS rather than Motion for one reason: a negative
   animation-delay starts a particle mid-flight, so the field is
   already drifting the instant it mounts. Staggering with positive
   delays left the screen empty for the first twenty seconds. */
function Motes({ still }: Still) {
  const bits = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        rise: 240 + Math.random() * 460,
        dur: 9 + Math.random() * 13,
        delay: -Math.random() * 22,
        peak: 0.18 + Math.random() * 0.4,
      })),
    []
  );

  if (still) return null;

  return (
    <div className="amb__motes">
      {bits.map((b) => (
        <i
          key={b.id}
          className="amb__mote"
          style={{
            left: `${b.x}%`,
            width: b.size,
            height: b.size,
            "--rise": `${b.rise}px`,
            "--dur": `${b.dur}s`,
            "--delay": `${b.delay}s`,
            "--peak": b.peak,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- nino */

/* The one piece of pure ornament in the system, kept because it earns
   its place by being funny rather than by being justified. */
/** the home card is pinned left of centre — scatter around it, not on it */
function spot() {
  for (let i = 0; i < 24; i++) {
    const x = 4 + Math.random() * 90;
    const y = 8 + Math.random() * 82;
    if (x < 36 && y > 20 && y < 78) continue;
    return { x, y };
  }
  return { x: 58 + Math.random() * 36, y: 8 + Math.random() * 82 };
}

function NinoFaces({ still }: Still) {
  const marks = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        id: i,
        ...spot(),
        r: Math.random() * 36 - 18,
        s: 0.65 + Math.random() * 0.85,
        d: Math.random() * 0.7,
        float: 6 + Math.random() * 12,
        dur: 7 + Math.random() * 7,
      })),
    []
  );

  return (
    <div className="amb__marks">
      {marks.map((m) => (
        <motion.span
          key={m.id}
          className="amb__mark"
          style={{ left: `${m.x}%`, top: `${m.y}%`, rotate: `${m.r}deg`, scale: m.s }}
          initial={{ opacity: 0 }}
          animate={
            still
              ? { opacity: 1 }
              : { opacity: 1, y: [0, -m.float, 0] }
          }
          transition={{
            opacity: { duration: 0.5, delay: m.d },
            y: { duration: m.dur, repeat: Infinity, ease: "easeInOut", delay: m.d },
          }}
        >
          {">:]"}
        </motion.span>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- host */

export default function Ambient() {
  const flavour = useOS((s) => s.flavour);
  const still = !!useReducedMotion();

  const piece = () => {
    switch (flavour) {
      case "braun": return <BraunClock />;
      case "zurich": return <ZurichGrid still={still} />;
      case "holanda": return <DeStijl still={still} />;
      case "alemanha": return <Bauhaus still={still} />;
      case "brasil": return <BurleMarx still={still} />;
      case "graphite": return <Motes still={still} />;
      case "nino": return <NinoFaces still={still} />;
      default: return null;
    }
  };

  /* keyed on the theme so switching themes rebuilds the figure from
     scratch — the random scatters get a fresh draw each time */
  return (
    <motion.div
      key={flavour}
      className="amb"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.24 } }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {piece()}
    </motion.div>
  );
}
