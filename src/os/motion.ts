import type { Transition, Variants } from "motion/react";

/* ============================================================
   Motion vocabulary.

   The brief asked for a lot of movement, and the reference asks
   for restraint. Those are not in conflict: Linear moves almost
   constantly, but nothing it does wobbles. So the quantity of
   choreography stays and the character changes: critically
   damped springs and short eased tweens, no overshoot anywhere.
   ============================================================ */

/** the house spring: settles without ever crossing its target */
export const soft: Transition = { type: "spring", stiffness: 400, damping: 40, mass: 0.9 };

/** for controls that must answer immediately */
export const snappy: Transition = { type: "spring", stiffness: 700, damping: 46, mass: 0.6 };

/** layout retiling: a touch slower so panes read as moving, not cutting */
export const tile: Transition = { type: "spring", stiffness: 340, damping: 38, mass: 1 };

export const quick = (d = 0.18): Transition => ({ duration: d, ease: [0.16, 1, 0.3, 1] });
export const gentle = (d = 0.32): Transition => ({ duration: d, ease: [0.16, 1, 0.3, 1] });

/** stagger helper: steps are short, long cascades read as slow, not rich */
export const stagger = (i: number, step = 0.028, base = 0): Transition => ({
  ...soft,
  delay: base + i * step,
});

/* ---------------- reusable variants ---------------- */

export const panelVariants: Variants = {
  enter: { opacity: 0, y: -6, scale: 0.985 },
  live: { opacity: 1, y: 0, scale: 1, transition: soft },
  leave: { opacity: 0, y: -4, scale: 0.99, transition: quick(0.12) },
};

export const riseVariants: Variants = {
  enter: { y: "100%", opacity: 0 },
  live: (i = 0) => ({ y: "0%", opacity: 1, transition: { ...soft, delay: 0.04 * (i as number) } }),
};

export const liftVariants: Variants = {
  enter: { opacity: 0, y: 8 },
  live: (i = 0) => ({ opacity: 1, y: 0, transition: { ...gentle(0.38), delay: 0.03 * (i as number) } }),
};
