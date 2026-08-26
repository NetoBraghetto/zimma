import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/assets/css/main.css";
import { IconContext } from "react-icons/lib";
import App from "./app";
import { AuthProvider } from "./hooks/use-auth";

// biome-ignore lint/style/noNonNullAssertion: false positive
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IconContext.Provider value={{ className: "react-icon", style: { verticalAlign: "middle" } }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </IconContext.Provider>
  </StrictMode>,
);
