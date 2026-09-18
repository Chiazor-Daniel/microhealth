import { Outlet, useLocation } from "react-router";
import { BottomNavigation } from "./components/BottomNavigation";
import { useLiveVitals } from "./hooks/useLiveVitals";
import { useLiveInsights } from "./hooks/useLiveInsights";
import { usePatientData } from "../hooks/usePatientData";
import "./patient.css";

/**
 * Screens that take the whole frame.
 *
 * The Health Agent is a conversation: it ends in a composer that belongs on the
 * bottom edge, and a floating nav sitting on top of that is two things fighting
 * for the same strip of screen. Everywhere else the nav is how you move around
 * the app, so it stays.
 */
const FULL_FRAME = ["/patient/ai"];

function PatientContent() {
  useLiveVitals();
  const { refresh } = usePatientData();
  useLiveInsights(refresh);
  return <Outlet />;
}

export function PatientShell() {
  const { pathname } = useLocation();
  const fullFrame = FULL_FRAME.includes(pathname);

  return (
    <div className="patient-shell mh-atmosphere relative flex flex-col min-h-dvh md:items-center md:justify-center">
      <div className="mh-app-frame">
        {/* Scrollable content area */}
        <main
          className={`flex-1 overflow-y-auto overscroll-contain ${fullFrame ? "flex flex-col" : ""}`}
          style={{
            paddingTop: "max(12px, env(safe-area-inset-top))",
            /* Only reserve a strip for the nav when the nav is actually there. */
            paddingBottom: fullFrame
              ? "max(0px, env(safe-area-inset-bottom))"
              : "calc(104px + env(safe-area-inset-bottom))",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* A full-frame screen's content is asked to fill the column, so its
              own `margin-top: auto` (the chat composer) has something to push
              against. Ordinary screens keep plain block flow. */}
          <div className={`mx-auto w-full max-w-md px-5 py-5 ${fullFrame ? "flex-1 flex flex-col" : ""}`}>
            <PatientContent />
          </div>
        </main>

        {/* Fixed bottom navigation sits above content */}
        {!fullFrame && (
          <div className="mh-bottom-nav-wrap">
            <BottomNavigation />
          </div>
        )}
      </div>
    </div>
  );
}
