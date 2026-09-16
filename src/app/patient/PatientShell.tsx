import { type ReactNode } from "react";
import { Outlet } from "react-router";
import { BottomNavigation } from "./components/BottomNavigation";
import { patientTheme } from "./theme";
import { useLiveVitals } from "./hooks/useLiveVitals";
import { useLiveInsights } from "./hooks/useLiveInsights";
import { usePatientData } from "../hooks/usePatientData";
import "./patient.css";

function PatientContent() {
  useLiveVitals();
  const { refresh } = usePatientData();
  useLiveInsights(refresh);
  return <Outlet />;
}

export function PatientShell() {
  return (
    <div
      className="patient-shell relative flex flex-col min-h-dvh"
      style={{ background: patientTheme.colors.background }}
    >
      {/* Scrollable content area */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          paddingBottom: "calc(110px + env(safe-area-inset-bottom))",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="mx-auto w-full max-w-md px-5 py-6">
          <PatientContent />
        </div>
      </main>

      {/* Fixed bottom navigation sits above content */}
      <BottomNavigation />
    </div>
  );
}
