import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOS } from "../os/store";

const COUNT = 11;

/* Every other theme in this system follows the house rule against
   ornament that carries no information. Nino is the one exception,
   on purpose: a scatter of ">:]" across the desk, laid out fresh
   each time the theme is switched on. It sits at the same layer as
   the desk itself, so it shows through the gaps around windows
   rather than over their content. */
export default function NinoEmoji() {
  const on = useOS((s) => s.flavour === "nino");

  const marks = useMemo(() => {
    if (!on) return [];
    return Array.from({ length: COUNT }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      x: 4 + Math.random() * 90,
      y: 8 + Math.random() * 84,
      r: Math.random() * 36 - 18,
      s: 0.65 + Math.random() * 0.85,
      d: Math.random() * 0.7,
    }));
    // regenerate only when the theme is switched to (or away from) Nino
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  return (
    <div className="nino-field" aria-hidden>
      <AnimatePresence>
        {on &&
          marks.map((m) => (
            <motion.span
              key={m.id}
              className="nino-mark"
              style={{ left: `${m.x}%`, top: `${m.y}%`, rotate: `${m.r}deg`, scale: m.s }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ duration: 0.5, delay: m.d }}
            >
              {">:]"}
            </motion.span>
          ))}
      </AnimatePresence>
    </div>
  );
}
