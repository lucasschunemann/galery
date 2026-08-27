import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/os.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/screens.css";
import "./styles/apps.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
