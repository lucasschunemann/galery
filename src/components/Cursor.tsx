import { useEffect, useRef, useState } from "react";

/* ============================================================
   A period-correct pointer: the black-outlined Mac arrow, an
   I-beam over text fields, plus a soft aqua aura and a click
   ripple.

   The native cursor is only hidden once ours is actually on
   screen at a real position — otherwise the user spends the
   first frames (and the whole boot screen) with no pointer.
   ============================================================ */

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const aura = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [shape, setShape] = useState<"arrow" | "text" | "grab">("arrow");
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rid = useRef(0);
  const shown = useRef(false);

  useEffect(() => {
    // pointer-based devices only — a phantom arrow on touch is worse than none
    if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) return;
    setEnabled(true);

    let x = innerWidth / 2, y = innerHeight / 2;
    let ax = x, ay = y;
    let raf = 0;

    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px)`;

      if (!shown.current) {
        // first real position: snap the aura here so it doesn't fly in
        ax = x; ay = y;
        if (aura.current) aura.current.style.transform = `translate(${x}px, ${y}px)`;
        shown.current = true;
        setVisible(true);
      }

      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable]")) setShape("text");
      else if (t?.closest(".win__bar, .dicon")) setShape("grab");
      else setShape("arrow");
    };

    const tick = () => {
      ax += (x - ax) * 0.16;
      ay += (y - ay) * 0.16;
      if (aura.current) aura.current.style.transform = `translate(${ax}px, ${ay}px)`;
      raf = requestAnimationFrame(tick);
    };

    const down = (e: PointerEvent) => {
      const id = ++rid.current;
      setRipples((r) => [...r, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 620);
    };

    // pointer gone from the window → give the native cursor back
    const leave = () => { shown.current = false; setVisible(false); };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* the native cursor stays until ours is genuinely visible */
  useEffect(() => {
    const os = document.querySelector(".os");
    if (!os) return;
    if (visible) os.setAttribute("data-custom-cursor", "on");
    else os.removeAttribute("data-custom-cursor");
    return () => os.removeAttribute("data-custom-cursor");
  }, [visible]);

  if (!enabled) return null;

  return (
    <>
      <div ref={aura} className="cursor-aura" data-visible={visible} aria-hidden />
      <div ref={dot} className="cursor" data-visible={visible} data-shape={shape} aria-hidden>
        {shape === "text" ? (
          <svg viewBox="0 0 12 20" width="12" height="20">
            <path d="M3 1h6M3 19h6M6 1v18" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M3 1h6M3 19h6M6 1v18" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 24" width="20" height="24">
            <path
              d="M2 1.5l14.4 11.2-6.2.5 3.7 7.3-2.9 1.4-3.6-7.3-4.4 4.2z"
              fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {ripples.map((r) => (
        <span key={r.id} className="cursor-ripple" style={{ left: r.x, top: r.y }} aria-hidden />
      ))}
    </>
  );
}
