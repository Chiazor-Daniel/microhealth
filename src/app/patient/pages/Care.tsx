import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { MoreVertical, MessageSquare } from "lucide-react";
import { usePatientData } from "../../hooks/usePatientData";
import { patientTheme } from "../theme";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { SectionHeader } from "../components/SectionHeader";
import { AppointmentCard } from "../components/AppointmentCard";
import { MedicationCard } from "../components/MedicationCard";
import { LabResultCard } from "../components/LabResultCard";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";

const tabs = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function doctorName(appt: any) {
  const u = appt?.doctor?.user;
  return u ? `${u.firstName} ${u.lastName}` : undefined;
}

export default function Care() {
  const navigate = useNavigate();
  const { appointments, prescriptions, labs, notifications, loading, error, refresh } = usePatientData();
  const [tab, setTab] = useState<"all" | "upcoming" | "past" | "cancelled">("all");

  const now = new Date();
  const filtered = appointments.filter((a) => {
    if (tab === "all") return true;
    if (tab === "cancelled") return a.status === "cancelled";
    const isPast = new Date(a.scheduledDate) < now || a.status === "completed";
    return tab === "upcoming" ? !isPast : isPast;
  });
  const upcoming = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "completed" && new Date(a.scheduledDate) >= now
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
          Care Team & Appointments
        </h1>
        <button
          aria-label="More options"
          className="mh-btn-icon w-9 h-9 rounded-full flex items-center justify-center"
          style={{ color: patientTheme.colors.textSecondary }}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Filter tabs */}
      <SegmentedTabs options={tabs} value={tab} onChange={setTab} />

      {/* Appointments */}
      <section>
        <SectionHeader
          title={tab === "all" || tab === "upcoming" ? "Upcoming Appointments" : "Appointments"}
          actionLabel="View all"
          actionTo="/patient/care/appointments"
        />
        <div className="space-y-3">
          {(tab === "all" ? upcoming : filtered).length > 0 ? (
            (tab === "all" ? upcoming : filtered).slice(0, 3).map((appt) => (
              <AppointmentCard
                key={appt.id}
                department={appt.department}
                specialty={appt.department}
                doctorName={doctorName(appt)}
                date={formatApptDate(appt.scheduledDate)}
                time={appt.scheduledTime?.slice(0, 5)}
                status={appt.status}
                onClick={() => navigate("/patient/care/appointments")}
              />
            ))
          ) : (
            <div
              className="p-5 text-center"
              style={{
                background: patientTheme.colors.surface,
                borderRadius: patientTheme.radius.card,
                border: `1px solid ${patientTheme.colors.border}`,
              }}
            >
              <p className="text-[13px]" style={{ color: patientTheme.colors.textMuted }}>No appointments in this view.</p>
              <button
                onClick={() => navigate("/patient/book")}
                className="mh-btn-primary mt-3 px-4 py-2 rounded-xl text-[13px] font-semibold"
                style={{ color: "#fff" }}
              >
                Book an appointment
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Prescriptions */}
      {prescriptions.length > 0 && (
        <section>
          <SectionHeader title="Prescriptions" actionLabel="View all" actionTo="/patient/care/prescriptions" />
          <div className="space-y-3">
            {prescriptions.slice(0, 2).map((rx) => (
              <MedicationCard
                key={rx.id}
                name={rx.medicine}
                dosage={rx.dosage}
                duration={rx.duration}
                status={rx.status}
                refills={rx.refills}
                onRefill={() => navigate("/patient/care/prescriptions")}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent labs */}
      {labs.length > 0 && (
        <section>
          <SectionHeader title="Recent Labs" actionLabel="View all" actionTo="/patient/care/labs" />
          <div className="space-y-3">
            {labs.slice(0, 2).map((lab) => (
              <LabResultCard
                key={lab.id}
                testName={lab.testName}
                date={lab.resultNotes || ""}
                status={lab.status}
                result={lab.result}
                notes={lab.resultNotes}
              />
            ))}
          </div>
        </section>
      )}

      {/* Messages */}
      <section>
        <SectionHeader title="Messages" actionLabel="View all" actionTo="/patient/care/messages" />
        <button
          onClick={() => navigate("/patient/care/messages")}
          className="mh-card w-full flex items-center gap-3 p-4"
        >
          <div
            className="mh-icon mh-icon-blue w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ color: patientTheme.colors.info }}
          >
            <MessageSquare size={18} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>Care team</p>
            <p className="text-xs truncate" style={{ color: patientTheme.colors.textSecondary }}>
              {notifications.length > 0
                ? `${notifications.length} recent notification${notifications.length === 1 ? "" : "s"}`
                : "Chat with your doctors and nurses"}
            </p>
          </div>
          {notifications.length > 0 && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: patientTheme.colors.primaryGreen }}
            >
              {notifications.length}
            </span>
          )}
        </button>
      </section>
    </motion.div>
  );
}
