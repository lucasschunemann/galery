import { useEffect } from "react";
import { useOS, WORKSPACES } from "./os/store";
import { useSfx } from "./os/useSfx";
import { useCompact } from "./os/useViewport";
import Wallpaper from "./components/Wallpaper";
import Bar from "./components/Bar";
import Rail from "./components/Rail";
import Windows from "./components/Windows";
import Launcher from "./components/Launcher";
import Boot from "./components/Boot";
import Cursor from "./components/Cursor";
import Desk from "./components/Desk";
import NinoEmoji from "./components/NinoEmoji";
import GridOverlay from "./components/GridOverlay";
import SnapLayer from "./components/SnapLayer";

export default function App() {
  const phase = useOS((s) => s.phase);
  const flavour = useOS((s) => s.flavour);
  const launcher = useOS((s) => s.launcher);
  const focusId = useOS((s) => s.focusId);
  const store = useOS();
  const sfx = useSfx();
  const compact = useCompact();

  useEffect(() => {
    document.documentElement.dataset.flavour = flavour;
  }, [flavour]);

  /* ---------------- keyboard: the OS is driven from here ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const typing =
        e.target instanceof HTMLElement &&
        e.target.closest("input, textarea, [contenteditable]");

      if (phase === "boot") {
        if (e.key === "Enter") document.querySelector<HTMLElement>(".boot__power")?.click();
        return;
      }
      if (e.key === "Escape" && launcher) { store.setLauncher(false); return; }

      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); store.setLauncher(!launcher); sfx("open"); return; }
      if (!mod && e.key === " " && !typing) { e.preventDefault(); store.setLauncher(true); sfx("open"); return; }

      if (!mod) return;

      const k = e.key.toLowerCase();
      if (WORKSPACES.map(String).includes(e.key)) {
        e.preventDefault();
        store.setWorkspace(Number(e.key));
        sfx("click");
      } else if (k === "w" && focusId) {
        e.preventDefault(); sfx("close"); store.close(focusId);
      } else if (k === "f" && focusId) {
        e.preventDefault(); sfx("click"); store.toggleFloat(focusId);
      } else if (k === "g") {
        e.preventDefault(); store.toggleGrid(); sfx("click");
      } else if (k === "j") {
        e.preventDefault(); store.focusCycle(1); sfx("hover");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, launcher, focusId, store, sfx]);

  return (
    <div className="os" data-phase={phase}>
      <Wallpaper />

      {phase === "live" && (
        <>
          <Desk />
          <NinoEmoji />
          <Bar />
          {!compact && <Rail />}
          <Windows />
          <SnapLayer />
          <Launcher />
          <GridOverlay />
        </>
      )}

      <Boot />
      <Cursor />
    </div>
  );
}
