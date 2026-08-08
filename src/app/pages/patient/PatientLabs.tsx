import React, { useState } from "react";
import { Download, ChevronDown, AlertTriangle } from "lucide-react";
import StatusPill from "../../components/shared/StatusPill";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";

function PatientLabs() {
  const { user } = useAuth();
  const { labs, loading, error, refresh } = usePatientData();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="py-4 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Lab Results</h2>
        <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "#0F7D7A" }}><Download size={12} />Download All</button>
      </div>

      {error && <ErrorState message={error} onRetry={refresh} />}

      {loading ? (
        <Loading />
      ) : labs.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No lab results{user ? ` for ${user.firstName}` : ""}.
        </div>
      ) : (
        <div className="space-y-2">
          {labs.map((l, i) => (
            <div key={l.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <button className="w-full flex items-center justify-between p-4 text-left" style={{ background: open === i ? "#F0FAFA" : "#F8F9FA" }} onClick={() => setOpen(open === i ? null : i)}>
                <div>
                  <p className="text-sm font-semibold text-foreground">{l.testName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{l.createdAt ? new Date(l.createdAt as string).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}</span>
                    <StatusPill status={l.status === "pending" ? "pending" : l.status === "completed" ? "active" : l.status} />
                  </div>
                </div>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-4 pb-4" style={{ background: "#F0FAFA" }}>
                  <div className="pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <p className="text-xs font-medium text-foreground">Result: <span className="font-normal text-muted-foreground">{l.result || "—"}</span></p>
                    {l.resultNotes && (
                      <p className="text-xs font-medium text-foreground mt-2">Clinician note: <span className="font-normal text-muted-foreground">{l.resultNotes}</span></p>
                    )}
                    {l.status !== "pending" && <button className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: "#0F7D7A" }}><Download size={11} />Download PDF</button>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientLabs;
