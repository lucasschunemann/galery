import { useCallback, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { useOS, type WindowState } from "../os/store";
import { useSfx } from "../os/useSfx";
import { AppIcon, type IconName } from "./Icon";
import { useCompact } from "../os/useCompact";

const MIN_W = 340;
const MIN_H = 220;

export default function Window({
  win,
  children,
}: {
  win: WindowState;
  children: ReactNode;
}) {
  const { focus, close, minimize, toggleZoom, setRect } = useOS();
  const focusId = useOS((s) => s.focusId);
  const sfx = useSfx();
  const ref = useRef<HTMLDivElement>(null);
  const compact = useCompact();
  const active = focusId === win.id;

  /* ---------- drag ---------- */
  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || compact) return;
      if ((e.target as HTMLElement).closest("button")) return;
      focus(win.id);
      const el = ref.current;
      if (!el) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const ox = win.x;
      const oy = win.y;
      let nx = ox;
      let ny = oy;
      el.dataset.dragging = "true";

      const move = (ev: PointerEvent) => {
        nx = ox + (ev.clientX - startX);
        ny = Math.max(28, oy + (ev.clientY - startY));
        // keep a grabbable strip on screen at all times
        nx = Math.min(window.innerWidth - 80, Math.max(80 - win.w, nx));
        ny = Math.min(window.innerHeight - 60, ny);
        el.style.left = nx + "px";
        el.style.top = ny + "px";
      };
      const up = () => {
        el.dataset.dragging = "false";
        setRect(win.id, { x: nx, y: ny });
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [focus, setRect, win.id, win.x, win.y, win.w, compact]
  );

  /* ---------- resize ---------- */
  const startResize = useCallback(
    (e: React.PointerEvent, dir: "se" | "e" | "s") => {
      e.stopPropagation();
      focus(win.id);
      const el = ref.current;
      if (!el) return;

      const sx = e.clientX;
      const sy = e.clientY;
      const ow = win.w;
      const oh = win.h;
      let nw = ow;
      let nh = oh;

      const move = (ev: PointerEvent) => {
        if (dir !== "s") nw = Math.max(MIN_W, ow + (ev.clientX - sx));
        if (dir !== "e") nh = Math.max(MIN_H, oh + (ev.clientY - sy));
        el.style.width = nw + "px";
        el.style.height = nh + "px";
      };
      const up = () => {
        setRect(win.id, { w: nw, h: nh });
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [focus, setRect, win.id, win.w, win.h]
  );

  /* ---------- genie target: where this window lives in the dock ---------- */
  const genieTo = () => {
    const target = document.querySelector<HTMLElement>(
      `[data-dock-app="${win.appId}"]`
    );
    const r = target?.getBoundingClientRect();
    return {
      x: (r ? r.left + r.width / 2 : window.innerWidth / 2) - (win.x + win.w / 2),
      y: (r ? r.top + r.height / 2 : window.innerHeight) - (win.y + win.h / 2),
    };
  };

  const genie = win.minimized ? genieTo() : { x: 0, y: 0 };

  return (
    <motion.div
      ref={ref}
      className="win"
      data-active={active}
      data-max={win.maximized}
      data-compact={compact}
      style={
        compact
          ? { zIndex: win.z }
          : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }
      }
      initial={{ opacity: 0, scale: 0.9, y: 14 }}
      animate={
        win.minimized
          ? { opacity: 0, scale: 0.06, scaleX: 0.16, x: genie.x, y: genie.y, filter: "blur(2px)" }
          : { opacity: 1, scale: 1, scaleX: 1, x: 0, y: 0, filter: "blur(0px)" }
      }
      exit={{ opacity: 0, scale: 0.88, y: 10, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
      onPointerDown={() => focus(win.id)}
      role="dialog"
      aria-label={win.title}
      aria-hidden={win.minimized}
    >
      {/* ---------- title bar ---------- */}
      <div className="win__bar" onPointerDown={startDrag} onDoubleClick={() => toggleZoom(win.id)}>
        <div className="win__lights">
          <button
            className="light light--close" title="Fechar"
            onClick={() => { sfx("close"); close(win.id); }}
          ><svg viewBox="0 0 10 10"><path d="M3 3l4 4M7 3l-4 4" /></svg></button>
          <button
            className="light light--min" title="Minimizar"
            onClick={() => { sfx("minimize"); minimize(win.id); }}
          ><svg viewBox="0 0 10 10"><path d="M2.6 5h4.8" /></svg></button>
          <button
            className="light light--zoom" title="Zoom"
            onClick={() => { sfx("click"); toggleZoom(win.id); }}
          ><svg viewBox="0 0 10 10"><path d="M3 3h4v4" /></svg></button>
        </div>

        <div className="win__title">
          <span className="win__title-ico"><AppIcon name={win.appId as IconName} size={14} /></span>
          {win.title}
        </div>

        <div className="win__bar-spacer" />
      </div>

      {/* ---------- content ---------- */}
      <div className="win__body">{children}</div>

      {/* ---------- resize affordances ---------- */}
      <div className="win__rz win__rz--e" onPointerDown={(e) => startResize(e, "e")} />
      <div className="win__rz win__rz--s" onPointerDown={(e) => startResize(e, "s")} />
      <div className="win__rz win__rz--se" onPointerDown={(e) => startResize(e, "se")}>
        <svg viewBox="0 0 12 12" aria-hidden>
          <g stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".55">
            <path d="M10 3L3 10M10 6.5L6.5 10M10 10h0" />
          </g>
        </svg>
      </div>
    </motion.div>
  );
}
