import React, { useState } from "react";
import { Pill, Loader2 } from "lucide-react";
import { prescriptionService } from "../../services/prescription.service";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { success, error as showError } from "../../components/shared/SweetAlert";

function PatientPrescriptions() {
  const { user } = useAuth();
  const { prescriptions, loading, error, refresh } = usePatientData();
  const [tab, setTab] = useState("active");
  const [refillingId, setRefillingId] = useState<string | null>(null);

  const active = prescriptions.filter(p => p.status !== "expired");
  const past = prescriptions.filter(p => p.status === "expired");

  const handleRefill = async (id: string) => {
    setRefillingId(id);
    try {
      await prescriptionService.requestRefill(id);
      success("Refill requested", "Your provider has been notified");
    } catch (err: any) {
      showError("Refill failed", err?.message);
    } finally {
      setRefillingId(null);
    }
  };

  return (
    <div className="py-4 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-base font-bold text-foreground">Prescriptions</h2>
      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        {["active", "past"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0F7D7A" : "#6B7280", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <Loading />
      ) : (
        <div className="space-y-3">
          {(tab === "active" ? active : past).length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No {tab} prescriptions{user ? ` for ${user.firstName}` : ""}.
            </div>
          ) : (
            (tab === "active" ? active : past).map((rx) => (
              <div key={rx.id} className="p-4 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{rx.medicine}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rx.dosage}</p>
                    {rx.duration && <p className="text-xs text-muted-foreground">{rx.duration}</p>}
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}>
                    <Pill size={16} style={{ color: "#0F7D7A" }} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {rx.expiryDate ? `Expires: ${rx.expiryDate}` : rx.status === "expired" ? "Expired" : "Active"}
                  </span>
                  {tab === "active" && (rx.refills ?? 0) > 0 && (
                    <button
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
                      style={{ background: "#0F7D7A" }}
                      onClick={() => handleRefill(rx.id)}
                      disabled={refillingId === rx.id}
                    >
                      {refillingId === rx.id ? (
                        <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" />Requesting...</span>
                      ) : (
                        `Request Refill (${rx.refills})`
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default PatientPrescriptions;
