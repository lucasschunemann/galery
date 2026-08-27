import { motion, AnimatePresence } from "motion/react";
import { useOS, WORKSPACES } from "../os/store";

/* In a tiling WM the desktop is not a surface you decorate — it is
   whatever the windows leave behind. So this layer keeps only the
   registration marks when work is on screen, and expands into a
   full home screen the moment a workspace is empty. */
export default function Desk() {
  const workspace = useOS((s) => s.workspace);
  const windows = useOS((s) => s.windows);
  const flavour = useOS((s) => s.flavour);
  const setLauncher = useOS((s) => s.setLauncher);
  const empty = windows.filter((w) => w.workspace === workspace).length === 0;

  return (
    <div className="desk" data-empty={empty}>
      {(["tl", "tr", "bl", "br"] as const).map((c, i) => (
        <motion.svg
          key={c}
          className={`desk__mark desk__mark--${c}`}
          viewBox="0 0 24 24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 + i * 0.06, duration: 0.5 }}
          aria-hidden
        >
          <path d="M12 0v8M12 16v8M0 12h8M16 12h8" stroke="currentColor" strokeWidth="1" />
        </motion.svg>
      ))}

      <AnimatePresence>
        {empty && (
          <motion.div
            className="home"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="home__rule" />

            <div className="home__row">
              <p className="home__index t-label">ws {String(workspace).padStart(2, "0")}</p>
              <h1 className="home__title t-display">
                Lucas
                <br />
                Schünemann
              </h1>
              <p className="home__sub t-mono">
                ux/ui designer &amp; web developer<br />
                interfaces, sistemas e movimento
              </p>
            </div>

            <div className="home__rule" />

            <dl className="home__data">
              <div><dt className="t-label">layout</dt><dd className="t-mono">dwindle</dd></div>
              <div><dt className="t-label">paleta</dt><dd className="t-mono">{flavour}</dd></div>
              <div><dt className="t-label">áreas</dt><dd className="t-mono">{WORKSPACES.length}</dd></div>
              <div><dt className="t-label">janelas</dt><dd className="t-mono">{String(windows.length).padStart(2, "0")}</dd></div>
            </dl>

            <button className="home__cta" onClick={() => setLauncher(true)}>
              <kbd>⌘</kbd><kbd>K</kbd>
              <span>abrir o launcher</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
