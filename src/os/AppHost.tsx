import { lazy, Suspense } from "react";
import type { WindowState } from "./store";

const Finder = lazy(() => import("../apps/Finder"));
const ProjectView = lazy(() => import("../apps/ProjectView"));
const About = lazy(() => import("../apps/About"));
const Contact = lazy(() => import("../apps/Contact"));
const Playground = lazy(() => import("../apps/Playground"));
const Terminal = lazy(() => import("../apps/Terminal"));
const Player = lazy(() => import("../apps/Player"));
const Trash = lazy(() => import("../apps/Trash"));

export default function AppHost({ win }: { win: WindowState }) {
  const body = () => {
    switch (win.appId) {
      case "finder": return <Finder />;
      case "project": return <ProjectView id={win.props?.id as string} />;
      case "about": return <About />;
      case "contact": return <Contact />;
      case "playground": return <Playground />;
      case "terminal": return <Terminal />;
      case "player": return <Player />;
      case "trash": return <Trash />;
      default: return <p style={{ padding: 20 }}>App não encontrado.</p>;
    }
  };

  return (
    <Suspense fallback={<div className="apploading"><span className="spinner" /></div>}>
      {body()}
    </Suspense>
  );
}
