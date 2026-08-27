import { motion } from "motion/react";
import { PROJECTS, byId } from "../data/projects";
import Cover from "../components/Cover";
import { useOS } from "../os/store";
import { useSfx } from "../os/useSfx";

export default function ProjectView({ id }: { id?: string }) {
  const open = useOS((s) => s.open);
  const sfx = useSfx();
  const p = byId(id ?? "") ?? PROJECTS[0];
  const idx = PROJECTS.indexOf(p);
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  return (
    <article className="proj" key={p.id}>
      <motion.header
        className="proj__hero"
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.32, 1] }}
      >
        <Cover variant={p.art} hue={p.hue} title={p.title} className="proj__herobed" />
        <div className="proj__heroveil" />
        <div className="proj__herocard">
          <Cover variant={p.art} hue={p.hue} title={p.title} />
        </div>
        <div className="proj__herotext">
          <p className="proj__kind">{p.kind} · {p.year}</p>
          <h1 className="proj__title">{p.title}</h1>
          <p className="proj__tagline">{p.tagline}</p>
        </div>
      </motion.header>

      <div className="proj__body">
        <motion.div
          className="proj__metrics"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {p.metrics.map((m) => (
            <div key={m.label} className="metric">
              <span className="metric__value">{m.value}</span>
              <span className="metric__label">{m.label}</span>
            </div>
          ))}
        </motion.div>

        <div className="proj__cols">
          <div className="proj__prose">
            {p.body.map((t, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 + i * 0.08, duration: 0.4 }}
              >
                {t}
              </motion.p>
            ))}
          </div>

          <aside className="proj__side">
            <h2>Meu papel</h2>
            <p>{p.role}</p>
            <h2>Stack</h2>
            <ul className="chips">
              {p.stack.map((s) => <li key={s} className="chip">{s}</li>)}
            </ul>
          </aside>
        </div>

        <footer className="proj__foot">
          <button className="gel btn" onClick={() => { sfx("open"); open("finder"); }}>
            ← Voltar à galeria
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => { sfx("open"); open("project", { id: next.id, title: next.title }); }}
          >
            Próximo: {next.title} →
          </button>
        </footer>
      </div>
    </article>
  );
}
