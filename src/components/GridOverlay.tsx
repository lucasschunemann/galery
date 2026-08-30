import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useOS } from "../os/store";
import { gentle } from "../os/motion";

/* The grid the whole system is set on, made visible (⌘G).
   Twelve columns with the outer gap as margin, plus an 8px
   baseline rhythm. It sits above everything so alignment can
   actually be checked against it. */
export default function GridOverlay() {
  const on = useOS((s) => s.gridOverlay);
  const [margin, setMargin] = useState("–");

  useEffect(() => {
    if (!on) return;
    const v = getComputedStyle(document.documentElement).getPropertyValue("--gap-out").trim();
    setMargin(v || "–");
  }, [on]);

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          className="gridoverlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={gentle(0.24)}
          aria-hidden
        >
          <div className="gridoverlay__cols">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <div className="gridoverlay__base" />
          <p className="gridoverlay__note">12 colunas · linha de base 8 px · margem {margin}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
