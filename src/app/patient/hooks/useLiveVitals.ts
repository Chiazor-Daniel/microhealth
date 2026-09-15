import { useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";
import { usePatientData } from "../../hooks/usePatientData";

/**
 * Listens for real-time vital updates from the backend and refreshes
 * the patient data context so Home/Vitals reflect new readings immediately.
 */
export function useLiveVitals() {
  const { on } = useSocket();
  const { refresh } = usePatientData();

  useEffect(() => {
    const off = on("vital:updated", (vital: any) => {
      console.log("[patient] live vital received", vital);
      refresh();
    });
    return () => { off(); };
  }, [on, refresh]);
}
