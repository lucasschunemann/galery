import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useOS, APPS } from "../os/store";
import { useSfx } from "../os/useSfx";
import { AppIcon, type IconName } from "./Icon";

type Pos = { x: number; y: number };

/** classic Mac placement: a column hugging the right edge */
const initial = (i: number): Pos => ({ x: -108, y: 44 + i * 96 });

export default function DesktopIcons() {
  const open = useOS((s) => s.open);
  const selection = useOS((s) => s.selection);
  const select = useOS((s) => s.select);
  const sfx = useSfx();

  const apps = Object.values(APPS).filter((a) => a.onDesktop);
  const [pos, setPos] = useState<Record<string, Pos>>(() =>
    Object.fromEntries(apps.map((a, i) => [a.id, initial(i)]))
  );
  const lastTap = useRef<Record<string, number>>({});

  const activate = (id: string) => {
    sfx("open");
    open(id);
    select(null);
  };

  return (
    <div className="desk-icons">
      {apps.map((a, i) => {
        const p = pos[a.id] ?? initial(i);
        const selected = selection === a.id;
        return (
          <motion.button
            key={a.id}
            className="dicon"
            data-selected={selected}
            style={{ right: -p.x, top: p.y }}
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={(_, info) =>
              setPos((s) => ({
                ...s,
                [a.id]: { x: (s[a.id]?.x ?? initial(i).x) - info.offset.x, y: (s[a.id]?.y ?? initial(i).y) + info.offset.y },
              }))
            }
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.07, type: "spring", stiffness: 300, damping: 22 }}
            whileTap={{ scale: 0.94 }}
            onPointerEnter={() => sfx("hover")}
            onClick={(e) => {
              e.stopPropagation();
              const now = Date.now();
              const prev = lastTap.current[a.id] ?? 0;
              lastTap.current[a.id] = now;
              if (now - prev < 380) activate(a.id);
              else { select(a.id); sfx("click"); }
            }}
            onDoubleClick={() => activate(a.id)}
            title={`${a.name} — clique duplo para abrir`}
          >
            <span className="dicon__art">
              <AppIcon name={a.icon as IconName} size={54} />
            </span>
            <span className="dicon__label">{a.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
