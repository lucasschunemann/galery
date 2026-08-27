import { AnimatePresence } from "motion/react";
import { useMemo, useRef } from "react";
import { useOS, dwindle, type Rect } from "../os/store";
import { useCompact, useViewport } from "../os/useViewport";
import Window from "./Window";
import AppHost from "../os/AppHost";

/* Computes the dwindle partition for the active workspace.

   Windows on other workspaces stay mounted and are moved aside
   instead of unmounted: a window manager should not throw away
   your terminal history because you looked at another desktop. */
export default function Windows() {
  const windows = useOS((s) => s.windows);
  const workspace = useOS((s) => s.workspace);
  const { w, h } = useViewport();
  const compact = useCompact();

  // which way the workspaces travelled, so they slide the right way
  const prev = useRef(workspace);
  const dir = workspace >= prev.current ? 1 : -1;
  prev.current = workspace;

  const { area, gapIn, slots, tiled, inWs } = useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const px = (n: string, f: number) => parseInt(css.getPropertyValue(n)) || f;
    const gapOut = compact ? 10 : px("--gap-out", 14);
    const gapIn = compact ? 10 : px("--gap-in", 10);
    const barH = px("--bar-h", 46);
    const railW = compact ? 0 : px("--rail-w", 58);

    const inWs = windows.filter((x) => x.workspace === workspace);
    const tiled = inWs.filter((x) => !x.floating || compact);

    const area: Rect = {
      x: railW + gapOut,
      y: barH + gapOut,
      w: Math.max(220, w - railW - gapOut * 2),
      h: Math.max(180, h - barH - gapOut * 2),
    };

    // on a phone the tiling metaphor collapses: one window fills the screen
    const rects = compact ? tiled.map(() => area) : dwindle(area, tiled.length, gapIn);
    const slots = tiled.map((win, i) => ({ id: win.id, rect: rects[i] ?? area }));

    return { area, gapIn, slots, tiled, inWs };
  }, [windows, workspace, w, h, compact]);

  return (
    <AnimatePresence>
      {windows.map((win) => {
        const here = win.workspace === workspace;
        const ti = tiled.indexOf(win);
        const slot = slots[ti]?.rect ?? area;

        // other floating windows in this workspace are what a dragged
        // window can align itself against
        const peers = inWs
          .filter((o) => o.id !== win.id && o.floating && !compact)
          .map((o) => ({ x: o.fx, y: o.fy, w: o.fw, h: o.fh }));

        return (
          <Window
            key={win.id}
            win={win}
            rect={slot}
            index={ti === -1 ? 0 : ti}
            compact={compact}
            hidden={!here}
            dir={dir}
            area={area}
            peers={peers}
            slots={slots}
            gap={gapIn}
          >
            <AppHost win={win} />
          </Window>
        );
      })}
    </AnimatePresence>
  );
}
