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
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-extrabold tracking-widest uppercase" style={{ color: "#8A97A8", letterSpacing: "0.08em" }}>Prescriptions</h2>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: tab === "active" ? "#E6F7F6" : "#EEF0F2", color: tab === "active" ? "#0F7D7A" : "#8A97A8", border: `1px solid ${tab === "active" ? "rgba(15,125,122,0.14)" : "rgba(13,27,42,0.06)"}` }}>{(tab === "active" ? active : past).length} {tab}</span>
      </div>
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#E8EAED", boxShadow: "inset 0 1px 3px rgba(13,27,42,0.10), inset 0 1px 1px rgba(13,27,42,0.06)" }}>
        {["active", "past"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl capitalize transition-all"
            style={{
              background: tab === t ? "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)" : "transparent",
              color: tab === t ? "#0F7D7A" : "#6B7280",
              boxShadow: tab === t ? "0 2px 8px rgba(13,27,42,0.08), 0 1px 3px rgba(13,27,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" : "none",
              border: tab === t ? "1px solid rgba(13,27,42,0.06)" : "1px solid transparent",
            }}>
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
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)", border: "1px solid rgba(13,27,42,0.06)", boxShadow: "var(--skeuo-shadow-sm)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#EEF0F2", border: "1px solid rgba(13,27,42,0.06)" }}>
                <Pill size={20} style={{ color: "#8A97A8" }} />
              </div>
              <p className="text-sm font-bold text-[#0D1B2A]">No {tab} prescriptions</p>
              <p className="text-xs font-medium mt-1" style={{ color: "#8A97A8" }}>{tab === "active" ? "Active prescriptions appear here" : "Past prescriptions will show here"}</p>
            </div>
          ) : (
            (tab === "active" ? active : past).map((rx) => (
              <div
                key={rx.id}
                className="p-4 rounded-2xl"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)",
                  border: "1px solid rgba(13,27,42,0.06)",
                  boxShadow: "0 6px 18px rgba(13,27,42,0.07), 0 1px 4px rgba(13,27,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
                  borderLeft: tab === "active" ? "3px solid #0F7D7A" : "1px solid rgba(13,27,42,0.06)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0D1B2A]">{rx.medicine}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: "#5F6B7A" }}>{rx.dosage}</p>
                    {rx.duration && <p className="text-xs font-medium" style={{ color: "#8A97A8" }}>{rx.duration}</p>}
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(145deg, #E6F7F6, #D0EEEA)", border: "1px solid rgba(15,125,122,0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" }}>
                    <Pill size={16} style={{ color: "#0F7D7A" }} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3.5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: rx.status === "expired" ? "#FEF2F2" : "#E6F7F6", color: rx.status === "expired" ? "#DC2626" : "#0F7D7A", border: `1px solid ${rx.status === "expired" ? "rgba(239,68,68,0.14)" : "rgba(15,125,122,0.14)"}` }}>
                    {rx.expiryDate ? `Expires ${rx.expiryDate}` : rx.status === "expired" ? "Expired" : "Active"}
                  </span>
                  {tab === "active" && (rx.refills ?? 0) > 0 && (
                    <button
                      className="text-xs font-bold px-3.5 py-2 rounded-xl text-white disabled:opacity-60 active:scale-95 transition-all"
                      style={{ background: "linear-gradient(180deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: "0 3px 10px rgba(15,125,122,0.30), inset 0 1px 0 rgba(255,255,255,0.18)" }}
                      onClick={() => handleRefill(rx.id)}
                      disabled={refillingId === rx.id}
                    >
                      {refillingId === rx.id ? (
                        <span className="flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" />Requesting…</span>
                      ) : (
                        `Refill · ${rx.refills} left`
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
