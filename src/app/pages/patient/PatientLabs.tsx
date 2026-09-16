import React, { useState } from "react";
import { Download, ChevronDown, FlaskConical } from "lucide-react";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme } from "../../patient/theme";
import { StatusBadge } from "../../patient/components/StatusBadge";

function PatientLabs() {
  const { labs, loading, error, refresh } = usePatientData();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
          Lab Results
        </h1>
        <button className="mh-btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold">
          <Download size={13} /> Download
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={refresh} />}

      {loading ? (
        <Loading />
      ) : labs.length === 0 ? (
        <div className="mh-card flex flex-col items-center justify-center py-14 px-6">
          <div className="mh-icon mh-icon-slate w-12 h-12">
            <FlaskConical size={20} />
          </div>
          <p className="text-sm font-semibold mt-3" style={{ color: patientTheme.colors.textPrimary }}>
            No lab results yet
          </p>
          <p className="text-[13px] mt-1 text-center" style={{ color: patientTheme.colors.textMuted }}>
            Results appear here after your visit
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {labs.map((l, i) => {
            const isOpen = open === i;
            const isPending = l.status === "pending";
            return (
              <div key={l.id} className="mh-card overflow-hidden">
                <button className="w-full flex items-center justify-between gap-3 p-4 text-left" onClick={() => setOpen(isOpen ? null : i)}>
                  <div className="mh-icon mh-icon-blue w-10 h-10">
                    <FlaskConical size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                      {l.testName}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: patientTheme.colors.textMuted }}>
                      {l.createdAt ? new Date(l.createdAt as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </p>
                  </div>
                  <StatusBadge status={isPending ? "pending" : "completed"} />
                  <div className="mh-icon mh-icon-slate w-8 h-8 flex-shrink-0">
                    <ChevronDown
                      size={14}
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4">
                    <div className="pt-3 space-y-2.5" style={{ borderTop: `1px solid ${patientTheme.colors.hairlineSoft}` }}>
                      <div className="mh-field rounded-xl p-3">
                        <p className="text-[11px] font-semibold" style={{ color: patientTheme.colors.textMuted }}>Result</p>
                        <p className="text-sm font-medium mt-1" style={{ color: patientTheme.colors.textPrimary }}>
                          {l.result || "—"}
                        </p>
                      </div>
                      {l.resultNotes && (
                        <div className="mh-field rounded-xl p-3">
                          <p className="text-[11px] font-semibold" style={{ color: patientTheme.colors.textMuted }}>Clinician note</p>
                          <p className="text-sm font-medium mt-1" style={{ color: patientTheme.colors.textPrimary }}>
                            {l.resultNotes}
                          </p>
                        </div>
                      )}
                      {l.status !== "pending" && (
                        <button className="mh-btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold">
                          <Download size={13} /> Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PatientLabs;
