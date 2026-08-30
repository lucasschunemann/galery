import type { Rect } from "./store";

/* ============================================================
   SNAPPING

   Three behaviours, in order of priority while a window is being
   dragged:

     1. edge zones:   the pointer near an edge proposes half or
                       quarter of the work area
     2. alignment:    edges and centres line up with neighbours
                       and with the work area, and say so
     3. grid:         whatever is left rounds to the column grid

   Everything here is pure: it takes a proposed rectangle and
   returns where it should actually land.
   ============================================================ */

export type Guide = { axis: "x" | "y"; at: number; from: number; to: number };

export const SNAP_PX = 9;
export const ZONE_PX = 26;

/** the 12-column grid the whole system is set on */
export function gridStep(area: Rect) {
  return Math.max(24, Math.round(area.w / 12));
}

/* ------------------------------------------------------------
   Edge zones
   ------------------------------------------------------------ */

export type ZoneId =
  | "left" | "right" | "top"
  | "tl" | "tr" | "bl" | "br"
  | null;

export function zoneAt(px: number, py: number, area: Rect): ZoneId {
  const nearL = px <= area.x + ZONE_PX;
  const nearR = px >= area.x + area.w - ZONE_PX;
  const nearT = py <= area.y + ZONE_PX;
  const nearB = py >= area.y + area.h - ZONE_PX;

  if (nearT && nearL) return "tl";
  if (nearT && nearR) return "tr";
  if (nearB && nearL) return "bl";
  if (nearB && nearR) return "br";
  if (nearL) return "left";
  if (nearR) return "right";
  if (nearT) return "top";
  return null;
}

export function zoneRect(zone: Exclude<ZoneId, null>, area: Rect, gap: number): Rect {
  const halfW = (area.w - gap) / 2;
  const halfH = (area.h - gap) / 2;
  switch (zone) {
    case "left":  return { x: area.x, y: area.y, w: halfW, h: area.h };
    case "right": return { x: area.x + halfW + gap, y: area.y, w: halfW, h: area.h };
    case "top":   return { ...area };
    case "tl":    return { x: area.x, y: area.y, w: halfW, h: halfH };
    case "tr":    return { x: area.x + halfW + gap, y: area.y, w: halfW, h: halfH };
    case "bl":    return { x: area.x, y: area.y + halfH + gap, w: halfW, h: halfH };
    case "br":    return { x: area.x + halfW + gap, y: area.y + halfH + gap, w: halfW, h: halfH };
  }
}

/* ------------------------------------------------------------
   Alignment + grid
   ------------------------------------------------------------ */

type Cand = { at: number; guideFrom: number; guideTo: number };

function candidates(area: Rect, peers: Rect[], axis: "x" | "y"): {
  starts: Cand[];   // where the window's leading edge may land
  centers: Cand[];  // where the window's centre may land
  ends: Cand[];     // where the window's trailing edge may land
} {
  const A = axis === "x"
    ? { p: area.x, s: area.w, cp: area.y, cs: area.h }
    : { p: area.y, s: area.h, cp: area.x, cs: area.w };

  const span = (a: number, b: number) => ({ guideFrom: Math.min(a, b), guideTo: Math.max(a, b) });

  const starts: Cand[] = [{ at: A.p, ...span(A.cp, A.cp + A.cs) }];
  const ends: Cand[] = [{ at: A.p + A.s, ...span(A.cp, A.cp + A.cs) }];
  const centers: Cand[] = [{ at: A.p + A.s / 2, ...span(A.cp, A.cp + A.cs) }];

  for (const r of peers) {
    const P = axis === "x"
      ? { p: r.x, s: r.w, cp: r.y, cs: r.h }
      : { p: r.y, s: r.h, cp: r.x, cs: r.w };
    const g = span(P.cp, P.cp + P.cs);
    // align to the neighbour's edges, and sit flush against them
    starts.push({ at: P.p, ...g }, { at: P.p + P.s, ...g });
    ends.push({ at: P.p + P.s, ...g }, { at: P.p, ...g });
    centers.push({ at: P.p + P.s / 2, ...g });
  }
  return { starts, centers, ends };
}

