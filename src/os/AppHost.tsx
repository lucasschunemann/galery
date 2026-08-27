import { lazy, Suspense } from "react";
import type { WindowState } from "./store";

const Files = lazy(() => import("../apps/Finder"));
const ProjectView = lazy(() => import("../apps/ProjectView"));
const About = lazy(() => import("../apps/About"));
const Contact = lazy(() => import("../apps/Contact"));
const Tokens = lazy(() => import("../apps/Tokens"));
const Terminal = lazy(() => import("../apps/Terminal"));
const Player = lazy(() => import("../apps/Player"));
const Archive = lazy(() => import("../apps/Trash"));

export default function AppHost({ win }: { win: WindowState }) {
  const body = () => {
    switch (win.appId) {
      case "files": return <Files />;
      case "project": return <ProjectView id={win.props?.id as string} />;
      case "about": return <About />;
      case "contact": return <Contact />;
      case "tokens": return <Tokens />;
      case "terminal": return <Terminal />;
      case "player": return <Player />;
      case "archive": return <Archive />;
      default: return <p style={{ padding: 20 }}>App não encontrado.</p>;
    }
  };

  return (
    <Suspense fallback={<div className="apploading"><span className="spinner" /></div>}>
      {body()}
    </Suspense>
  );
}
