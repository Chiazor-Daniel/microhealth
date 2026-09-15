import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AppProviders } from "./app/providers/AppProviders.tsx";
import "./styles/index.css";
import "./app/patient/patient.css";

createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <App />
  </AppProviders>
);
