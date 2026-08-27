import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOS } from "../os/store";
import { SFX, unlockAudio } from "../os/sound";
import { gentle, soft } from "../os/motion";

/* Short, factual, and over quickly — the loading screen is not
   where the personality goes. */
const STEPS = [
  "Carregando o sistema",
  "Preparando o espaço de trabalho",
  "Restaurando a sessão",
  "Pronto",
];

export default function Boot() {
  const phase = useOS((s) => s.phase);
  const setPhase = useOS((s) => s.setPhase);
  const sound = useOS((s) => s.sound);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);
  const done = useRef(false);

  const on = phase === "boot";

  useEffect(() => {
    if (!started) return;
    const t0 = performance.now();
    const DUR = 2200;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR);
      // ease so the last stretch feels unhurried
      setPct(1 - Math.pow(1 - p, 1.8));
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        setTimeout(() => setPhase("live"), 520);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, setPhase]);

  const start = () => {
    unlockAudio();
    if (sound) setTimeout(() => SFX.boot(), 40);
    setStarted(true);
  };

  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          className="boot"
          exit={{ opacity: 0, filter: "blur(16px)", scale: 1.03 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="boot__glow" aria-hidden />

          <div className="boot__stage">
            {/* a slow ring that fills as the room gets ready */}
            <motion.div
              className="boot__ring"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...soft, delay: 0.1 }}
            >
              <svg viewBox="0 0 110 110" aria-hidden>
                <circle cx="55" cy="55" r={R} className="boot__ring-track" />
                <circle
                  cx="55" cy="55" r={R}
                  className="boot__ring-fill"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - (started ? pct : 0))}
                />
              </svg>
              <motion.span
                className="boot__seed"
                animate={{ scale: [1, 1.14, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              />
            </motion.div>

            <motion.h1
              className="boot__word"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...gentle(0.9), delay: 0.16 }}
            >
              raam
            </motion.h1>

            <motion.p
              className="boot__sub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...gentle(0.7), delay: 0.4 }}
            >
Um sistema operacional como portfólio
            </motion.p>

            <div className="boot__slot">
              <AnimatePresence mode="wait">
                {!started ? (
                  <motion.button
                    key="go"
                    className="boot__power"
                    onClick={start}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                    transition={{ ...soft, delay: 0.55 }}
                    whileHover={{ scale: 1.035 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Entrar
                  </motion.button>
                ) : (
                  <motion.p
                    key={STEPS[step]}
                    className="boot__step"
                    initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                    transition={gentle(0.5)}
                  >
                    {STEPS[step]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="boot__foot">lucas schünemann</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
