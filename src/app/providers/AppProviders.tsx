import { type ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "../hooks/useAuth";
import { PatientDataProvider } from "../hooks/usePatientData";
import { OverlayHost } from "../components/shared/overlay/OverlayHost";
// Registers the browser's API/token bindings as a side effect. Must be
// imported before any provider that talks to the backend.
import "./webPlatform";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PatientDataProvider>
          {children}
          {/* Toasts + confirm dialogs, rendered above everything */}
          <OverlayHost />
        </PatientDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
