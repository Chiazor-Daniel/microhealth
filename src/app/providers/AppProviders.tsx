import { type ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "../hooks/useAuth";
import { PatientDataProvider } from "../hooks/usePatientData";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PatientDataProvider>
          {children}
        </PatientDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
