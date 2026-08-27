import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOS } from "../os/store";
import { SFX, unlockAudio } from "../os/sound";

const LOG = [
  "AeroBoot 1.4.2 — inicializando",
  "verificando volume  Macintosh HD ............ ok",
  "carregando extensões  aqua.kext ............. ok",
  "carregando extensões  bubble.kext ........... ok",
  "montando /Users/lucas ....................... ok",
  "iniciando WindowServer ...................... ok",
  "compilando shaders de wallpaper ............. ok",
  "restaurando sessão anterior ................. ok",
  "bem-vindo",
];

export default function Boot() {
  const boot = useOS((s) => s.boot);
  const sound = useOS((s) => s.sound);
  const [phase, setPhase] = useState<"gate" | "booting" | "done">("gate");
  const [line, setLine] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (phase !== "booting") return;
    const t0 = performance.now();
    const DUR = 2900;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR);
      // ease-out so the bar feels like it's actually loading something
      setPct(1 - Math.pow(1 - p, 2.2));
      setLine(Math.min(LOG.length - 1, Math.floor(p * LOG.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setPhase("done");
        setTimeout(boot, 760);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, boot]);

  const power = () => {
    unlockAudio();
    if (sound) setTimeout(() => SFX.startup(), 60);
    setPhase("booting");
  };

  return (
    <AnimatePresence>
      {phase !== "done" ? (
        <motion.div
          className="boot"
          exit={{ opacity: 0, filter: "blur(8px)", scale: 1.04 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="boot__vignette" aria-hidden />

          <motion.div className="boot__core" layout>
            <motion.div
              className="boot__orb"
              animate={
                phase === "gate"
                  ? { scale: [1, 1.045, 1], opacity: 1 }
                  : { scale: [1, 1.09, 1], opacity: 1 }
              }
              transition={{ duration: phase === "gate" ? 2.6 : 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="boot__orb-gloss" />
              <span className="boot__orb-ring" />
            </motion.div>

            <h1 className="boot__brand">
              AERO<span>OS</span>
            </h1>

            <AnimatePresence mode="wait">
              {phase === "gate" ? (
                <motion.div
                  key="gate"
                  className="boot__gate"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <p className="boot__sub">
                    Portfólio de <strong>Lucas Schünemann</strong> — UX/UI &amp; Web
                  </p>
                  <button className="gel boot__power" onClick={power}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M12 3v9" />
                      <path d="M6.7 6.7a7.5 7.5 0 1010.6 0" />
                    </svg>
                    Ligar o sistema
                  </button>
                  <p className="boot__hint">som ativado · use fones se puder</p>
                </motion.div>
              ) : (
                <motion.div
                  key="load"
                  className="boot__loading"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="boot__bar">
                    <div className="boot__bar-fill" style={{ width: `${pct * 100}%` }} />
                  </div>
                  <ul className="boot__log">
                    {LOG.slice(0, line + 1).slice(-4).map((l, i, arr) => (
                      <li key={l} style={{ opacity: 0.25 + (i / Math.max(1, arr.length - 1)) * 0.75 }}>
                        {l}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
