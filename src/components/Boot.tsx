import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOS } from "../os/store";
import { SFX, unlockAudio } from "../os/sound";

const LOG = [
  ["0.0004", "helvetia kernel 1.0.0-swiss"],
  ["0.0121", "reached target local filesystems"],
  ["0.0388", "starting compositor · wayland"],
  ["0.0712", "loading layout engine · dwindle"],
  ["0.1140", "gaps  outer 14  inner 10"],
  ["0.1663", "mounting /home/lucas"],
  ["0.2291", "palette · graphite  accent #ff4d2e"],
  ["0.3018", "grid  12 columns  baseline 8"],
  ["0.4102", "typeface  mono + grotesk  ok"],
  ["0.5330", "starting session for lucas"],
];

export default function Boot() {
  const phase = useOS((s) => s.phase);
  const setPhase = useOS((s) => s.setPhase);
  const sound = useOS((s) => s.sound);
  const [started, setStarted] = useState(false);
  const [line, setLine] = useState(0);
  const [pct, setPct] = useState(0);
  const done = useRef(false);

  const on = phase === "boot";

  useEffect(() => {
    if (!started) return;
    const t0 = performance.now();
    const DUR = 2600;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR);
      setPct(p);
      setLine(Math.min(LOG.length, Math.floor(p * (LOG.length + 1))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        setTimeout(() => setPhase("lock"), 520);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, setPhase]);

  const power = () => {
    unlockAudio();
    if (sound) setTimeout(() => SFX.boot(), 40);
    setStarted(true);
  };

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          className="boot"
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="boot__marks" aria-hidden>
            {["tl", "tr", "bl", "br"].map((c) => (
              <span key={c} className={`boot__mark boot__mark--${c}`} />
            ))}
          </div>

          <div className="boot__stage">
            <motion.h1
              className="boot__word t-display"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              HELVETIA
            </motion.h1>

            <motion.p
              className="boot__sub t-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              um sistema operacional no estilo internacional
            </motion.p>

            <AnimatePresence mode="wait">
              {!started ? (
                <motion.button
                  key="go"
                  className="boot__power"
                  onClick={power}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                >
                  <span className="boot__power-dot" aria-hidden />
                  iniciar sessão
                  <kbd>⏎</kbd>
                </motion.button>
              ) : (
                <motion.div
                  key="log"
                  className="boot__loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="boot__track">
                    <span className="boot__fill" style={{ transform: `scaleX(${pct})` }} />
                  </div>
                  <ul className="boot__log">
                    {LOG.slice(0, line).map(([ts, msg]) => (
                      <motion.li
                        key={ts}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <span className="boot__ts">[ {ts} ]</span> {msg}
                        <span className="boot__ok">ok</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="boot__foot t-mono">
            lucas schünemann · portfólio · {new Date().getFullYear()}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
