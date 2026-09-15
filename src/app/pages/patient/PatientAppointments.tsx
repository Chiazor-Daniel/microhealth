import React, { useState } from "react";
import { motion } from "motion/react";
import { Calendar, Clock, CalendarX } from "lucide-react";
import StatusPill from "../../components/shared/StatusPill";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";

function PatientAppointments() {
  const { user } = useAuth();
  const { appointments, loading, error, refresh } = usePatientData();
  const [tab, setTab] = useState("upcoming");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = appointments.filter(a => a.scheduledDate >= today && a.status !== "cancelled");
  const past = appointments.filter(a => a.scheduledDate < today || a.status === "cancelled");
  const list = tab === "upcoming" ? upcoming : past;

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-extrabold tracking-widest uppercase" style={{ color: "#8A97A8", letterSpacing: "0.08em" }}>My Appointments</h2>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#E6F7F6", color: "#0F7D7A", border: "1px solid rgba(15,125,122,0.14)" }}>{list.length} {tab}</span>
      </div>

      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#E8EAED", boxShadow: "inset 0 1px 3px rgba(13,27,42,0.10), inset 0 1px 1px rgba(13,27,42,0.06)" }}>
        {["upcoming", "past"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl capitalize transition-all"
            style={{
              background: tab === t ? "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)" : "transparent",
              color: tab === t ? "#0F7D7A" : "#6B7280",
              boxShadow: tab === t ? "0 2px 8px rgba(13,27,42,0.08), 0 1px 3px rgba(13,27,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" : "none",
              border: tab === t ? "1px solid rgba(13,27,42,0.06)" : "1px solid transparent",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)", border: "1px solid rgba(13,27,42,0.06)", boxShadow: "var(--skeuo-shadow-sm)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#EEF0F2", border: "1px solid rgba(13,27,42,0.06)" }}>
            <CalendarX size={20} style={{ color: "#8A97A8" }} />
          </div>
          <p className="text-sm font-bold text-[#0D1B2A]">No {tab} appointments</p>
          <p className="text-xs font-medium mt-1" style={{ color: "#8A97A8" }}>{tab === "upcoming" ? "Book a visit to get started" : "Past visits will appear here"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a, i) => {
            const isUpcoming = new Date(a.scheduledDate) >= new Date(new Date().toISOString().split("T")[0]);
            return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl transition-all"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)",
                boxShadow: "0 6px 18px rgba(13,27,42,0.07), 0 1px 4px rgba(13,27,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
                border: "1px solid rgba(13,27,42,0.06)",
                borderLeft: isUpcoming ? "3px solid #0F7D7A" : "1px solid rgba(13,27,42,0.06)",
              }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <StatusPill status={a.status} />
                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: "#EEF0F2", color: "#8A97A8", letterSpacing: "0.06em" }}>{a.id?.slice(0, 8)}</span>
              </div>
              <p className="text-sm font-bold text-[#0D1B2A]">{a.department || "General Practice"}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "#E6F7F6", color: "#0F7D7A" }}><Calendar size={12} />{new Date(a.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "#EEF0F2", color: "#5F6B7A" }}><Clock size={12} />{a.scheduledTime?.slice(0, 5)}</span>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default PatientAppointments;
