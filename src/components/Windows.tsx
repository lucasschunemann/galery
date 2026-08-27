import { AnimatePresence } from "motion/react";
import { useOS, dwindle } from "../os/store";
import { useCompact, useViewport } from "../os/useViewport";
import Window from "./Window";
import AppHost from "../os/AppHost";

/* Computes the dwindle partition for the active workspace and
   hands each window its slot. Floating windows are lifted out of
   the partition entirely. */
export default function Windows() {
  const windows = useOS((s) => s.windows);
  const workspace = useOS((s) => s.workspace);
  const { w, h } = useViewport();
  const compact = useCompact();

  const css = getComputedStyle(document.documentElement);
  const px = (n: string, f: number) => parseInt(css.getPropertyValue(n)) || f;
  const gapOut = compact ? 8 : px("--gap-out", 14);
  const gapIn = compact ? 8 : px("--gap-in", 10);
  const barH = px("--bar-h", 38);
  const railW = compact ? 0 : px("--rail-w", 52);

  const inWs = windows.filter((x) => x.workspace === workspace);
  const tiled = inWs.filter((x) => !x.floating || compact);

  const area = {
    x: railW + gapOut,
    y: barH + gapOut,
    w: Math.max(200, w - railW - gapOut * 2),
    h: Math.max(160, h - barH - gapOut * 2),
  };

  // on a phone the tiling metaphor collapses: one window fills the screen
  const slots = compact
    ? tiled.map(() => area)
    : dwindle(area, tiled.length, gapIn);

  return (
    <AnimatePresence>
      {inWs.map((win) => {
        const ti = tiled.indexOf(win);
        return (
          <Window
            key={win.id}
            win={win}
            rect={slots[ti] ?? area}
            index={ti === -1 ? inWs.indexOf(win) : ti}
            total={tiled.length || 1}
            compact={compact}
          >
            <AppHost win={win} />
          </Window>
        );
      })}
    </AnimatePresence>
  );
}
