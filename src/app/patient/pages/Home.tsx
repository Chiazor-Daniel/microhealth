import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Heart, Activity, Wind, Thermometer, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { useInsights } from "../hooks/useInsights";
import { dashboardService } from "../../services/dashboard.service";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme } from "../theme";
import { VitalCard } from "../components/VitalCard";
import { HealthStatusCard } from "../components/HealthStatusCard";
import { GlassCard } from "../components/GlassCard";
import { Timeline } from "../components/Timeline";
import { AppointmentCard } from "../components/AppointmentCard";
import { InsightCard } from "../components/InsightCard";
import { useWearable } from "../hooks/useWearable";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatApptDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function relativeTime(iso?: string) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vitals: existingVitals, prescriptions, appointments, loading: dataLoading, error: dataError } = usePatientData();
  const patientId = user?.profile?.id;
  const { latest: wearableLatest, connected: wearableConnected, lastSynced } = useWearable(patientId, true);

  const { insights } = useInsights();
  const topInsight = insights.find((i) => !i.isRead) || insights[0];

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardService.getPatientDashboard()
      .then((d) => { if (!cancelled) setDashboard(d); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const sourceVitals = wearableLatest
    ? [{ id: "wearable-latest", ...wearableLatest, recordedAt: wearableLatest.timestamp }]
    : existingVitals;

  const latest = sourceVitals[0];

  const heartRate = latest?.heartRate ?? null;
  const bpSys = latest?.systolic ?? latest?.bloodPressureSystolic ?? null;
  const bpDia = latest?.diastolic ?? latest?.bloodPressureDiastolic ?? null;
  const spo2 = latest?.spo2 ?? null;
  const temp = latest?.temperature ?? null;

  const status: "stable" | "watch" | "attention" = useMemo(() => {
    if (!latest) return "stable";
    if ((bpSys && bpSys > 140) || (spo2 && spo2 < 95) || (heartRate && (heartRate > 100 || heartRate < 55))) return "attention";
    if ((bpSys && bpSys > 125) || (heartRate && heartRate > 85)) return "watch";
    return "stable";
  }, [latest, bpSys, spo2, heartRate]);

  const greeting = `${getGreeting()}, ${user?.firstName || "there"}`;

  const timelineEvents = useMemo(() => {
    const events: any[] = [];
    if (wearableLatest) {
      events.push({
        id: "wearable-hr",
        time: new Date(wearableLatest.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: "Heart rate",
        value: `${wearableLatest.heartRate} BPM`,
        type: "vital",
      });
    }
    if (latest?.systolic) {
      events.push({
        id: "wearable-bp",
        time: new Date(latest.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: "Blood pressure",
        value: `${latest.systolic}/${latest.diastolic}`,
        type: "vital",
      });
    }
    if (prescriptions[0]) {
      events.push({
        id: "med-1",
        time: "Scheduled",
        title: `Medication · ${prescriptions[0].medicine}`,
        value: prescriptions[0].dosage,
        type: "medication",
      });
    }
    return events;
  }, [wearableLatest, latest, prescriptions]);

  if (loading || dataLoading) return <Loading />;
  if (error || dataError) return <ErrorState message={error || dataError || "Failed to load"} />;

  const nextAppt = dashboard?.nextAppointment || appointments[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold" style={{ color: patientTheme.colors.textPrimary }}>{greeting}</p>
          <HealthStatusCard
            status={status}
            label={wearableConnected ? "MicroHealth Band connected" : "Wearable disconnected"}
            updatedAt={wearableLatest ? `Updated ${relativeTime(wearableLatest.timestamp)}` : "Updated recently"}
          />
        </div>
      </div>

      {/* Primary vital */}
      {heartRate !== null && (
        <VitalCard
          large
          label="Heart rate"
          value={String(heartRate)}
          unit="BPM"
          status={heartRate > 100 || heartRate < 55 ? "attention" : heartRate > 85 ? "high" : "normal"}
          subtext={heartRate > 85 ? "Slightly above your usual range" : "Within your usual range"}
          icon={<Heart size={20} style={{ color: patientTheme.colors.success }} />}
          onClick={() => navigate("/patient/vitals")}
        />
      )}

      {/* Secondary vitals */}
      <div className="grid grid-cols-2 gap-3">
        {bpSys !== null && (
          <VitalCard
            label="Blood pressure"
            value={`${bpSys}/${bpDia ?? "—"}`}
            unit="mmHg"
            status={bpSys > 140 || (bpDia ?? 0) > 90 ? "attention" : bpSys > 125 ? "high" : "normal"}
            subtext={bpSys > 125 ? "Elevated for you" : "Normal"}
            icon={<Activity size={18} style={{ color: patientTheme.colors.success }} />}
            onClick={() => navigate("/patient/vitals")}
          />
        )}
        {spo2 !== null && (
          <VitalCard
            label="SpO₂"
            value={String(spo2)}
            unit="%"
            status={spo2 < 95 ? "attention" : "normal"}
            subtext={spo2 < 95 ? "Below 95%" : "Normal"}
            icon={<Wind size={18} style={{ color: patientTheme.colors.success }} />}
            onClick={() => navigate("/patient/vitals")}
          />
        )}
        {temp !== null && (
          <VitalCard
            label="Temperature"
            value={String(temp)}
            unit="°C"
            status={temp > 37.6 ? "attention" : temp > 37.2 ? "high" : "normal"}
            subtext={temp > 37.2 ? "Slightly elevated" : "Normal"}
            icon={<Thermometer size={18} style={{ color: patientTheme.colors.success }} />}
            onClick={() => navigate("/patient/vitals")}
          />
        )}
      </div>

      {/* AI Insight */}
      {topInsight ? (
        <InsightCard
          priority={topInsight.priority}
          title={topInsight.title}
          message={topInsight.message}
          type={topInsight.type as any}
          actions={[
            { label: "Ask me", onClick: () => navigate("/patient/ai") },
          ]}
          onClick={() => navigate("/patient/ai")}
        />
      ) : (
        <GlassCard
          style={{
            background: `linear-gradient(135deg, rgba(240,253,244,0.8), rgba(255,255,255,0.7))`,
            border: `1px solid ${patientTheme.colors.aiAccent}30`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: `${patientTheme.colors.aiAccent}20`, color: patientTheme.colors.aiAccent }}
            >
              <Sparkles size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: patientTheme.colors.aiAccent }}>Health Agent</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: patientTheme.colors.textPrimary }}>
            Your vitals look steady today. I’ll keep watching your trends and let you know if anything changes.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => navigate("/patient/ai")}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: patientTheme.colors.surface, color: patientTheme.colors.primaryGreen, border: `1px solid ${patientTheme.colors.border}` }}
            >
              Ask me
            </button>
          </div>
        </GlassCard>
      )}

      {/* Upcoming care */}
      {nextAppt && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textSecondary }}>Upcoming care</p>
            <button
              onClick={() => navigate("/patient/care/appointments")}
              className="flex items-center text-xs font-semibold"
              style={{ color: patientTheme.colors.primaryGreen }}
            >
              See all <ChevronRight size={14} />
            </button>
          </div>
          <AppointmentCard
            department={nextAppt.department || "General Practice"}
            doctorName={nextAppt.doctor?.user ? `${nextAppt.doctor.user.firstName} ${nextAppt.doctor.user.lastName}` : undefined}
            date={formatApptDate(nextAppt.scheduledDate)}
            time={nextAppt.scheduledTime?.slice(0, 5)}
            status={nextAppt.status}
            onClick={() => navigate("/patient/care/appointments")}
          />
        </div>
      )}

      {/* Today timeline */}
      <div className="space-y-3">
        <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textSecondary }}>Today</p>
        {timelineEvents.length > 0 ? <Timeline events={timelineEvents} /> : <p className="text-sm" style={{ color: patientTheme.colors.textMuted }}>No events yet today.</p>}
      </div>
    </motion.div>
  );
}
