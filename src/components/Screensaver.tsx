import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOS } from "../os/store";

const IDLE_MS = 75_000;

export default function Screensaver() {
  const on = useOS((s) => s.screensaver);
  const setOn = useOS((s) => s.setScreensaver);
  const booted = useOS((s) => s.booted);
  const [clock, setClock] = useState(() => new Date());

  /* idle detection */
  useEffect(() => {
    if (!booted) return;
    let t: number;
    const arm = () => {
      clearTimeout(t);
      t = window.setTimeout(() => setOn(true), IDLE_MS);
    };
    const wake = () => {
      if (useOS.getState().screensaver) setOn(false);
      arm();
    };
    ["pointermove", "pointerdown", "keydown", "wheel"].forEach((e) =>
      window.addEventListener(e, wake, { passive: true })
    );
    arm();
    return () => {
      clearTimeout(t);
      ["pointermove", "pointerdown", "keydown", "wheel"].forEach((e) =>
        window.removeEventListener(e, wake)
      );
    };
  }, [booted, setOn]);

  useEffect(() => {
    if (!on) return;
    const i = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(i);
  }, [on]);

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          className="saver"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
        >
          {/* drifting glass spheres */}
          {Array.from({ length: 14 }, (_, i) => (
            <motion.span
              key={i}
              className="saver__bubble"
              style={{
                width: 40 + ((i * 37) % 150),
                height: 40 + ((i * 37) % 150),
                left: `${(i * 61) % 100}%`,
              }}
              initial={{ y: "110vh", opacity: 0 }}
              animate={{ y: "-40vh", opacity: [0, 0.9, 0.9, 0] }}
              transition={{
                duration: 16 + (i % 7) * 3,
                repeat: Infinity,
                // negative delays start the field mid-flight, so the saver
                // never opens onto an empty screen
                delay: -i * 1.7,
                ease: "linear",
              }}
            />
          ))}

          {/* the drifting clock panel — bounces slowly around the screen */}
          <motion.div
            className="saver__panel frost"
            animate={{
              x: ["0vw", "26vw", "-22vw", "20vw", "0vw"],
              y: ["0vh", "18vh", "22vh", "-20vh", "0vh"],
            }}
            transition={{ duration: 68, repeat: Infinity, ease: "easeInOut" }}
          >
            <p className="saver__time">
              {clock.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="saver__brand">AERO OS</p>
            <p className="saver__hint">mova o mouse para voltar</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
