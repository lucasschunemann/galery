import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PROJECTS } from "../data/projects";

const globalIndex = (id: string) => PROJECTS.findIndex((x) => x.id === id);
import Cover from "../components/Cover";
import { useOS } from "../os/store";
import { useSfx } from "../os/useSfx";

type View = "grid" | "flow" | "list";

const GROUPS = ["Todos", "Web", "Interface", "Motion", "Produto"] as const;

const groupOf = (kind: string) => kind;

const pad = (n: number) => String(n + 1).padStart(2, "0");

import { soft, stagger } from "../os/motion";

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
      {/* ---------------- toolbar (chrome stays Aqua) ---------------- */}
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
          <p className="sourcelist__head t-label">Coleções</p>
          <ul>
            {GROUPS.map((g) => (
              <li key={g}>
                <button data-active={group === g} onClick={() => { setGroup(g); sfx("click"); }}>
                  <span className="sourcelist__ico" aria-hidden />
                  {g}
                  <span className="sourcelist__count">
                    {g === "Todos" ? PROJECTS.length : PROJECTS.filter((p) => groupOf(p.kind) === g).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="sourcelist__head t-label">Atalhos</p>
          <ul>
            <li><button onClick={() => { sfx("open"); open("about"); }}><span className="sourcelist__ico" />Sobre Mim</button></li>
            <li><button onClick={() => { sfx("open"); open("contact"); }}><span className="sourcelist__ico" />Contato</button></li>
          </ul>
        </aside>

        {/* ---------------- content ---------------- */}
        <div className="finder__content" data-view={view}>
          {/* editorial masthead: the Swiss layer starts here */}
          {view !== "flow" && (
            <header className="masthead">
              <div className="masthead__rule" />
              <div className="masthead__row">
                <span className="t-index masthead__no">{pad(0)}–{pad(items.length - 1)}</span>
                <h1 className="masthead__title t-display">Trabalho<br />selecionado</h1>
                <dl className="masthead__meta">
                  <div><dt className="t-label">Coleção</dt><dd>{group}</dd></div>
                  <div><dt className="t-label">Itens</dt><dd>{items.length}</dd></div>
                  <div><dt className="t-label">Estado</dt><dd>Publicado</dd></div>
                </dl>
              </div>
              <div className="masthead__rule masthead__rule--strong" />
            </header>
          )}

          <AnimatePresence mode="wait">
            {view === "grid" && (
              <motion.div
                key="grid" className="grid"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.11 } }}
              >
                {items.map((p, i) => (
                  <motion.button
                    key={p.id}
                    className="card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={stagger(i, 0.028)}
                    whileTap={{ scale: 0.99 }}
                    onPointerEnter={() => sfx("hover")}
                    onClick={() => openProject(p.id, p.title)}
                  >
                    <span className="card__head">
                      <span className="card__no">{pad(globalIndex(p.id))}</span>
                      <span className="card__line" />
                      <span className="card__kindmark">{p.kind}</span>
                    </span>

                    <span className="card__art">
                      <Cover variant={p.art} index={globalIndex(p.id)} accent={p.accent} title={p.title} />
                      <span className="card__sweep" aria-hidden />
                    </span>

                    <span className="card__meta">
                      <span className="card__title t-title">{p.title}</span>
                      <span className="card__kind">{p.kind}</span>
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {view === "flow" && (
              <motion.div
                key="flow" className="flow"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.995, transition: { duration: 0.11 } }}
                transition={soft}
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
                          <Cover variant={p.art} index={globalIndex(p.id)} accent={p.accent} title={p.title} />
                        </span>
                        <span className="flow__reflect" aria-hidden>
                          <Cover variant={p.art} index={globalIndex(p.id)} accent={p.accent} title={p.title} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flow__bar">
                  <p className="flow__title">
                    <span className="t-index">{pad(Math.min(flowIndex, items.length - 1))}</span>
                    <span className="t-title">{items[Math.min(flowIndex, items.length - 1)]?.title}</span>
                    <span className="flow__tag">{items[Math.min(flowIndex, items.length - 1)]?.kind}</span>
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
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.11 } }}
                transition={soft}
              >
                <thead>
                  <tr>
                    <th className="t-label">Nº</th>
                    <th className="t-label">Nome</th>
                    <th className="t-label">Tipo</th>
                    <th className="t-label">Papel</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={stagger(i, 0.03)}
                      onClick={() => openProject(p.id, p.title)}
                    >
                      <td className="list__no">{pad(globalIndex(p.id))}</td>
                      <td className="list__name">
                        <span className="list__ico"><Cover variant={p.art} index={globalIndex(p.id)} accent={p.accent} title={p.title} /></span>
                        {p.title}
                      </td>
                      <td>{p.kind}</td>
                      <td className="list__stack">{p.role}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </motion.table>
            )}
          </AnimatePresence>

          {items.length === 0 && (
            <p className="finder__empty t-body">Nenhum item corresponde a “{q}”.</p>
          )}
        </div>
      </div>

      <div className="statusbar">
        <span>{items.length} {items.length === 1 ? "projeto" : "projetos"}</span>
        <span>abra um projeto para ver o caso</span>
      </div>
    </div>
  );
}
