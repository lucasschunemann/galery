import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { panelVariants } from "../os/motion";
import { useOS, APPS, WORKSPACES, type Flavour } from "../os/store";
import { useSfx } from "../os/useSfx";
import { PROJECTS } from "../data/projects";
import Pict, { type PictName } from "./Pict";

type Entry = {
  key: string;
  glyph: string | PictName;
  label: string;
  hint: string;
  kind: "app" | "cmd" | "project";
  run: () => void;
};

/* A rofi-style runner: apps, projects and system commands in one
   fuzzy list, keyboard first. */
export default function Launcher() {
  const store = useOS();
  const open = useOS((s) => s.launcher);
  const sfx = useSfx();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const entries: Entry[] = useMemo(() => {
    const apps: Entry[] = Object.values(APPS)
      .filter((a) => a.inRail)
      .map((a) => ({
        key: `app:${a.id}`,
        glyph: a.icon,
        label: a.name,
        hint: a.keywords.split(" ").slice(0, 3).join(" · "),
        kind: "app",
        run: () => store.open(a.id),
      }));

    const projects: Entry[] = PROJECTS.map((p, i) => ({
      key: `proj:${p.id}`,
      glyph: String(i + 1).padStart(2, "0"),
      label: p.title,
      hint: p.kind,
      kind: "project",
      run: () => store.open("project", { id: p.id, title: p.title }),
    }));

    const cmds: Entry[] = [
      ...WORKSPACES.map((n) => ({
        key: `ws:${n}`,
        glyph: "tile",
        label: `Ir para a área ${n}`,
        hint: "workspace",
        kind: "cmd" as const,
        run: () => store.setWorkspace(n),
      })),
      ...(["braun", "zurich", "holanda", "graphite", "brasil", "alemanha"] as Flavour[]).map((f) => ({
        key: `fl:${f}`,
        glyph: "tokens",
        label: `Tema: ${f}`,
        hint: "cor aparência",
        kind: "cmd" as const,
        run: () => store.setFlavour(f),
      })),
      { key: "lock", glyph: "lock", label: "Bloquear a tela", hint: "sessão", kind: "cmd", run: () => store.lock() },
      { key: "grid", glyph: "grid", label: "Mostrar a grade", hint: "overlay layout", kind: "cmd", run: () => store.toggleGrid() },
    ];

    return [...apps, ...projects, ...cmds];
  }, [store]);

  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return entries.filter((e) => e.kind === "app");
    return entries
      .map((e) => {
        const hay = `${e.label} ${e.hint} ${e.key}`.toLowerCase();
        const i = hay.indexOf(n);
        return { e, score: i === -1 ? Infinity : i };
      })
      .filter((r) => r.score !== Infinity)
      .sort((a, b) => a.score - b.score)
      .slice(0, 9)
      .map((r) => r.e);
  }, [q, entries]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.children[sel]?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const commit = (e?: Entry) => {
    const target = e ?? results[sel];
    if (!target) return;
    sfx("open");
    target.run();
    store.setLauncher(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="launcher"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onPointerDown={(e) => e.target === e.currentTarget && store.setLauncher(false)}
        >
          <motion.div
            className="launcher__panel glass--high"
            variants={panelVariants}
            initial="enter" animate="live" exit="leave"
          >
            <div className="launcher__field">
              <span className="launcher__prompt" aria-hidden>›</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar ou executar um comando"
                aria-label="Buscar"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); sfx("hover"); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); sfx("hover"); }
                  if (e.key === "Enter") { e.preventDefault(); commit(); }
                  if (e.key === "Escape") { e.preventDefault(); store.setLauncher(false); }
                }}
              />
              <kbd className="launcher__kbd">esc</kbd>
            </div>

            <ul className="launcher__list" ref={listRef}>
              {results.map((e, i) => (
                <li key={e.key}>
                  <button
                    data-sel={i === sel}
                    onPointerEnter={() => setSel(i)}
                    onClick={() => commit(e)}
                  >
                    <span className="launcher__glyph" data-kind={e.kind} aria-hidden>
                      {e.kind === "project" ? e.glyph : <Pict name={e.glyph as PictName} size={15} />}
                    </span>
                    <span className="launcher__label">{e.label}</span>
                    <span className="launcher__hint t-mono">{e.hint}</span>
                    {i === sel && <span className="launcher__enter t-label">⏎</span>}
                  </button>
                </li>
              ))}
              {results.length === 0 && (
                <li className="launcher__empty t-mono">nada corresponde a “{q}”</li>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
