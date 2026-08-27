import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useOS, WORKSPACES, APPS, type Flavour } from "../os/store";
import { useSfx } from "../os/useSfx";

const FLAVOURS: { id: Flavour; name: string }[] = [
  { id: "graphite", name: "graphite" },
  { id: "mocha", name: "mocha" },
  { id: "nord", name: "nord" },
  { id: "paper", name: "paper" },
];

export default function Bar() {
  const { setWorkspace, setLauncher, setFlavour, toggleSound, lock } = useOS();
  const workspace = useOS((s) => s.workspace);
  const windows = useOS((s) => s.windows);
  const focusId = useOS((s) => s.focusId);
  const flavour = useOS((s) => s.flavour);
  const sound = useOS((s) => s.sound);
  const sfx = useSfx();

  const [now, setNow] = useState(() => new Date());
  const [up, setUp] = useState(0);
  const [flavOpen, setFlavOpen] = useState(false);

  useEffect(() => {
    const i = setInterval(() => { setNow(new Date()); setUp((u) => u + 1); }, 1000);
    return () => clearInterval(i);
  }, []);

  const active = windows.find((w) => w.id === focusId);
  const mm = String(Math.floor(up / 60)).padStart(2, "0");
  const ss = String(up % 60).padStart(2, "0");

  return (
    <header className="bar glass">
      {/* ---------- left: identity + workspaces ---------- */}
      <div className="bar__side">
        <button
          className="bar__logo"
          onClick={() => { sfx("open"); setLauncher(true); }}
          title="Abrir launcher — ⌘K"
        >
          <span className="bar__mark" aria-hidden />
          helvetia
        </button>

        <nav className="ws" aria-label="Áreas de trabalho">
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
                title={`Área ${n} — ${count} janela(s)`}
              >
                {on && (
                  <motion.span className="ws__bg" layoutId="ws-bg" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                <span className="ws__n">{n}</span>
                {count > 0 && <span className="ws__dot" aria-hidden />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ---------- centre: focused window ---------- */}
      <div className="bar__centre">
        {active ? (
          <span className="bar__win">
            <span className="bar__glyph" aria-hidden>{APPS[active.appId]?.glyph ?? "◻"}</span>
            {active.title}
          </span>
        ) : (
          <span className="bar__win bar__win--idle">área {workspace} · vazia</span>
        )}
      </div>

      {/* ---------- right: system ---------- */}
      <div className="bar__side bar__side--end">
        <span className="bar__stat t-mono" title="Janelas abertas">
          <b>WIN</b> {String(windows.length).padStart(2, "0")}
        </span>
        <span className="bar__stat t-mono" title="Tempo de sessão">
          <b>UP</b> {mm}:{ss}
        </span>

        <div className="bar__menu">
          <button
            className="bar__btn"
            onClick={() => { setFlavOpen((v) => !v); sfx("click"); }}
            data-on={flavOpen}
            title="Paleta"
          >
            <span className="bar__swatch" aria-hidden />
            {flavour}
          </button>
          {flavOpen && (
            <motion.ul
              className="popover glass--high"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
              onPointerLeave={() => setFlavOpen(false)}
            >
              {FLAVOURS.map((f) => (
                <li key={f.id}>
                  <button
                    data-on={flavour === f.id}
                    onClick={() => { setFlavour(f.id); setFlavOpen(false); sfx("chime"); }}
                  >
                    <span className="popover__swatch" data-flavour={f.id} aria-hidden />
                    {f.name}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </div>

        <button
          className="bar__btn bar__btn--icon"
          onClick={() => { toggleSound(); sfx("click"); }}
          data-on={sound}
          title={sound ? "Silenciar" : "Ativar som"}
        >
          {sound ? "◍" : "◌"}
        </button>

        <button
          className="bar__btn bar__btn--icon"
          onClick={() => { sfx("close"); lock(); }}
          title="Bloquear — ⌘L"
        >
          ⏻
        </button>

        <time className="bar__clock t-num" dateTime={now.toISOString()}>
          {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </time>
      </div>
    </header>
  );
}
