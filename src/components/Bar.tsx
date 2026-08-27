import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOS, WORKSPACES, APPS, type Flavour } from "../os/store";
import { useSfx } from "../os/useSfx";
import { panelVariants, snappy, soft } from "../os/motion";
import Pict from "./Pict";
import Flag, { type FlagName } from "./Flag";

/* Three rooms from a school of design, three from a place. Each
   note is the reason the palette looks the way it does, and the
   ones from a place carry their flag. */
const FLAVOURS: { id: Flavour; name: string; note: string; flag?: FlagName }[] = [
  { id: "braun",    name: "Braun",    note: "Dieter Rams" },
  { id: "zurich",   name: "Zürich",   note: "Müller-Brockmann" },
  { id: "holanda",  name: "Holanda",  note: "Oranje", flag: "holanda" },
  { id: "graphite", name: "Graphite", note: "Carvão quente" },
  { id: "brasil",   name: "Brasil",   note: "Niemeyer · Burle Marx", flag: "brasil" },
  { id: "alemanha", name: "Alemanha", note: "Bauhaus", flag: "alemanha" },
];

export default function Bar() {
  const { setWorkspace, setLauncher, setFlavour, toggleGrid } = useOS();
  const workspace = useOS((s) => s.workspace);
  const windows = useOS((s) => s.windows);
  const focusId = useOS((s) => s.focusId);
  const flavour = useOS((s) => s.flavour);
  const gridOverlay = useOS((s) => s.gridOverlay);
  const sfx = useSfx();

  const [now, setNow] = useState(() => new Date());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = () => setOpen(false);
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open]);

  const active = windows.find((w) => w.id === focusId && w.workspace === workspace);
  const current = FLAVOURS.find((f) => f.id === flavour);

  return (
    <header className="bar glass">
      {/* ---------- left ---------- */}
      <div className="bar__side">
        <button
          className="bar__logo"
          onClick={() => { sfx("open"); setLauncher(true); }}
          title="Buscar — ⌘K"
        >
          <span className="bar__mark" aria-hidden />
          <span className="bar__name">raam</span>
        </button>

        <nav className="ws" aria-label="Áreas">
          {WORKSPACES.map((n) => {
            const count = windows.filter((w) => w.workspace === n).length;
            const on = workspace === n;
            return (
              <button
                key={n}
                className="ws__pill"
                data-on={on}
                data-filled={count > 0}
                onClick={() => { setWorkspace(n); sfx("click"); }}
                title={`Área ${n}`}
              >
                {on && <motion.span className="ws__bg" layoutId="ws-bg" transition={snappy} />}
                <span className="ws__n">{n}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ---------- centre ---------- */}
      <div className="bar__centre">
        <AnimatePresence mode="wait">
          <motion.span
            key={active?.id ?? "idle"}
            className="bar__win"
            data-idle={!active}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5, transition: { duration: 0.11 } }}
            transition={soft}
          >
            {active ? (
              <>
                <Pict name={APPS[active.appId]?.icon ?? "project"} size={14} className="bar__glyph" />
                {active.title}
              </>
            ) : (
              <>área {workspace}</>
            )}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ---------- right ---------- */}
      <div className="bar__side bar__side--end">
        <div className="bar__menu">
          <button
            className="bar__btn"
            onPointerDown={(e) => { e.stopPropagation(); setOpen((v) => !v); sfx("click"); }}
            data-on={open}
            title="Tema"
          >
            <span className="bar__swatch" aria-hidden />
            {current?.name}
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                className="popover glass--high"
                variants={panelVariants}
                initial="enter" animate="live" exit="leave"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <li className="popover__head t-label">Tema</li>
                {FLAVOURS.map((f, i) => (
                  <motion.li
                    key={f.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...soft, delay: 0.03 * i }}
                  >
                    <button
                      data-on={flavour === f.id}
                      onClick={() => { setFlavour(f.id); setOpen(false); sfx("chime"); }}
                    >
                      {f.flag ? (
                        <Flag name={f.flag} className="popover__flag" />
                      ) : (
                        <span className="popover__swatch" data-flavour={f.id} aria-hidden />
                      )}
                      <span className="popover__label">
                        {f.name}
                        <em>{f.note}</em>
                      </span>
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <button
          className="bar__btn bar__btn--icon"
          onClick={() => { toggleGrid(); sfx("click"); }}
          data-on={gridOverlay}
          title="Mostrar a grade — ⌘G"
        >
          <Pict name="grid" size={15} />
        </button>

        <div className="bar__time">
          <span className="bar__clock t-num">
            {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="bar__date">
            {now.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")}
          </span>
        </div>
      </div>
    </header>
  );
}
