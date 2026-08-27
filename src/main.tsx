import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/type.css";
import "./styles/menubar.css";
import "./styles/window.css";
import "./styles/dock.css";
import "./styles/apps.css";
import "./styles/boot.css";
import "./styles/misc.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
