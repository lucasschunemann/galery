import { useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { useOS } from "./os/store";
import { useSfx } from "./os/useSfx";
import Boot from "./components/Boot";
import Wallpaper from "./components/Wallpaper";
import MenuBar from "./components/MenuBar";
import DesktopIcons from "./components/DesktopIcons";
import Dock from "./components/Dock";
import Window from "./components/Window";
import Screensaver from "./components/Screensaver";
import Cursor from "./components/Cursor";
import AppHost from "./os/AppHost";

export default function App() {
  const booted = useOS((s) => s.booted);
  const theme = useOS((s) => s.theme);
  const crt = useOS((s) => s.crt);
  const windows = useOS((s) => s.windows);
  const { open, close, select } = useOS();
  const focusId = useOS((s) => s.focusId);
  const sfx = useSfx();

  /* the appearance drives every colour in the OS, wallpaper included */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  /* open the gallery once the machine finishes booting */
  useEffect(() => {
    if (!booted) return;
    const t = setTimeout(() => { open("finder"); sfx("open"); }, 620);
    return () => clearTimeout(t);
  }, [booted, open, sfx]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "w" && focusId) { e.preventDefault(); sfx("close"); close(focusId); }
      if (e.key === "1") { e.preventDefault(); open("finder"); sfx("open"); }
      if (e.key === "2") { e.preventDefault(); open("terminal"); sfx("open"); }
      if (e.key === "3") { e.preventDefault(); open("player"); sfx("open"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusId, close, open, sfx]);

  return (
    <div className="os" data-crt={crt ? "on" : "off"}>
      <Wallpaper />

      {booted && (
        <>
          <MenuBar />
          <div className="desktop" onPointerDown={() => select(null)}>
            <DesktopIcons />
          </div>

          <AnimatePresence>
            {windows.map((w) => (
              <Window key={w.id} win={w}>
                <AppHost win={w} />
              </Window>
            ))}
          </AnimatePresence>

          <Dock />
          <Screensaver />
        </>
      )}

      <Cursor />
      <div className="crt-overlay" aria-hidden />
      <Boot />
    </div>
  );
}
