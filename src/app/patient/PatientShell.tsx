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
      className="patient-shell flex flex-col min-h-dvh overflow-hidden"
      style={{ background: patientTheme.colors.background }}
    >
      <main
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(84px + env(safe-area-inset-bottom))",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="mx-auto w-full max-w-md px-5 py-5">
          <PatientContent />
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
