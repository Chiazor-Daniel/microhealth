import { type ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "../hooks/useAuth";
import { PatientDataProvider } from "../hooks/usePatientData";
import { OverlayHost } from "../components/shared/overlay/OverlayHost";

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
