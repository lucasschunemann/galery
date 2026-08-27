import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PROJECTS } from "../data/projects";
import Cover from "../components/Cover";
import { useOS } from "../os/store";
import { useSfx } from "../os/useSfx";

type View = "grid" | "flow" | "list";

const GROUPS = ["Todos", "Web", "Interface", "Motion", "Produto"] as const;

const groupOf = (kind: string) => {
  const k = kind.toLowerCase();
  if (k.includes("web") || k.includes("webgl") || k.includes("editorial")) return "Web";
  if (k.includes("system") || k.includes("interface") || k.includes("dashboard")) return "Interface";
  if (k.includes("motion") || k.includes("identidade")) return "Motion";
  return "Produto";
};

export default function Finder() {
  const [view, setView] = useState<View>("grid");
  const [group, setGroup] = useState<string>("Todos");
  const [q, setQ] = useState("");
  const [flowIndex, setFlowIndex] = useState(0);
  const open = useOS((s) => s.open);
  const sfx = useSfx();

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      const inGroup = group === "Todos" || groupOf(p.kind) === group;
      const inQuery =
        !needle ||
        [p.title, p.kind, p.tagline, ...p.stack].join(" ").toLowerCase().includes(needle);
      return inGroup && inQuery;
    });
  }, [group, q]);

  const openProject = (id: string, title: string) => {
    sfx("open");
    open("project", { id, title });
  };

  return (
    <div className="finder">
      {/* ---------------- toolbar ---------------- */}
      <div className="toolbar">
        <div className="seg">
          <button aria-pressed={view === "grid"} onClick={() => { setView("grid"); sfx("click"); }}>Grade</button>
          <button aria-pressed={view === "flow"} onClick={() => { setView("flow"); sfx("click"); }}>Cover Flow</button>
          <button aria-pressed={view === "list"} onClick={() => { setView("list"); sfx("click"); }}>Lista</button>
        </div>
        <label className="field">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="7" cy="7" r="4.4" /><path d="M10.4 10.4L14 14" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no portfólio"
            aria-label="Buscar projetos"
          />
        </label>
      </div>

      <div className="finder__main">
        {/* ---------------- source list ---------------- */}
        <aside className="sourcelist">
          <p className="sourcelist__head">Coleções</p>
          <ul>
            {GROUPS.map((g) => (
              <li key={g}>
                <button
                  data-active={group === g}
                  onClick={() => { setGroup(g); sfx("click"); }}
                >
                  <span className="sourcelist__ico" aria-hidden />
                  {g}
                  <span className="sourcelist__count">
                    {g === "Todos" ? PROJECTS.length : PROJECTS.filter((p) => groupOf(p.kind) === g).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="sourcelist__head">Atalhos</p>
          <ul>
            <li><button onClick={() => { sfx("open"); open("about"); }}><span className="sourcelist__ico" />Sobre Mim</button></li>
            <li><button onClick={() => { sfx("open"); open("contact"); }}><span className="sourcelist__ico" />Contato</button></li>
          </ul>
        </aside>

        {/* ---------------- content ---------------- */}
        <div className="finder__content" data-view={view}>
          <AnimatePresence mode="wait">
            {view === "grid" && (
              <motion.div
                key="grid" className="grid"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                {items.map((p, i) => (
                  <motion.button
                    key={p.id}
                    className="card"
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.045, type: "spring", stiffness: 320, damping: 26 }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    onPointerEnter={() => sfx("hover")}
                    onClick={() => openProject(p.id, p.title)}
                  >
                    <span className="card__art">
                      <Cover variant={p.art} hue={p.hue} title={p.title} />
                      <span className="card__sweep" aria-hidden />
                    </span>
                    <span className="card__meta">
                      <span className="card__title">{p.title}</span>
                      <span className="card__kind">{p.kind} · {p.year}</span>
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {view === "flow" && (
              <motion.div
                key="flow" className="flow"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <div className="flow__stage">
                  {items.map((p, i) => {
                    const d = i - Math.min(flowIndex, items.length - 1);
                    const abs = Math.abs(d);
                    if (abs > 3.4) return null;
                    return (
                      <button
                        key={p.id}
                        className="flow__item"
                        style={{
                          transform: `translateX(${d * 116}px) translateZ(${-abs * 130}px) rotateY(${d === 0 ? 0 : d > 0 ? -58 : 58}deg)`,
                          zIndex: 20 - Math.round(abs),
                          opacity: 1 - abs * 0.16,
                        }}
                        onClick={() => (d === 0 ? openProject(p.id, p.title) : (setFlowIndex(i), sfx("hover")))}
                        aria-label={p.title}
                      >
                        <span className="flow__art">
                          <Cover variant={p.art} hue={p.hue} title={p.title} />
                        </span>
                        <span className="flow__reflect" aria-hidden>
                          <Cover variant={p.art} hue={p.hue} title={p.title} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flow__bar">
                  <p className="flow__title">
                    {items[Math.min(flowIndex, items.length - 1)]?.title}
                    <span>{items[Math.min(flowIndex, items.length - 1)]?.tagline}</span>
                  </p>
                  <input
                    type="range" min={0} max={Math.max(0, items.length - 1)} step={1}
                    value={Math.min(flowIndex, items.length - 1)}
                    onChange={(e) => { setFlowIndex(+e.target.value); sfx("hover"); }}
                    className="flow__slider"
                    aria-label="Navegar pelos projetos"
                  />
                </div>
              </motion.div>
            )}

            {view === "list" && (
              <motion.table
                key="list" className="list"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <thead>
                  <tr><th>Nome</th><th>Tipo</th><th>Ano</th><th>Stack</th></tr>
                </thead>
                <tbody>
                  {items.map((p, i) => (
                    <tr key={p.id} onClick={() => openProject(p.id, p.title)} data-odd={i % 2 === 1}>
                      <td>
                        <span className="list__ico"><Cover variant={p.art} hue={p.hue} title={p.title} /></span>
                        {p.title}
                      </td>
                      <td>{p.kind}</td>
                      <td>{p.year}</td>
                      <td className="list__stack">{p.stack.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </motion.table>
            )}
          </AnimatePresence>

          {items.length === 0 && (
            <p className="finder__empty">Nenhum item corresponde a “{q}”.</p>
          )}
        </div>
      </div>

      <div className="statusbar">
        <span>{items.length} {items.length === 1 ? "item" : "itens"}</span>
        <span>Abra um projeto para ver o caso</span>
      </div>
    </div>
  );
}
