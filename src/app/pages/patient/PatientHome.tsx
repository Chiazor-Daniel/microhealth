import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Heart, Calendar, FlaskConical, Pill, FileText,
  Activity, MapPin,
} from "lucide-react";
import { dashboardService } from "../../services/dashboard.service";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";

const CARD_SHADOW = "var(--skeuo-shadow)";

function PatientHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prescriptions, vitals, loading: dataLoading, error: dataError } = usePatientData();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await dashboardService.getPatientDashboard();
        if (!cancelled) setData(d);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const nextAppt = data?.nextAppointment;
  const apptDate = nextAppt?.scheduledDate
    ? new Date(nextAppt.scheduledDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;
  const apptTime = nextAppt?.scheduledTime?.slice(0, 5);
  const doctorName = nextAppt?.doctor?.user
    ? `${nextAppt.doctor.user.firstName} ${nextAppt.doctor.user.lastName}`
    : "Your doctor";

  const reminders = [
    ...(prescriptions || []).slice(0, 2).map((rx: any) => ({
      icon: Pill,
      title: `Take ${rx.medicine}`,
      sub: rx.dosage,
      color: "#0F7D7A",
    })),
    ...(vitals || []).slice(0, 1).map((v: any) => ({
      icon: Activity,
      title: "Vitals recorded",
      sub: `BP ${v.bloodPressureSystolic || "—"}/${v.bloodPressureDiastolic || "—"} · HR ${v.heartRate || "—"}`,
      color: "#F59E0B",
    })),
  ];

  if (loading || dataLoading) return <Loading />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-0 py-4 space-y-4 max-w-3xl mx-auto">
      {error && <ErrorState message={error} />}
      {dataError && <ErrorState message={dataError} />}

      <div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0F7D7A 0%, #0A5E5C 100%)",
          minHeight: 130,
          boxShadow: "0 12px 32px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        <div className="relative z-10">
          <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.75)" }}>Next appointment</p>
          {nextAppt ? (
            <>
              <p className="text-lg font-bold text-white mt-1">{doctorName}</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{nextAppt.department || "General Practice"} · {apptDate}, {apptTime}</p>
            </>
          ) : (
            <p className="text-lg font-bold text-white mt-1">No upcoming appointment</p>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="mt-3 px-3 py-1.5 text-xs font-bold rounded-lg"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", backdropFilter: "blur(4px)" }}
            onClick={() => navigate("/patient/appointments")}
          >
            View details →
          </motion.button>
        </div>
        <div className="absolute right-4 bottom-4 opacity-10">
          <Heart size={80} color="#fff" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: "Book Appt", path: "book" },
            { icon: FlaskConical, label: "My Labs", path: "labs" },
            { icon: Pill, label: "Prescriptions", path: "prescriptions" },
            { icon: FileText, label: "Records", path: "appointments" },
          ].map(({ icon: Icon, label, path }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/patient/${path}`)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
              style={{
                background: "var(--skeuo-card-gradient)",
                boxShadow: "var(--skeuo-shadow-sm)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E6F7F6" }}>
                <Icon size={16} style={{ color: "#0F7D7A" }} />
              </div>
              <span className="text-[10px] font-bold text-foreground text-center leading-tight">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Health Reminders</h3>
        <div className="space-y-2">
          {reminders.length > 0 ? reminders.map(({ icon: Icon, title, sub, color }) => (
            <motion.div
              key={title}
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{
                background: "var(--skeuo-card-gradient)",
                boxShadow: "var(--skeuo-shadow-sm)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
                <Icon size={15} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </motion.div>
          )) : (
            <div className="p-3 rounded-2xl text-sm text-muted-foreground" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow-sm)" }}>No active reminders.</div>
          )}
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: CARD_SHADOW }}>
        <div className="h-24 w-full" style={{ background: "linear-gradient(135deg, #E6F7F6, #B2E8E6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MapPin size={32} style={{ color: "#0F7D7A", opacity: 0.5 }} />
        </div>
        <div className="p-3 bg-white">
          <p className="text-sm font-bold text-foreground">Your nearest MicroHealth unit</p>
          <p className="text-xs text-muted-foreground mt-0.5">Visit the care unit listed on your appointment.</p>
          <div className="flex gap-2 mt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-1.5 text-xs font-bold rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 3px 8px rgba(15,125,122,0.3)" }}
              onClick={() => navigate("/patient/appointments")}
            >
              See Appointment
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PatientHome;
