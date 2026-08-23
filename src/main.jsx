import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { EmpresaProvider } from "./context/EmpresaContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <EmpresaProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </EmpresaProvider>
  </StrictMode>
);
