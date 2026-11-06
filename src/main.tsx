import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "./components/system/AppErrorBoundary";
import "./index.css";
import { inject } from "@vercel/analytics";

// Vercel Web Analytics: independent visitor stats kept by Vercel (backup to the
// admin Analytics tab). Admin pages are not counted.
inject({
  beforeSend: (event) => (new URL(event.url).pathname.startsWith("/admin") ? null : event),
});

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
