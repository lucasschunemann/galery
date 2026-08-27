import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOS, type Theme } from "../os/store";
import { useSfx } from "../os/useSfx";

type Item =
  | { label: string; action: () => void; hint?: string; check?: boolean }
  | { sep: true };

const THEMES: { id: Theme; name: string }[] = [
  { id: "aqua", name: "Aqua Azul" },
  { id: "graphite", name: "Grafite" },
  { id: "bliss", name: "Bliss" },
  { id: "sunset", name: "Pôr do Sol" },
];

export default function MenuBar() {
  const { open, setTheme, toggleSound, toggleCRT, setScreensaver } = useOS();
  const theme = useOS((s) => s.theme);
  const sound = useOS((s) => s.sound);
  const crt = useOS((s) => s.crt);
  const windows = useOS((s) => s.windows);
  const focusId = useOS((s) => s.focusId);
  const sfx = useSfx();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const away = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [openMenu]);

  const activeApp = windows.find((w) => w.id === focusId);

  const MENUS: Record<string, Item[]> = {
    "": [
      { label: "Sobre este AERO OS", action: () => open("about") },
      { sep: true },
      { label: "Preferências do Sistema…", action: () => open("playground") },
      { label: "Iniciar protetor de tela", action: () => setScreensaver(true), hint: "⌃⇧" },
      { sep: true },
      { label: "Esvaziar a Lixeira", action: () => { sfx("trash"); useOS.getState().windows.forEach((w) => useOS.getState().close(w.id)); } },
    ],
    Arquivo: [
      { label: "Abrir Galeria", action: () => open("finder"), hint: "⌘1" },
      { label: "Abrir Terminal", action: () => open("terminal"), hint: "⌘2" },
      { label: "Abrir AeroTunes", action: () => open("player"), hint: "⌘3" },
      { sep: true },
      { label: "Fechar janela", action: () => focusId && useOS.getState().close(focusId), hint: "⌘W" },
    ],
    Aparência: [
      ...THEMES.map((t) => ({
        label: t.name,
        check: theme === t.id,
        action: () => { setTheme(t.id); sfx("chime"); },
      })),
      { sep: true },
      { label: "Efeito CRT", check: crt, action: () => { toggleCRT(); sfx("click"); } },
      { label: "Som da interface", check: sound, action: () => { toggleSound(); SFXPing(); } },
    ],
    Ajuda: [
      { label: "Arraste as janelas pela barra de título", action: () => {} },
      { label: "Clique duplo na barra para maximizar", action: () => {} },
      { label: "Digite 'help' no Terminal", action: () => open("terminal") },
      { sep: true },
      { label: "Falar com o Lucas", action: () => open("contact") },
    ],
  };

  function SFXPing() {
    // fires after the toggle so unmuting is audible
    setTimeout(() => useOS.getState().sound && import("../os/sound").then((m) => m.SFX.chime(660)), 20);
  }

  const hhmm = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = now
    .toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    .replace(/\.$/, "")
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="menubar" ref={barRef}>
      <div className="menubar__left">
        <MenuButton
          id=""
          label={<BubbleLogo />}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          items={MENUS[""]}
          className="menubar__logo"
        />
        <span className="menubar__app">{activeApp?.title ?? "Finder"}</span>
        {["Arquivo", "Aparência", "Ajuda"].map((m) => (
          <MenuButton key={m} id={m} label={m} openMenu={openMenu} setOpenMenu={setOpenMenu} items={MENUS[m]} />
        ))}
      </div>

      <div className="menubar__right">
        <button
          className="menubar__extra"
          onClick={() => { toggleCRT(); sfx("click"); }}
          aria-pressed={crt}
          title="Efeito CRT"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="1.5" y="3" width="13" height="9" rx="1.6" />
            <path d="M5.5 14.2h5" />
          </svg>
        </button>
        <button
          className="menubar__extra"
          onClick={() => { toggleSound(); SFXPing(); }}
          aria-pressed={sound}
          title={sound ? "Silenciar" : "Ativar som"}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <path d="M3 6h2.4L8.6 3v10L5.4 10H3z" fill="currentColor" stroke="none" />
            {sound ? (
              <>
                <path d="M10.8 5.6a3.4 3.4 0 010 4.8" />
                <path d="M12.6 3.8a6 6 0 010 8.4" />
              </>
            ) : (
              <path d="M11 6l3.4 4M14.4 6L11 10" />
            )}
          </svg>
        </button>
        <span className="menubar__clock" title={date}>
          <span className="menubar__date">{date}</span>
          {hhmm}
        </span>
      </div>
    </div>
  );
}

function MenuButton({
  id, label, items, openMenu, setOpenMenu, className,
}: {
  id: string;
  label: React.ReactNode;
  items: Item[];
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
  className?: string;
}) {
  const isOpen = openMenu === id;
  const sfx = useSfx();

  return (
    <div className="menubar__menu">
      <button
        className={`menubar__btn ${className ?? ""}`}
        data-open={isOpen}
        onPointerDown={(e) => { e.stopPropagation(); setOpenMenu(isOpen ? null : id); sfx("hover"); }}
        onPointerEnter={() => openMenu !== null && setOpenMenu(id)}
      >
        {label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className="menu frost"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 560, damping: 34 }}
          >
            {items.map((it, i) =>
              "sep" in it ? (
                <li key={i} className="menu__sep" />
              ) : (
                <li key={i}>
                  <button
                    className="menu__item"
                    onClick={() => { it.action(); setOpenMenu(null); sfx("click"); }}
                  >
                    <span className="menu__check">{it.check ? "✓" : ""}</span>
                    <span className="menu__label">{it.label}</span>
                    {it.hint && <span className="menu__hint">{it.hint}</span>}
                  </button>
                </li>
              )
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function BubbleLogo() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-label="Menu do sistema">
      <defs>
        <radialGradient id="mb-logo" cx="34%" cy="28%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.42" stopColor="#7fd0ff" />
          <stop offset="1" stopColor="#0a4c9b" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="8.4" fill="url(#mb-logo)" />
      <ellipse cx="8" cy="6" rx="4.6" ry="2.5" fill="#fff" opacity=".72" />
    </svg>
  );
}
