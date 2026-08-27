import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOS, WORKSPACES, APPS, type Flavour } from "../os/store";
import { useSfx } from "../os/useSfx";
import { panelVariants, snappy, soft } from "../os/motion";

const FLAVOURS: { id: Flavour; name: string; note: string }[] = [
  { id: "matcha", name: "Matcha", note: "verde, calmo" },
  { id: "sakura", name: "Sakura", note: "rosa, macio" },
  { id: "yozora", name: "Yozora", note: "noite, lilás" },
  { id: "sumi", name: "Sumi", note: "carvão, âmbar" },
  { id: "washi", name: "Washi", note: "papel, claro" },
];

const GREET = (h: number) =>
  h < 5 ? "boa madrugada" : h < 12 ? "bom dia" : h < 18 ? "boa tarde" : "boa noite";

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
          <span className="bar__name">komorebi</span>
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
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)", transition: { duration: 0.16 } }}
            transition={soft}
          >
            {active ? (
              <>
                <span className="bar__glyph" aria-hidden>{APPS[active.appId]?.glyph ?? "◻"}</span>
                {active.title}
              </>
            ) : (
              <>{GREET(now.getHours())}, lucas</>
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
            title="Ambiente"
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
                <li className="popover__head t-label">Ambiente</li>
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
          title="Descansar — ⌘L"
        >
          <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M15.6 12.4A6.4 6.4 0 017.6 4.4a6.4 6.4 0 108 8z" />
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
