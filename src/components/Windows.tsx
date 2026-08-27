import { AnimatePresence } from "motion/react";
import { useRef } from "react";
import { useOS, dwindle } from "../os/store";
import { useCompact, useViewport } from "../os/useViewport";
import Window from "./Window";
import AppHost from "../os/AppHost";

/* Computes the dwindle partition for the active workspace.

   Windows on other workspaces stay mounted and are moved aside
   instead of unmounted — a real window manager does not throw
   away your terminal history because you looked at another
   desktop. */
export default function Windows() {
  const windows = useOS((s) => s.windows);
  const workspace = useOS((s) => s.workspace);
  const { w, h } = useViewport();
  const compact = useCompact();

  // which way the workspaces travelled, so they slide the right way
  const prev = useRef(workspace);
  const dir = workspace >= prev.current ? 1 : -1;
  prev.current = workspace;

  const css = getComputedStyle(document.documentElement);
  const px = (n: string, f: number) => parseInt(css.getPropertyValue(n)) || f;
  const gapOut = compact ? 10 : px("--gap-out", 22);
  const gapIn = compact ? 10 : px("--gap-in", 14);
  const barH = px("--bar-h", 52);
  const railW = compact ? 0 : px("--rail-w", 68);

  const inWs = windows.filter((x) => x.workspace === workspace);
  const tiled = inWs.filter((x) => !x.floating || compact);

  const area = {
    x: railW + gapOut,
    y: barH + gapOut,
    w: Math.max(220, w - railW - gapOut * 2),
    h: Math.max(180, h - barH - gapOut * 2),
  };

  // on a phone the tiling metaphor collapses: one window fills the screen
  const slots = compact ? tiled.map(() => area) : dwindle(area, tiled.length, gapIn);

  return (
    <AnimatePresence>
      {windows.map((win) => {
        const here = win.workspace === workspace;
        const ti = tiled.indexOf(win);
        return (
          <Window
            key={win.id}
            win={win}
            rect={slots[ti] ?? area}
            index={ti === -1 ? 0 : ti}
            compact={compact}
            hidden={!here}
            dir={dir}
          >
            <AppHost win={win} />
          </Window>
        );
      })}
    </AnimatePresence>
  );
}
