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
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-extrabold tracking-widest uppercase" style={{ color: "#8A97A8", letterSpacing: "0.08em" }}>Lab Results</h2>
        <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl" style={{ color: "#0F7D7A", background: "#E6F7F6", border: "1px solid rgba(15,125,122,0.14)" }}><Download size={12} />Download</button>
      </div>

      {error && <ErrorState message={error} onRetry={refresh} />}

      {loading ? (
        <Loading />
      ) : labs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)", border: "1px solid rgba(13,27,42,0.06)", boxShadow: "var(--skeuo-shadow-sm)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#EEF0F2", border: "1px solid rgba(13,27,42,0.06)" }}>
            <AlertTriangle size={20} style={{ color: "#8A97A8" }} />
          </div>
          <p className="text-sm font-bold text-[#0D1B2A]">No lab results yet</p>
          <p className="text-xs font-medium mt-1" style={{ color: "#8A97A8" }}>Results appear here after your visit</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {labs.map((l, i) => {
            const isOpen = open === i;
            const isPending = l.status === "pending";
            return (
            <div
              key={l.id}
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: isOpen ? "linear-gradient(180deg, #F0FAFA 0%, #E6F7F6 100%)" : "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)",
                border: isOpen ? "1px solid rgba(15,125,122,0.14)" : "1px solid rgba(13,27,42,0.06)",
                boxShadow: isOpen ? "0 8px 24px rgba(15,125,122,0.10), 0 2px 8px rgba(13,27,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" : "0 4px 14px rgba(13,27,42,0.06), 0 1px 3px rgba(13,27,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                borderLeft: isPending ? "3px solid #F59E0B" : isOpen ? "3px solid #0F7D7A" : "1px solid rgba(13,27,42,0.06)",
              }}
            >
              <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(isOpen ? null : i)}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#0D1B2A]">{l.testName}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#EEF0F2", color: "#5F6B7A" }}>{l.createdAt ? new Date(l.createdAt as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                    <StatusPill status={l.status === "pending" ? "pending" : l.status === "completed" ? "active" : l.status} />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ml-3" style={{ background: isOpen ? "#0F7D7A" : "#EEF0F2", border: `1px solid ${isOpen ? "rgba(15,125,122,0.2)" : "rgba(13,27,42,0.06)"}` }}>
                  <ChevronDown size={14} className="transition-transform" style={{ color: isOpen ? "#fff" : "#8A97A8", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <div className="pt-3 space-y-2" style={{ borderTop: "1px solid rgba(13,27,42,0.08)" }}>
                    <div className="rounded-xl p-3" style={{ background: "#fff", border: "1px solid rgba(13,27,42,0.06)", boxShadow: "inset 0 1px 3px rgba(13,27,42,0.04)" }}>
                      <p className="text-xs font-bold" style={{ color: "#8A97A8", letterSpacing: "0.06em" }}>RESULT</p>
                      <p className="text-sm font-medium text-[#0D1B2A] mt-1">{l.result || "—"}</p>
                    </div>
                    {l.resultNotes && (
                      <div className="rounded-xl p-3" style={{ background: "#fff", border: "1px solid rgba(13,27,42,0.06)", boxShadow: "inset 0 1px 3px rgba(13,27,42,0.04)" }}>
                        <p className="text-xs font-bold" style={{ color: "#8A97A8", letterSpacing: "0.06em" }}>CLINICIAN NOTE</p>
                        <p className="text-sm font-medium text-[#0D1B2A] mt-1">{l.resultNotes}</p>
                      </div>
                    )}
                    {l.status !== "pending" && <button className="flex items-center gap-1.5 mt-1 text-xs font-bold px-3 py-2 rounded-xl" style={{ color: "#0F7D7A", background: "#E6F7F6", border: "1px solid rgba(15,125,122,0.14)" }}><Download size={12} />Download PDF</button>}
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
