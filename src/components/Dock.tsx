import { useRef } from "react";
import {
  motion, useMotionValue, useSpring, useTransform, AnimatePresence,
  type MotionValue,
} from "motion/react";
import { useOS, APPS } from "../os/store";
import { useSfx } from "../os/useSfx";
import { AppIcon, TrashIcon, type IconName } from "./Icon";

import { useCompact } from "../os/useCompact";

const BASE = 46;
const MAX = 82;
const REACH = 130;
const COMPACT_BASE = 34;
const COMPACT_MAX = 52;

function DockItem({
  mouseX, label, running, onClick, dockApp, children,
}: {
  mouseX: MotionValue<number>;
  label: string;
  running?: boolean;
  onClick: () => void;
  dockApp?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const sfx = useSfx();
  const compact = useCompact();
  const base = compact ? COMPACT_BASE : BASE;
  const max = compact ? COMPACT_MAX : MAX;

  // distance from the pointer to this icon's centre
  const dist = useTransform(mouseX, (x) => {
    const b = ref.current?.getBoundingClientRect();
    if (!b) return REACH;
    return x - (b.left + b.width / 2);
  });

  // gaussian falloff — the curve that makes the dock feel liquid
  const raw = useTransform(dist, (d) => {
    const f = Math.exp(-Math.pow(d / (REACH * 0.55), 2));
    return base + (max - base) * f;
  });
  const size = useSpring(raw, { stiffness: 520, damping: 30, mass: 0.35 });
  const lift = useTransform(size, [base, max], [0, compact ? -6 : -13]);

  return (
    <motion.button
      ref={ref}
      className="dock__item"
      data-dock-app={dockApp}
      style={{ width: size, height: size, y: lift }}
      onClick={onClick}
      onPointerEnter={() => sfx("hover")}
      whileTap={{ scale: 0.86 }}
      aria-label={label}
    >
      <span className="dock__tip" aria-hidden>{label}</span>
      <span className="dock__art">{children}</span>
      {running && <span className="dock__dot" aria-hidden />}
    </motion.button>
  );
}

export default function Dock() {
  const mouseX = useMotionValue(Infinity);
  const { open, restore, close } = useOS();
  const windows = useOS((s) => s.windows);
  const sfx = useSfx();

  const dockApps = Object.values(APPS).filter((a) => a.inDock);
  const minimized = windows.filter((w) => w.minimized);
  const trashFull = windows.length > 0;

  return (
    <div className="dock-wrap">
      <motion.div
        className="dock"
        onPointerMove={(e) => mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(Infinity)}
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 220, damping: 26 }}
      >
        {dockApps.map((a) => (
          <DockItem
            key={a.id}
            mouseX={mouseX}
            label={a.name}
            dockApp={a.id}
            running={windows.some((w) => w.appId === a.id)}
            onClick={() => { sfx("open"); open(a.id); }}
          >
            <AppIcon name={a.icon as IconName} size={64} />
          </DockItem>
        ))}

        <span className="dock__sep" aria-hidden />

        {/* minimized windows live to the right of the divider, as they should */}
        <AnimatePresence mode="popLayout">
          {minimized.map((w) => (
            <motion.div
              key={w.id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 460, damping: 30 }}
            >
              <DockItem
                mouseX={mouseX}
                label={w.title}
                onClick={() => { sfx("restore"); restore(w.id); }}
              >
                <span className="dock__mini">
                  <AppIcon name={w.appId as IconName} size={64} />
                </span>
              </DockItem>
            </motion.div>
          ))}
        </AnimatePresence>

        <DockItem
          mouseX={mouseX}
          label={trashFull ? "Lixeira (fechar tudo)" : "Lixeira"}
          dockApp="trash"
          onClick={() => {
            if (windows.length) {
              sfx("trash");
              windows.forEach((w) => close(w.id));
            } else {
              sfx("open");
              open("trash");
            }
          }}
        >
          <TrashIcon size={64} full={trashFull} />
        </DockItem>
      </motion.div>
    </div>
  );
}
