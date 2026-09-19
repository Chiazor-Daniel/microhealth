import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { usePatientData } from "../../hooks/usePatientData";
import { patientTheme } from "../theme";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { SectionHeader } from "../components/SectionHeader";
import { AppointmentCard } from "../components/AppointmentCard";
import { MedicationCard } from "../components/MedicationCard";
import { LabResultCard } from "../components/LabResultCard";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { ChatIcon, ChevronRightIcon, MoreIcon } from "../icons";

/**
 * The tabs are where you are going, not what is being filtered — each one
 * opens its own screen, which is why the sections below stay put.
 */
const TABS = [
  { value: "appointments", label: "Appointments" },
  { value: "prescriptions", label: "Prescriptions" },
  { value: "labs", label: "Labs" },
  { value: "messages", label: "Messages" },
];

const ROUTES: Record<string, string> = {
  appointments: "/patient/care/appointments",
  prescriptions: "/patient/care/prescriptions",
  labs: "/patient/care/labs",
  messages: "/patient/care/messages",
};

function formatApptDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function doctorName(appt: any) {
  const u = appt?.doctor?.user;
  return u ? `${u.firstName} ${u.lastName}` : undefined;
}

export default function Care() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointments, prescriptions, labs, notifications, loading, error, refresh } = usePatientData();

  /* "Appointments" is this screen; the others are their own routes. */
  const tab = Object.keys(ROUTES).find((k) => location.pathname.startsWith(ROUTES[k])) ?? "appointments";

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "completed" && new Date(a.scheduledDate) >= now
  );
  const shown = upcoming.length > 0 ? upcoming : appointments.filter((a) => a.status !== "cancelled");

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <motion.div
      className="space-y-5"
    >
      {/* Header */}
      <div className="relative flex items-center justify-center h-9">
        <h1 className="text-[22px] font-semibold" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
          Care
        </h1>
        <button
          aria-label="More options"
          className="absolute right-0 flex items-center justify-center w-9 h-9 -mr-1"
          style={{ color: patientTheme.colors.textSecondary }}
        >
          <MoreIcon size={18} />
        </button>
      </div>

      <SegmentedTabs options={TABS} value={tab} onChange={(v) => navigate(ROUTES[v])} />

      {/* Appointments */}
      <section>
        <SectionHeader
          title="Upcoming Appointments"
          actionLabel="View all"
          actionTo="/patient/care/appointments"
        />
        <div className="space-y-3">
          {shown.length > 0 ? (
            shown.slice(0, 2).map((appt) => (
              <AppointmentCard
                key={appt.id}
                department={appt.department}
                specialty={appt.department}
                doctorName={doctorName(appt)}
                date={formatApptDate(appt.scheduledDate)}
                time={appt.scheduledTime?.slice(0, 5) ?? ""}
                status={appt.status}
                actionLabel="View Details"
                onAction={() => navigate("/patient/care/appointments")}
              />
            ))
          ) : (
            <div className="mh-card p-5 text-center">
              <p className="text-[13px]" style={{ color: patientTheme.colors.textMuted }}>
                Nothing booked yet.
              </p>
              <button
                onClick={() => navigate("/patient/book")}
                className="mh-btn-primary mt-3.5 px-5 py-2.5 text-[13px] font-semibold"
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
                onClick={() => navigate("/patient/care/prescriptions")}
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
          className="mh-card w-full flex items-center gap-3 p-3.5"
        >
          <span
            className="mh-icon flex items-center justify-center flex-shrink-0"
            style={{ width: 40, height: 40, color: patientTheme.colors.teal, background: patientTheme.gradients.tileTeal }}
          >
            <ChatIcon size={19} />
          </span>
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-[13.5px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
              Care team
            </span>
            <span className="block text-[12.5px] truncate mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
              {notifications.length > 0
                ? `${notifications.length} recent notification${notifications.length === 1 ? "" : "s"}`
                : "Chat with your doctors and nurses"}
            </span>
          </span>
          {notifications.length > 0 ? (
            <span
              className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{
                minWidth: 22,
                height: 22,
                padding: "0 6px",
                borderRadius: 999,
                color: "#FFFFFF",
                background: patientTheme.colors.primaryGreen,
              }}
            >
              {notifications.length}
            </span>
          ) : (
            <ChevronRightIcon size={16} />
          )}
        </button>
      </section>
    </motion.div>
  );
}
