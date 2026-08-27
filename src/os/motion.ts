import type { Transition, Variants } from "motion/react";

/* ============================================================
   One motion vocabulary for the whole system.

   Nothing here is linear and almost nothing is critically
   damped — a little overshoot is what makes an interface feel
   physical instead of scripted. The budget is spent on the
   things you touch: windows, panels, the launcher.
   ============================================================ */

/** the house spring: soft, weighty, settles with a small breath */
export const soft: Transition = { type: "spring", stiffness: 210, damping: 24, mass: 1 };

/** for things that must feel immediate but still organic */
export const snappy: Transition = { type: "spring", stiffness: 420, damping: 32, mass: 0.7 };

/** the one with a visible bounce — used sparingly, on arrival */
export const bouncy: Transition = { type: "spring", stiffness: 280, damping: 17, mass: 0.9 };

/** layout retiling: heavier, so panes feel like they have mass */
export const tile: Transition = { type: "spring", stiffness: 180, damping: 23, mass: 1.15 };

export const gentle = (d = 0.5): Transition => ({ duration: d, ease: [0.16, 1, 0.3, 1] });

/** a stagger helper for lists and grids */
export const stagger = (i: number, step = 0.045, base = 0): Transition => ({
  ...soft,
  delay: base + i * step,
});

/* ---------------- reusable variants ---------------- */

/** windows arrive by growing and focusing, and leave by softening */
export const windowVariants: Variants = {
  enter: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(8px)",
  },
  live: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { ...soft, filter: { duration: 0.32 } },
  },
  leave: {
    opacity: 0,
    scale: 0.93,
    filter: "blur(10px)",
    transition: { duration: 0.24, ease: [0.65, 0, 0.35, 1] },
  },
};

/** panels (launcher, popovers) drop in and lift out */
export const panelVariants: Variants = {
  enter: { opacity: 0, y: -18, scale: 0.96, filter: "blur(10px)" },
  live: {
    opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
    transition: { ...bouncy, filter: { duration: 0.26 } },
  },
  leave: {
    opacity: 0, y: -10, scale: 0.98, filter: "blur(6px)",
    transition: { duration: 0.18 },
  },
};

/** a line of text rising from behind its own baseline */
export const riseVariants: Variants = {
  enter: { y: "110%", opacity: 0 },
  live: (i = 0) => ({
    y: "0%",
    opacity: 1,
    transition: { ...soft, delay: 0.06 * (i as number) },
  }),
};

/** content blocks fading up */
export const liftVariants: Variants = {
  enter: { opacity: 0, y: 16 },
  live: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...gentle(0.62), delay: 0.05 * (i as number) },
  }),
};

/** workspaces slide as a set — direction is passed as custom */
export const workspaceVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 46, scale: 0.97, filter: "blur(6px)" }),
  live: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)", transition: soft },
  leave: (dir: number) => ({
    opacity: 0,
    x: dir * -46,
    scale: 0.97,
    filter: "blur(6px)",
    transition: { duration: 0.22, ease: [0.65, 0, 0.35, 1] },
  }),
};
