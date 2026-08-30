import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue } from "motion/react";
import { useOS, type WindowState, type Rect } from "../os/store";
import { useSfx } from "../os/useSfx";
import { resolveMove, resolveResize, zoneAt, zoneRect, type Guide, type ZoneId } from "../os/snap";
import { tile } from "../os/motion";
import Pict from "./Pict";

const MIN_W = 320;
const MIN_H = 200;
const LIFT = 4; // px of pointer travel before a drag actually starts

export default function Window({
  win, rect, index, children, compact, hidden, dir, area, peers, slots, gap,
}: {
  win: WindowState;
  rect: Rect;
  index: number;
  children: ReactNode;
  compact: boolean;
  hidden: boolean;
  dir: number;
  /** the region the layout is allowed to use */
  area: Rect;
  /** other floating windows, for alignment snapping */
  peers: Rect[];
  /** every tiled slot, so a dragged pane knows what it is over */
  slots: { id: string; rect: Rect }[];
  gap: number;
}) {
  const { focus, close, toggleFloat, setFloatRect, setDrag, swap } = useOS();
  const focusId = useOS((s) => s.focusId);
  const overId = useOS((s) => s.drag?.overId ?? null);
  const sfx = useSfx();
  const active = focusId === win.id;
  const floating = win.floating && !compact;
  const [lifted, setLifted] = useState(false);

  /* Geometry lives in motion values, never in inline style. The
     previous version wrote style.transform during a drag while
     motion also animated transform, and the two fought for the same
     property and the window jumped on the next frame. */
  const target = floating
    ? { x: win.fx, y: win.fy, w: win.fw, h: win.fh }
    : { x: rect.x, y: rect.y, w: rect.w, h: rect.h };

  const mx = useMotionValue(target.x);
  const my = useMotionValue(target.y);
  const mw = useMotionValue(target.w);
  const mh = useMotionValue(target.h);
  const busy = useRef(false);

  useEffect(() => {
    if (busy.current) return;
    const shift = hidden ? dir * -28 : 0;
    const t = { ...tile };
    animate(mx, target.x + shift, t);
    animate(my, target.y, t);
    animate(mw, target.w, t);
    animate(mh, target.h, t);
  }, [target.x, target.y, target.w, target.h, hidden, dir, mx, my, mw, mh]);

  /* ---------------------------------------------------------
     Drag. A tiled pane trades places with whatever it is
     dropped on; a floating one snaps to guides, grid and edges.
     --------------------------------------------------------- */
  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || compact) return;
      if ((e.target as HTMLElement).closest("button")) return;
      focus(win.id);

      const sx = e.clientX;
      const sy = e.clientY;
      const ox = mx.get();
      const oy = my.get();
      const w = mw.get();
      const h = mh.get();

      let started = false;
      let landing: Rect | null = null;
      let zone: ZoneId = null;
      let over: string | null = null;
      let lastGuides = "";

      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;

        if (!started) {
          if (Math.hypot(dx, dy) < LIFT) return;
          started = true;
          busy.current = true;
          setLifted(true);
        }

        if (!floating) {
          // a tiled pane is only lifted; the layout keeps its slot
          mx.set(ox + dx);
          my.set(oy + dy);
          const hit = slots.find(
            (s) =>
              s.id !== win.id &&
              ev.clientX >= s.rect.x && ev.clientX <= s.rect.x + s.rect.w &&
              ev.clientY >= s.rect.y && ev.clientY <= s.rect.y + s.rect.h
          );
          const nextOver = hit?.id ?? null;
          if (nextOver !== over) {
            over = nextOver;
            setDrag({ guides: [], preview: null, overId: over });
          }
          return;
        }

        // --- floating ---
        zone = zoneAt(ev.clientX, ev.clientY, area);
        if (zone) {
          const preview = zoneRect(zone, area, gap);
          landing = preview;
          mx.set(ox + dx);
          my.set(oy + dy);
          setDrag({ guides: [], preview, overId: null });
          lastGuides = "zone";
          return;
        }

        /* a window may hang off an edge, but never far enough to be
           lost: the title bar always stays reachable */
        const KEEP = 140;
        const proposed = {
          x: Math.min(area.x + area.w - KEEP, Math.max(area.x - (w - KEEP), ox + dx)),
          y: Math.min(area.y + area.h - 44, Math.max(area.y, oy + dy)),
          w,
          h,
        };
        const { rect: snapped, guides } = resolveMove(proposed, peers, area, {
          snap: !ev.altKey, // hold alt to place freely
        });
        landing = snapped;
        mx.set(snapped.x);
        my.set(snapped.y);

        const key = JSON.stringify(guides);
        if (key !== lastGuides) {
          lastGuides = key;
          setDrag({ guides, preview: null, overId: null });
        }
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDrag(null);
        busy.current = false;
        setLifted(false);

        if (!started) return;

        if (!floating) {
          if (over) { sfx("click"); swap(win.id, over); }
          // whether or not it swapped, the layout takes the pane back
          animate(mx, target.x, tile);
          animate(my, target.y, tile);
          return;
        }

        if (landing) {
          setFloatRect(win.id, { x: landing.x, y: landing.y, w: landing.w, h: landing.h });
          if (zone) sfx("click");
        }
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [compact, floating, focus, win.id, mx, my, mw, mh, area, peers, slots, gap,
     setDrag, setFloatRect, swap, sfx, target.x, target.y]
  );

  /* ---------------------------------------------------------
     Resize
     --------------------------------------------------------- */
  const startResize = useCallback(
    (e: React.PointerEvent) => {
      if (!floating) return;
      e.stopPropagation();
      e.preventDefault();
      focus(win.id);

      const sx = e.clientX;
      const sy = e.clientY;
      const ox = mx.get();
      const oy = my.get();
      const ow = mw.get();
      const oh = mh.get();
      let landing: Rect = { x: ox, y: oy, w: ow, h: oh };
      let lastGuides = "";
      busy.current = true;

      const move = (ev: PointerEvent) => {
        const proposed = {
          x: ox,
          y: oy,
          w: Math.max(MIN_W, ow + ev.clientX - sx),
          h: Math.max(MIN_H, oh + ev.clientY - sy),
        };
        const { rect: snapped, guides } = ev.altKey
          ? { rect: proposed, guides: [] as Guide[] }
          : resolveResize(proposed, peers, area);

        landing = {
          ...snapped,
          w: Math.max(MIN_W, snapped.w),
          h: Math.max(MIN_H, snapped.h),
        };
        mw.set(landing.w);
        mh.set(landing.h);

        const key = JSON.stringify(guides);
        if (key !== lastGuides) {
          lastGuides = key;
          setDrag({ guides, preview: null, overId: null });
        }
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDrag(null);
        busy.current = false;
        setFloatRect(win.id, { w: landing.w, h: landing.h });
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [floating, focus, win.id, mx, my, mw, mh, peers, area, setDrag, setFloatRect]
  );

  return (
    <motion.section
      className="win glass"
      data-active={active}
      data-floating={floating}
      data-lifted={lifted}
      data-drop={overId === win.id}
      style={{
        x: mx,
        y: my,
        width: mw,
        height: mh,
        zIndex: lifted ? 999 : floating ? win.z : 100 + index,
        pointerEvents: hidden ? "none" : "auto",
      }}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: hidden ? 0 : 1, scale: lifted ? 0.985 : 1 }}
      exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.13 } }}
      transition={{ opacity: { duration: 0.16 }, scale: { duration: 0.16 } }}
      onPointerDown={() => focus(win.id)}
      aria-label={win.title}
      aria-hidden={hidden}
    >
      <header className="win__bar" onPointerDown={startDrag} onDoubleClick={() => toggleFloat(win.id)}>
        <span className="win__dot" aria-hidden />
        <h2 className="win__title">{win.title}</h2>

        <div className="win__acts">
          <button
            className="win__act"
            title={floating ? "Encaixar no mosaico" : "Soltar a janela"}
            onClick={() => { sfx("click"); toggleFloat(win.id); }}
          >
            <Pict name={floating ? "tile" : "float"} size={14} />
          </button>
          <button
            className="win__act win__act--close"
            title="Fechar"
            onClick={() => { sfx("close"); close(win.id); }}
          >
            <Pict name="close" size={14} />
          </button>
        </div>
      </header>

      <div className="win__body">{children}</div>

      {floating && <div className="win__rz" onPointerDown={startResize} aria-hidden />}
    </motion.section>
  );
}
