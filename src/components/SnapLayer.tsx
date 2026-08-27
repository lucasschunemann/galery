import { AnimatePresence, motion } from "motion/react";
import { useOS } from "../os/store";

/* What the system shows while you move a window: the rectangle it
   would land in, and the lines that explain the alignment it found. */
export default function SnapLayer() {
  const drag = useOS((s) => s.drag);
  const preview = drag?.preview ?? null;
  const guides = drag?.guides ?? [];

  return (
    <div className="snap" aria-hidden>
      <AnimatePresence>
        {preview && (
          <motion.div
            className="snap__preview"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{
              opacity: 1, scale: 1,
              x: preview.x, y: preview.y,
              width: preview.w, height: preview.h,
            }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 520, damping: 44, mass: 0.7 }}
          />
        )}
      </AnimatePresence>

      {guides.map((g, i) => (
        <span
          key={i}
          className="snap__guide"
          data-axis={g.axis}
          style={
            g.axis === "x"
              ? { left: g.at, top: g.from, height: g.to - g.from }
              : { top: g.at, left: g.from, width: g.to - g.from }
          }
        />
      ))}
    </div>
  );
}
