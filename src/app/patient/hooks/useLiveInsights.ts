import { useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";

/**
 * Keeps patient data fresh when the agent emits new proactive insights.
 * Used inside PatientShell so all patient pages stay in sync.
 */
export function useLiveInsights(refresh: () => Promise<void>) {
  const { on } = useSocket();

  useEffect(() => {
    const off = on("ai:insight", () => {
      refresh();
    });
    return () => { off(); };
  }, [on, refresh]);
}
