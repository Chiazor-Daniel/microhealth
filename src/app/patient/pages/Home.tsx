import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Heart, Activity, Wind, Thermometer, Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { useInsights } from "../hooks/useInsights";
import { dashboardService } from "../../services/dashboard.service";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme } from "../theme";
import { VitalCard } from "../components/VitalCard";
import { HealthStatusCard } from "../components/HealthStatusCard";
import { AppointmentCard } from "../components/AppointmentCard";
import { InsightCard } from "../components/InsightCard";
import { SectionHeader } from "../components/SectionHeader";
import { useWearable } from "../hooks/useWearable";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatApptDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function relativeTime(iso?: string) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Build a "+N/-N" delta string comparing the two most recent numeric readings. */
function deltaLabel(latest?: number | null, prev?: number | null, unit = "bpm") {
  if (latest == null || prev == null || latest === prev) return undefined;
  const d = latest - prev;
  return `${d > 0 ? "+" : ""}${Math.round(d * 10) / 10} ${unit} · recently`;
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vitals: existingVitals, appointments, loading: dataLoading, error: dataError } = usePatientData();
  const patientId = user?.profile?.id;
  const { latest: wearableLatest, connected: wearableConnected } = useWearable(patientId, true);
  const { insights } = useInsights();

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
  const prev = sourceVitals[1] ?? existingVitals[0];

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
  const statusSubtext =
    status === "stable" ? "Your health looks stable today"
    : status === "watch" ? "Some vitals are trending up"
    : "A few vitals need attention";

  const hrDelta = deltaLabel(heartRate, prev?.heartRate ?? null, "bpm");
  const bpDelta = deltaLabel(bpSys, prev?.systolic ?? prev?.bloodPressureSystolic ?? null, "mmHg");

  const homeInsights = insights.slice(0, 2);
  const nextAppt = dashboard?.nextAppointment || appointments[0];

  if (loading || dataLoading) return <Loading />;
  if (error || dataError) return <ErrorState message={error || dataError || "Failed to load"} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[22px] font-semibold leading-tight" style={{ color: patientTheme.colors.textPrimary }}>
            {greeting}
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
            {statusSubtext}
          </p>
        </div>
        <button
          onClick={() => navigate("/patient/notifications")}
          aria-label="Notifications"
          className="mh-btn-icon w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ color: patientTheme.colors.textSecondary }}
        >
          <Bell size={18} />
        </button>
      </div>

      {/* Health status hero */}
      <HealthStatusCard
        status={status}
        label={wearableConnected ? "MicroHealth Band connected" : "Wearable disconnected"}
        updatedAt={wearableLatest ? `Updated ${relativeTime(wearableLatest.timestamp)}` : "Updated recently"}
        onViewReport={() => navigate("/patient/vitals")}
      />

      {/* Today's vitals */}
      <section>
        <SectionHeader title="Today's Vitals" actionLabel="View All" onAction={() => navigate("/patient/vitals")} />
        <div className="grid grid-cols-2 gap-3">
          {heartRate !== null && (
            <VitalCard
              label="Heart Rate"
              metric="heartRate"
              value={String(heartRate)}
              unit="bpm"
              status={heartRate > 100 || heartRate < 55 ? "attention" : heartRate > 85 ? "high" : "normal"}
              delta={hrDelta ?? (heartRate > 85 ? "Slightly above range" : "Normal range")}
              deltaTone={hrDelta ? (heartRate >= (prev?.heartRate ?? heartRate) ? "up" : "down") : "up"}
              icon={<Heart size={18} />}
              onClick={() => navigate("/patient/vitals")}
            />
          )}
          {bpSys !== null && (
            <VitalCard
              label="Blood Pressure"
              metric="bloodPressure"
              value={`${bpSys}/${bpDia ?? "—"}`}
              unit="mmHg"
              status={bpSys > 140 || (bpDia ?? 0) > 90 ? "attention" : bpSys > 125 ? "high" : "normal"}
              delta={bpDelta ?? (bpSys > 125 ? "Elevated" : "Normal")}
              deltaTone={bpDelta ? (bpSys >= (prev?.systolic ?? bpSys) ? "up" : "down") : "up"}
              icon={<Activity size={18} />}
              onClick={() => navigate("/patient/vitals")}
            />
          )}
          {spo2 !== null && (
            <VitalCard
              label="Blood Oxygen"
              metric="spo2"
              value={String(spo2)}
              unit="%"
              status={spo2 < 95 ? "attention" : "normal"}
              subtext={spo2 < 95 ? "Below 95%" : "Normal"}
              icon={<Wind size={18} />}
              onClick={() => navigate("/patient/vitals")}
            />
          )}
          {temp !== null && (
            <VitalCard
              label="Temperature"
              metric="temperature"
              value={String(temp)}
              unit="°C"
              status={temp > 37.6 ? "attention" : temp > 37.2 ? "high" : "normal"}
              subtext={temp > 37.2 ? "Slightly elevated" : "Normal"}
              icon={<Thermometer size={18} />}
              onClick={() => navigate("/patient/vitals")}
            />
          )}
          {heartRate === null && bpSys === null && spo2 === null && temp === null && (
            <>
              <VitalCard label="Heart Rate" value="—" unit="bpm" status="normal" icon={<Heart size={18} />} />
              <VitalCard label="Blood Pressure" value="—" unit="mmHg" status="normal" icon={<Activity size={18} />} />
              <VitalCard label="Blood Oxygen" value="—" unit="%" status="normal" icon={<Wind size={18} />} />
              <VitalCard label="Temperature" value="—" unit="°C" status="normal" icon={<Thermometer size={18} />} />
            </>
          )}
        </div>
      </section>

      {/* AI insights */}
      <section>
        <SectionHeader title="AI Insights" actionLabel="View All" onAction={() => navigate("/patient/ai")} />
        <div className="space-y-3">
          {homeInsights.length > 0 ? (
            homeInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                priority={insight.priority}
                title={insight.title}
                message={insight.message}
                type={insight.type as any}
                time={relativeTime(insight.createdAt)}
                chevron
                onClick={() => navigate("/patient/ai")}
              />
            ))
          ) : (
            <InsightCard
              priority="info"
              title="All clear"
              message="Your vitals look steady today. I'll keep watching your trends and let you know if anything changes."
              type="system"
              time="now"
              chevron
              onClick={() => navigate("/patient/ai")}
            />
          )}
        </div>
      </section>

      {/* Today's appointment */}
      {nextAppt && (
        <section>
          <SectionHeader title="Today's Appointment" actionLabel="View All" onAction={() => navigate("/patient/care/appointments")} />
          <AppointmentCard
            department={nextAppt.department || "General Practice"}
            specialty={nextAppt.department}
            doctorName={nextAppt.doctor?.user ? `${nextAppt.doctor.user.firstName} ${nextAppt.doctor.user.lastName}` : undefined}
            date={formatApptDate(nextAppt.scheduledDate)}
            time={nextAppt.scheduledTime?.slice(0, 5)}
            status={nextAppt.status}
            onClick={() => navigate("/patient/care/appointments")}
          />
        </section>
      )}
    </motion.div>
  );
}
