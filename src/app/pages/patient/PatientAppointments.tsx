import React, { useState } from "react";
import { motion } from "motion/react";
import { Calendar, Clock, CalendarX } from "lucide-react";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme } from "../../patient/theme";
import { SegmentedTabs } from "../../patient/components/SegmentedTabs";
import { StatusBadge } from "../../patient/components/StatusBadge";

const tabs = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

function PatientAppointments() {
  const { appointments, loading, error, refresh } = usePatientData();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = appointments.filter(a => a.scheduledDate >= today && a.status !== "cancelled");
  const past = appointments.filter(a => a.scheduledDate < today || a.status === "cancelled");
  const list = tab === "upcoming" ? upcoming : past;

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
          My Appointments
        </h1>
        <span className="mh-pill px-2.5 py-1 text-[11px] font-semibold capitalize">{list.length} {tab}</span>
      </div>

      <SegmentedTabs options={tabs} value={tab} onChange={setTab} />

      {list.length === 0 ? (
        <div className="mh-card flex flex-col items-center justify-center py-14 px-6">
          <div className="mh-icon mh-icon-slate w-12 h-12">
            <CalendarX size={20} />
          </div>
          <p className="text-sm font-semibold mt-3" style={{ color: patientTheme.colors.textPrimary }}>
            No {tab} appointments
          </p>
          <p className="text-[13px] mt-1 text-center" style={{ color: patientTheme.colors.textMuted }}>
            {tab === "upcoming" ? "Book a visit to get started" : "Past visits will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mh-card flex items-center gap-3 p-4"
            >
              <div className="mh-icon mh-icon-blue w-11 h-11">
                <Calendar size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                  {a.department || "General Practice"}
                </p>
                <p className="text-[13px] mt-0.5 flex items-center gap-1.5" style={{ color: patientTheme.colors.textSecondary }}>
                  <Clock size={12} />
                  {new Date(a.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {a.scheduledTime ? ` · ${a.scheduledTime.slice(0, 5)}` : ""}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default PatientAppointments;
