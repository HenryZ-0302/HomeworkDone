import { StrictMode } from "react";
import "./i18n.ts";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// ⬇️ 新增这一行
import PasswordGate from "./components/PasswordGate";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* ⬇️ 用密码门包起来 */}
    <PasswordGate>
      <App />
    </PasswordGate>
  </StrictMode>,
);
