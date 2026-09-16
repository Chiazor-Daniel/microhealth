import React, { useState } from "react";
import { Pill, Loader2 } from "lucide-react";
import { prescriptionService } from "../../services/prescription.service";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { success, error as showError } from "../../components/shared/SweetAlert";
import { patientTheme } from "../../patient/theme";
import { SegmentedTabs } from "../../patient/components/SegmentedTabs";

const tabs = [
  { value: "active", label: "Active" },
  { value: "past", label: "Past" },
];

function PatientPrescriptions() {
  const { prescriptions, loading, error, refresh } = usePatientData();
  const [tab, setTab] = useState<"active" | "past">("active");
  const [refillingId, setRefillingId] = useState<string | null>(null);

  const active = prescriptions.filter(p => p.status !== "expired");
  const past = prescriptions.filter(p => p.status === "expired");
  const list = tab === "active" ? active : past;

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
          Prescriptions
        </h1>
        <span className="mh-pill px-2.5 py-1 text-[11px] font-semibold capitalize">{list.length} {tab}</span>
      </div>

      <SegmentedTabs options={tabs} value={tab} onChange={setTab} />

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="mh-card flex flex-col items-center justify-center py-14 px-6">
          <div className="mh-icon mh-icon-teal w-12 h-12">
            <Pill size={20} />
          </div>
          <p className="text-sm font-semibold mt-3" style={{ color: patientTheme.colors.textPrimary }}>
            No {tab} prescriptions
          </p>
          <p className="text-[13px] mt-1 text-center" style={{ color: patientTheme.colors.textMuted }}>
            {tab === "active" ? "Active prescriptions appear here" : "Past prescriptions will show here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((rx) => {
            const expired = rx.status === "expired";
            return (
              <div key={rx.id} className="mh-card p-4">
                <div className="flex items-start gap-3">
                  <div className="mh-icon mh-icon-teal w-10 h-10">
                    <Pill size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                      {rx.medicine}
                    </p>
                    <p className="text-[13px] mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>{rx.dosage}</p>
                    {rx.duration && (
                      <p className="text-[12px]" style={{ color: patientTheme.colors.textMuted }}>{rx.duration}</p>
                    )}
                  </div>
                  <span className={`mh-pill ${expired ? "mh-pill-rose" : ""} px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap`}>
                    {rx.expiryDate ? `Expires ${rx.expiryDate}` : expired ? "Expired" : "Active"}
                  </span>
                </div>

                {tab === "active" && (rx.refills ?? 0) > 0 && (
                  <button
                    className="mh-btn-primary mt-3.5 w-full py-2.5 text-[13px] font-semibold"
                    onClick={() => handleRefill(rx.id)}
                    disabled={refillingId === rx.id}
                  >
                    {refillingId === rx.id ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 size={13} className="animate-spin" /> Requesting…
                      </span>
                    ) : (
                      `Request refill · ${rx.refills} left`
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PatientPrescriptions;
