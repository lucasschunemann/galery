import { useCallback, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { useOS, type WindowState, type Rect } from "../os/store";
import { useSfx } from "../os/useSfx";

const SPRING = { type: "spring", stiffness: 260, damping: 30, mass: 0.85 } as const;

export default function Window({
  win, rect, index, total, children, compact,
}: {
  win: WindowState;
  rect: Rect;
  index: number;
  total: number;
  children: ReactNode;
  compact: boolean;
}) {
  const { focus, close, toggleFloat, setFloatRect } = useOS();
  const focusId = useOS((s) => s.focusId);
  const sfx = useSfx();
  const ref = useRef<HTMLDivElement>(null);
  const active = focusId === win.id;
  const floating = win.floating && !compact;

  /* floating windows are dragged by their header */
  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!floating || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button")) return;
      focus(win.id);
      const el = ref.current;
      if (!el) return;
      const sx = e.clientX, sy = e.clientY;
      const ox = win.fx, oy = win.fy;
      let nx = ox, ny = oy;

      const move = (ev: PointerEvent) => {
        nx = Math.min(window.innerWidth - 90, Math.max(90 - win.fw, ox + ev.clientX - sx));
        ny = Math.min(window.innerHeight - 60, Math.max(40, oy + ev.clientY - sy));
        el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
      };
      const up = () => {
        setFloatRect(win.id, { x: nx, y: ny });
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [floating, focus, setFloatRect, win.id, win.fx, win.fy, win.fw]
  );

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      if (!floating) return;
      e.stopPropagation();
      focus(win.id);
      const el = ref.current;
      if (!el) return;
      const sx = e.clientX, sy = e.clientY;
      const ow = win.fw, oh = win.fh;
      let nw = ow, nh = oh;
      const move = (ev: PointerEvent) => {
        nw = Math.max(320, ow + ev.clientX - sx);
        nh = Math.max(200, oh + ev.clientY - sy);
        el.style.width = nw + "px";
        el.style.height = nh + "px";
      };
      const up = () => {
        setFloatRect(win.id, { w: nw, h: nh });
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [floating, focus, setFloatRect, win.id, win.fw, win.fh]
  );

  const geo = floating
    ? { x: win.fx, y: win.fy, width: win.fw, height: win.fh }
    : { x: rect.x, y: rect.y, width: rect.w, height: rect.h };

  return (
    <motion.section
      ref={ref}
      className="win glass"
      data-active={active}
      data-floating={floating}
      style={{ zIndex: floating ? win.z : 100 + index }}
      initial={{ ...geo, opacity: 0, scale: 0.96 }}
      animate={{ ...geo, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
      transition={SPRING}
      onPointerDown={() => focus(win.id)}
      aria-label={win.title}
    >
      <header className="win__bar" onPointerDown={startDrag} onDoubleClick={() => toggleFloat(win.id)}>
        <span className="win__id t-label">
          {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <span className="win__dot" aria-hidden />
        <h2 className="win__title">{win.title}</h2>

        <div className="win__acts">
          <button
            className="win__act"
            title={floating ? "Encaixar (tile)" : "Soltar (float)"}
            onClick={() => { sfx("click"); toggleFloat(win.id); }}
          >
            {floating ? "▤" : "▭"}
          </button>
          <button
            className="win__act win__act--close"
            title="Fechar"
            onClick={() => { sfx("close"); close(win.id); }}
          >
            ✕
          </button>
        </div>
      </header>

      <div className="win__body">{children}</div>

      {floating && <div className="win__rz" onPointerDown={startResize} aria-hidden />}
    </motion.section>
  );
}
