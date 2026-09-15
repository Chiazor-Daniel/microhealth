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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-3xl mx-auto">
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
        <h3 className="text-[11px] font-extrabold tracking-widest uppercase mb-3" style={{ color: "#8A97A8", letterSpacing: "0.08em" }}>Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Calendar, label: "Book Appointment", sub: "Find a slot", path: "book", accent: "#0F7D7A" },
            { icon: FlaskConical, label: "Lab Results", sub: "View reports", path: "labs", accent: "#7C3AED" },
            { icon: Pill, label: "Prescriptions", sub: "Refill & track", path: "prescriptions", accent: "#0F7D7A" },
            { icon: FileText, label: "My Records", sub: "Visit history", path: "appointments", accent: "#2563EB" },
          ].map(({ icon: Icon, label, sub, path, accent }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/patient/${path}`)}
              className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)",
                boxShadow: "0 6px 18px rgba(13,27,42,0.07), 0 1px 4px rgba(13,27,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
                border: "1px solid rgba(13,27,42,0.06)",
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + "14", border: `1px solid ${accent}18` }}>
                <Icon size={18} style={{ color: accent }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0D1B2A] leading-none">{label}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "#8A97A8" }}>{sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-extrabold tracking-widest uppercase mb-3" style={{ color: "#8A97A8", letterSpacing: "0.08em" }}>Health Reminders</h3>
        <div className="space-y-2.5">
          {reminders.length > 0 ? reminders.map(({ icon: Icon, title, sub, color }) => (
            <div
              key={title}
              className="flex items-center gap-3 p-3.5 rounded-2xl"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)",
                boxShadow: "0 4px 14px rgba(13,27,42,0.06), 0 1px 3px rgba(13,27,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                border: "1px solid rgba(13,27,42,0.06)",
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "14", border: `1px solid ${color}18` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#0D1B2A]">{title}</p>
                <p className="text-xs font-medium" style={{ color: "#8A97A8" }}>{sub}</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}66` }} />
            </div>
          )) : (
            <div className="p-4 rounded-2xl text-sm font-medium text-center" style={{ color: "#8A97A8", background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)", boxShadow: "var(--skeuo-shadow-sm)", border: "1px solid rgba(13,27,42,0.06)" }}>No active reminders.</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFB 100%)", border: "1px solid rgba(13,27,42,0.06)", boxShadow: "0 6px 18px rgba(13,27,42,0.07), 0 1px 4px rgba(13,27,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
        <div className="h-20 w-full flex items-center gap-3 px-4" style={{ background: "linear-gradient(135deg, #E6F7F6 0%, #D0EEEA 100%)", borderBottom: "1px solid rgba(15,125,122,0.10)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(15,125,122,0.14), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
            <MapPin size={18} style={{ color: "#0F7D7A" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0D1B2A]">Your nearest MicroHealth unit</p>
            <p className="text-xs font-medium" style={{ color: "#5F6B7A" }}>Visit the care unit on your appointment</p>
          </div>
        </div>
        <div className="p-3.5 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl text-white"
            style={{ background: "linear-gradient(180deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: "0 4px 12px rgba(15,125,122,0.30), inset 0 1px 0 rgba(255,255,255,0.18)" }}
            onClick={() => navigate("/patient/appointments")}
          >
            See Appointment
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl"
            style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F2F4F5 100%)", color: "#0F7D7A", border: "1px solid rgba(15,125,122,0.18)", boxShadow: "0 2px 8px rgba(13,27,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" }}
            onClick={() => navigate("/patient/book")}
          >
            Book Visit
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default PatientHome;
