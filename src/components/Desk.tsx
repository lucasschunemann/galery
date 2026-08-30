import { motion, AnimatePresence } from "motion/react";
import { useOS, WORKSPACES } from "../os/store";
import Ambient from "./Ambient";

/* In a tiling WM the desktop is not a surface you decorate. It is
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
      <AnimatePresence>
        {empty && <Ambient key="ambient" />}
      </AnimatePresence>

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
              <p className="home__index t-label">Área {workspace}</p>
              <h1 className="home__title t-display">
                Lucas
                <br />
                Schünemann
              </h1>
              <p className="home__sub">
                UX/UI Designer &amp; Web Developer
                <em>Interfaces, sistemas e movimento</em>
              </p>
            </div>

            <div className="home__rule" />

            <dl className="home__data">
              <div><dt className="t-label">Tema</dt><dd>{flavour}</dd></div>
              <div><dt className="t-label">Áreas</dt><dd>{WORKSPACES.length}</dd></div>
              <div><dt className="t-label">Janelas</dt><dd>{windows.length}</dd></div>
            </dl>

            <button className="home__cta" onClick={() => setLauncher(true)}>
              <kbd>⌘</kbd><kbd>K</kbd>
              <span>Buscar</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
