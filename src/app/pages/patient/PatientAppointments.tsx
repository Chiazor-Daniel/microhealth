import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme } from "../../patient/theme";
import { SegmentedTabs } from "../../patient/components/SegmentedTabs";
import { AppointmentCard } from "../../patient/components/AppointmentCard";
import { CalendarIcon } from "../../patient/icons";

const tabs = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

function PatientAppointments() {
  const navigate = useNavigate();
  const { appointments, loading, error, refresh } = usePatientData();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = appointments.filter((a) => a.scheduledDate >= today && a.status !== "cancelled");
  const past = appointments.filter((a) => a.scheduledDate < today || a.status === "cancelled");
  const list = tab === "upcoming" ? upcoming : past;

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-2">
      {/* Header — title on the axis, count as a quiet aside */}
      <div className="relative flex items-center justify-center h-9">
        <button
          onClick={() => navigate("/patient/care")}
          aria-label="Back to care"
          className="absolute left-0 flex items-center justify-center w-9 h-9 -ml-2"
          style={{ color: patientTheme.colors.textPrimary }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14.4 5.6 8 12l6.4 6.4" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
          Appointments
        </h1>
        <span className="absolute right-0 text-[12.5px] font-semibold" style={{ color: patientTheme.colors.textSecondary }}>
          {list.length}
        </span>
      </div>

      <SegmentedTabs options={tabs} value={tab} onChange={setTab} />

      {list.length === 0 ? (
        <div className="mh-card flex flex-col items-center justify-center py-14 px-6">
          <span className="mh-icon flex items-center justify-center" style={{ width: 52, height: 52, color: patientTheme.colors.textSecondary }}>
            <CalendarIcon size={24} />
          </span>
          <p className="text-[14px] font-semibold mt-3.5" style={{ color: patientTheme.colors.textPrimary }}>
            No {tab} appointments
          </p>
          <p className="text-[13px] mt-1 text-center" style={{ color: patientTheme.colors.textMuted }}>
            {tab === "upcoming" ? "Book a visit to get started" : "Past visits will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.24) }}
            >
              <AppointmentCard
                department={a.department}
                specialty={a.department}
                doctorName={a.doctor?.user ? `${a.doctor.user.firstName} ${a.doctor.user.lastName}` : undefined}
                date={new Date(a.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                time={a.scheduledTime?.slice(0, 5) ?? ""}
                status={a.status}
                actionLabel="View Details"
                onAction={() => navigate("/patient/care/appointments")}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* The primary action lives at the foot of the list, where the eye ends */}
      {tab === "upcoming" && (
        <button
          onClick={() => navigate("/patient/book")}
          className="mh-btn-primary w-full py-3.5 text-[14px] font-semibold"
        >
          Book Appointment
        </button>
      )}
    </motion.div>
  );
}

export default PatientAppointments;
