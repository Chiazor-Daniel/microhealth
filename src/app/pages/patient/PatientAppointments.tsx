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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-base font-bold text-foreground">My Appointments</h2>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F3F4F6", boxShadow: "var(--skeuo-shadow-inset)" }}>
        {["upcoming", "past"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all"
            style={{
              background: tab === t ? "linear-gradient(180deg, #FFFFFF 0%, #F0FAFA 100%)" : "transparent",
              color: tab === t ? "#0F7D7A" : "#6B7280",
              boxShadow: tab === t ? "var(--skeuo-shadow-sm)" : "none",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CalendarX size={36} className="mb-3 opacity-40" />
          <p className="text-sm">No {tab} appointments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl transition-all"
              style={{
                background: "var(--skeuo-card-gradient)",
                boxShadow: "var(--skeuo-shadow)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <StatusPill status={a.status} />
                <span className="text-xs text-muted-foreground">{a.id?.slice(0, 8)}</span>
              </div>
              <p className="text-sm font-bold text-foreground">{a.department || "General Practice"}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar size={11} />{new Date(a.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{a.scheduledTime?.slice(0, 5)}</span>
              </div>
              {tab !== "upcoming" && (
                <button className="mt-2 text-xs font-bold" style={{ color: "#0F7D7A" }}>View Summary →</button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default PatientAppointments;
