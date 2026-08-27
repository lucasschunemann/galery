import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOS, WORKSPACES, APPS, type Flavour } from "../os/store";
import { useSfx } from "../os/useSfx";
import { panelVariants, snappy, soft } from "../os/motion";

const FLAVOURS: { id: Flavour; name: string; note: string }[] = [
  { id: "graphite", name: "Graphite", note: "escuro neutro" },
  { id: "slate", name: "Slate", note: "escuro frio" },
  { id: "ochre", name: "Ochre", note: "escuro quente" },
  { id: "paper", name: "Paper", note: "claro quente" },
  { id: "delft", name: "Delft", note: "claro frio" },
];

export default function Bar() {
  const { setWorkspace, setLauncher, setFlavour, lock } = useOS();
  const workspace = useOS((s) => s.workspace);
  const windows = useOS((s) => s.windows);
  const focusId = useOS((s) => s.focusId);
  const flavour = useOS((s) => s.flavour);
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
                <span className="bar__glyph" aria-hidden>{APPS[active.appId]?.glyph ?? "◻"}</span>
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
                      <span className="popover__swatch" data-flavour={f.id} aria-hidden />
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
          onClick={() => { sfx("close"); lock(); }}
          title="Bloquear — ⌘L"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="9" width="12" height="8" rx="1.5" />
            <path d="M7 9V6.5a3 3 0 016 0V9" />
          </svg>
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
