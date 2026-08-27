import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useOS } from "../os/store";

/* ============================================================
   The Swiss layer over the desktop: a modular grid, registration
   marks, a typographic rail and a bar rhythm. None of it is
   interactive — it is the printed page the OS sits on.
   ============================================================ */

const COLS = 12;

export default function DesktopGrid() {
  const theme = useOS((s) => s.theme);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const i = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const stamp = clock
    .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .replace(/:/g, ".");

  return (
    <div className="dgrid" aria-hidden>
      {/* --- modular grid: column hairlines --- */}
      <motion.div
        className="dgrid__cols"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 1.4 }}
      >
        {Array.from({ length: COLS - 1 }, (_, i) => (
          <span key={i} style={{ left: `${((i + 1) / COLS) * 100}%` }} />
        ))}
      </motion.div>

      {/* --- registration marks, one per corner --- */}
      {(["tl", "tr", "bl", "br"] as const).map((c, i) => (
        <motion.svg
          key={c}
          className={`dgrid__mark dgrid__mark--${c}`}
          viewBox="0 0 28 28"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <path d="M14 0v10M14 18v10M0 14h10M18 14h10" stroke="currentColor" strokeWidth="1" />
          <circle cx="14" cy="14" r="6.5" fill="none" stroke="currentColor" strokeWidth="1" />
        </motion.svg>
      ))}

      {/* --- vertical typographic rail --- */}
      <div className="dgrid__rail-wrap">
        <motion.p
          className="dgrid__rail"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          AERO OS <span>—</span> INTERNATIONAL EDITION <span>—</span> MMXXVI
        </motion.p>
      </div>

      {/* --- bar rhythm: a Basel cadence, not decoration --- */}
      <div className="dgrid__bars">
        {[1, 2, 3, 5, 8, 5, 3, 2, 1].map((n, i) => (
          <motion.span
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 1.4 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: n * 7 }}
          />
        ))}
      </div>

      {/* --- data block --- */}
      <motion.dl
        className="dgrid__data"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <div><dt>SESSÃO</dt><dd>{stamp}</dd></div>
        <div><dt>APARÊNCIA</dt><dd>{theme.toUpperCase()}</dd></div>
        <div><dt>GRADE</dt><dd>{COLS} COL</dd></div>
      </motion.dl>
    </div>
  );
}
