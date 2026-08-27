import { motion } from "motion/react";
import { useOS, APPS } from "../os/store";
import { useSfx } from "../os/useSfx";

/* A slim glyph rail replaces the dock: the tiling tradition keeps
   launching out of the way, and a mono glyph column is as quiet as
   an affordance gets. */
export default function Rail() {
  const { open, setLauncher } = useOS();
  const windows = useOS((s) => s.windows);
  const workspace = useOS((s) => s.workspace);
  const sfx = useSfx();
  const apps = Object.values(APPS).filter((a) => a.inRail);

  return (
    <nav className="rail glass" aria-label="Aplicativos">
      <button
        className="rail__btn rail__btn--launch"
        onClick={() => { sfx("open"); setLauncher(true); }}
        title="Buscar — ⌘K"
      >
        <span aria-hidden>⌕</span>
      </button>

      <span className="rail__sep" aria-hidden />

      {apps.map((a, i) => {
        const open_ = windows.some((w) => w.appId === a.id);
        const here = windows.some((w) => w.appId === a.id && w.workspace === workspace);
        return (
          <motion.button
            key={a.id}
            className="rail__btn"
            data-open={open_}
            data-here={here}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => { sfx("open"); open(a.id); }}
            onPointerEnter={() => sfx("hover")}
            title={a.name}
          >
            <span className="rail__glyph" aria-hidden>{a.glyph}</span>
            <span className="rail__tip">{a.name}</span>
            {open_ && <span className="rail__mark" aria-hidden />}
          </motion.button>
        );
      })}
    </nav>
  );
}