function best(value: number, list: Cand[], threshold: number) {
  let hit: Cand | null = null;
  let dist = threshold;
  for (const c of list) {
    const d = Math.abs(c.at - value);
    if (d < dist) { dist = d; hit = c; }
  }
  return hit;
}

/**
 * Resolves a proposed position into where the window should land,
 * plus the guides that explain why.
 */
export function resolveMove(
  proposed: Rect,
  peers: Rect[],
  area: Rect,
  opts: { snap?: boolean } = {}
): { rect: Rect; guides: Guide[] } {
  if (opts.snap === false) return { rect: proposed, guides: [] };

  const guides: Guide[] = [];
  const out = { ...proposed };
  const step = gridStep(area);

  for (const axis of ["x", "y"] as const) {
    const size = axis === "x" ? proposed.w : proposed.h;
    const pos = axis === "x" ? proposed.x : proposed.y;
    const { starts, centers, ends } = candidates(area, peers, axis);

    const hStart = best(pos, starts, SNAP_PX);
    const hEnd = best(pos + size, ends, SNAP_PX);
    const hCenter = best(pos + size / 2, centers, SNAP_PX);

    let landed: number | null = null;
    let guide: Cand | null = null;
    let guideAt = 0;

    // an edge that lines up beats a centre that lines up
    if (hStart) { landed = hStart.at; guide = hStart; guideAt = hStart.at; }
    else if (hEnd) { landed = hEnd.at - size; guide = hEnd; guideAt = hEnd.at; }
    else if (hCenter) { landed = hCenter.at - size / 2; guide = hCenter; guideAt = hCenter.at; }

    if (landed !== null && guide) {
      if (axis === "x") out.x = landed; else out.y = landed;
      guides.push({
        axis,
        at: guideAt,
        from: Math.min(guide.guideFrom, axis === "x" ? proposed.y : proposed.x),
        to: Math.max(guide.guideTo, axis === "x" ? proposed.y + proposed.h : proposed.x + proposed.w),
      });
    } else {
      // nothing to align with: fall back to the column grid
      const base = axis === "x" ? area.x : area.y;
      const snapped = base + Math.round((pos - base) / step) * step;
      if (Math.abs(snapped - pos) < SNAP_PX) {
        if (axis === "x") out.x = snapped; else out.y = snapped;
      }
    }
  }

  return { rect: out, guides };
}

/** the same idea for a resize: only the moving corner snaps */
export function resolveResize(
  proposed: Rect,
  peers: Rect[],
  area: Rect
): { rect: Rect; guides: Guide[] } {
  const guides: Guide[] = [];
  const out = { ...proposed };
  const step = gridStep(area);

  for (const axis of ["x", "y"] as const) {
    const edge = axis === "x" ? proposed.x + proposed.w : proposed.y + proposed.h;
    const { ends } = candidates(area, peers, axis);
    const hit = best(edge, ends, SNAP_PX);

    if (hit) {
      if (axis === "x") out.w = hit.at - proposed.x;
      else out.h = hit.at - proposed.y;
      guides.push({
        axis,
        at: hit.at,
        from: Math.min(hit.guideFrom, axis === "x" ? proposed.y : proposed.x),
        to: Math.max(hit.guideTo, axis === "x" ? proposed.y + proposed.h : proposed.x + proposed.w),
      });
    } else {
      const base = axis === "x" ? proposed.x : proposed.y;
      const snapped = base + Math.round((edge - base) / step) * step;
      if (Math.abs(snapped - edge) < SNAP_PX) {
        if (axis === "x") out.w = snapped - proposed.x;
        else out.h = snapped - proposed.y;
      }
    }
  }
  return { rect: out, guides };
}
