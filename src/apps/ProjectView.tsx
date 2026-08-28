import { motion } from "motion/react";
import { PROJECTS, byId } from "../data/projects";
import Cover from "../components/Cover";
import { useOS } from "../os/store";
import { useSfx } from "../os/useSfx";

const EASE = [0.16, 1, 0.3, 1] as const;
const pad = (n: number) => String(n + 1).padStart(2, "0");

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <motion.div
          className="proj__herocard"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.06 }}
        >
          <Cover variant={p.art} index={idx} accent={p.accent} title={p.title} />
        </motion.div>

        <div className="proj__herotext">
          <p className="proj__meta">
            <span className="proj__no t-index">
              {pad(idx)} / {pad(PROJECTS.length - 1)}
            </span>
            <span className="proj__kind t-label">{p.kind}</span>
          </p>
          <span className="mask">
            <motion.h1
              className="proj__title t-display"
              initial={{ y: "108%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
            >
              {p.title}
            </motion.h1>
          </span>
          <motion.p
            className="proj__tagline"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {p.tagline}
          </motion.p>
        </div>
      </motion.header>

      <div className="proj__body">
        <div className="proj__metrics">
          {p.metrics.map((m, i) => (
            <motion.div
              key={m.label}
              className="metric"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 + i * 0.07, duration: 0.55, ease: EASE }}
            >
              <span className="metric__value">{m.value}</span>
              <span className="metric__label t-label">{m.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="proj__cols">
          <div className="proj__prose">
            {p.body.map((t, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26 + i * 0.09, duration: 0.55, ease: EASE }}
              >
                {t}
              </motion.p>
            ))}
          </div>

          <aside className="proj__side">
            <dl className="data">
              <dt className="t-label">Papel</dt>
              <dd>{p.role}</dd>
              <dt className="t-label">Tipo</dt>
              <dd>{p.kind}</dd>
              <dt className="t-label">Stack</dt>
              <dd>
                <ul className="chips">
                  {p.stack.map((s) => <li key={s} className="chip">{s}</li>)}
                </ul>
              </dd>
              {p.link && (
                <>
                  <dt className="t-label">Link</dt>
                  <dd>
                    <a href={p.link} target="_blank" rel="noreferrer" onPointerEnter={() => sfx("hover")}>
                      {p.link.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </aside>
        </div>

        <footer className="proj__foot">
          <button className="gel btn" onClick={() => { sfx("open"); open("files"); }}>
            ← Voltar à galeria
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => { sfx("open"); open("project", { id: next.id, title: next.title }); }}
          >
            {pad((idx + 1) % PROJECTS.length)} · {next.title} →
          </button>
        </footer>
      </div>
    </article>
  );
}
