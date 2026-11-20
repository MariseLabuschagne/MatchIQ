import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
// Shared styles first, so each sport's own stylesheet (loaded with the sport) comes after them.
import "./styles.css";
import App from "./App";
import { AuthProvider } from "./core/auth/AuthProvider";

// Offline support: caches the app so it opens at a field with no signal. Updates install themselves.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
