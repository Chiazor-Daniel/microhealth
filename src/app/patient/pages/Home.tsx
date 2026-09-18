import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { useInsights } from "../hooks/useInsights";
import { dashboardService } from "../../services/dashboard.service";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { Avatar } from "../components/Avatar";
import { FluidText } from "../components/FluidText";
import { patientTheme, metricTint } from "../theme";
import { StatusBadge } from "../components/StatusBadge";
import { useWearable } from "../hooks/useWearable";
import { BrandMark } from "../components/BrandMark";
import { HeartIcon, DropletIcon, OxygenIcon, TrendIcon, CalendarIcon, SparkIcon, SpeakerIcon } from "../icons";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { buildSeries } from "../lib/timeSeries";

/** The healthy band for each metric on this screen. */
const BANDS: Record<string, [number, number]> = {
  heartRate: [60, 100],
  bloodPressure: [90, 120],
  spo2: [95, 100],
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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

function clockTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * The value range a series is drawn across.
 *
 * Shared with the native build's Sparkline so the label and the line agree.
 */
function sparkDomain(data: number[]): [number, number] {
  if (!data.length) return [0, 1];
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  return lo === hi ? [lo - 1, hi + 1] : [lo, hi];
}

/** Width of the chart's value gutter. */
const HERO_AXIS_W = 26;

/**
 * The whisper of mint under the hero line — no axes, no chrome.
 *
 * Scaled to the series' own min and max rather than anchored at zero. Zero is
 * the conventional choice and the wrong one for a vital sign: a resting heart
 * rate sitting at 72 ± 3 bpm draws as a dead flat line against a 0–100 axis,
 * and the whole point of the chart is to show that it *is* moving. The caller
 * labels the range so an auto-scaled wobble can't read as a crisis.
 */
function HeroSpark({ data, domain }: { data: number[]; domain: [number, number] }) {
  if (data.length < 2) return <div style={{ height: 72 }} />;
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={72}>
      <AreaChart data={points} margin={{ top: 6, right: 4, left: 0, bottom: 6 }}>
        <defs>
          <linearGradient id="mhHeroGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.30} />
            <stop offset="70%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.07} />
            <stop offset="100%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={domain} />
        <Area
          type="monotone"
          dataKey="v"
          stroke={patientTheme.colors.primaryGreen}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="url(#mhHeroGradient)"
          /* No dots: with a reading every few minutes the points crowd into a
             string of beads and the line stops reading as a line. */
          dot={false}
          activeDot={false}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
          className="mh-chart-line"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** A compact metric card — icon inline-left, the number as the anchor. */
function MetricCard({
  label,
  value,
  unit,
  status,
  metric,
  icon,
  onClick,
  muted,
}: {
  label: string;
  value: string;
  unit: string;
  status: string;
  metric: string;
  icon: React.ReactNode;
  onClick: () => void;
  muted?: boolean;
}) {
  const tint = metricTint(metric);
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="mh-card text-left p-3.5 w-full"
      style={muted ? { background: patientTheme.gradients.mint } : undefined}
      aria-label={`${label}, ${value} ${unit}, ${status}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="mh-icon w-9 h-9" style={{ color: tint.fg, background: tint.tile }}>
          {icon}
        </div>
        <p className="text-[12px] font-medium leading-tight truncate" style={{ color: patientTheme.colors.textPrimary }}>
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-1 mt-2.5">
        <FluidText
          value={String(value)}
          style={{
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            color: patientTheme.colors.textPrimary,
            fontVariantNumeric: "tabular-nums",
          }}
        />
        <span className="text-[12px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>
          {unit}
        </span>
      </div>
      <div className="mt-1.5">
        <StatusBadge status={status} />
      </div>
    </motion.button>
  );
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

  const sourceVitals = useMemo(
    () =>
      wearableLatest
        ? [{ id: "wearable-latest", ...wearableLatest, recordedAt: wearableLatest.timestamp } as any, ...existingVitals]
        : existingVitals,
    [wearableLatest, existingVitals]
  );

  const latest: any = sourceVitals[0];

  const heartRate = latest?.heartRate ?? null;
  const bpSys = latest?.systolic ?? latest?.bloodPressureSystolic ?? null;
  const bpDia = latest?.diastolic ?? latest?.bloodPressureDiastolic ?? null;
  const spo2 = latest?.spo2 ?? null;

  const status: "stable" | "watch" | "attention" = useMemo(() => {
    if (!latest) return "stable";
    if ((bpSys && bpSys > 140) || (spo2 && spo2 < 95) || (heartRate && (heartRate > 100 || heartRate < 55))) return "attention";
    if ((bpSys && bpSys > 125) || (heartRate && heartRate > 85)) return "watch";
    return "stable";
  }, [latest, bpSys, spo2, heartRate]);

  const statusSubtext =
    status === "stable" ? "Your health looks stable today"
    : status === "watch" ? "Some vitals are trending up"
    : "A few vitals need attention";

  const hrInRange = heartRate != null && heartRate >= BANDS.heartRate[0] && heartRate <= BANDS.heartRate[1];

  /* The hero series keeps its timestamps — the chart is read as "over the day",
     so it needs to say which day-part it is showing. */
  const heroPoints = useMemo(
    () => buildSeries(sourceVitals, "day", (v: any) => v.heartRate, 24),
    [sourceVitals]
  );
  const heroSeries = useMemo(() => heroPoints.map((p) => p.value), [heroPoints]);
  const heroDomain = useMemo(() => sparkDomain(heroSeries), [heroSeries]);

  const topInsight = insights[0];
  const nextAppt = dashboard?.nextAppointment || appointments[0];
  const updatedAt = wearableLatest?.timestamp ?? latest?.recordedAt;

  /**
   * Today, in order. The same three things the day is actually made of —
   * what the body did, what was taken, what is scheduled.
   */
  const timeline = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const isToday = (ms: number) => ms >= startOfDay.getTime();
    const seen = new Set<string>();

    const entries: { at: number; label: string; value: string; tone: string; kind: "reading" | "agent" | "appointment" }[] = [];

    for (const v of sourceVitals as any[]) {
      const ms = v.recordedAt ? new Date(v.recordedAt).getTime() : 0;
      if (!isToday(ms)) continue;
      const label = v.id === "wearable-latest" ? "Current reading" : "Heart rate";
      if (seen.has(label)) continue;
      seen.add(label);
      entries.push({
        at: ms,
        label,
        value: v.heartRate != null ? `${v.heartRate} BPM` : "—",
        /* A reading's tone is a *status*, so it takes the signal colour — the
           row is saying "this is fine", not "this is the product". */
        tone: v.heartRate > 100 || v.heartRate < 55 ? patientTheme.colors.error : patientTheme.colors.signal,
        kind: "reading",
      });
      if (entries.filter((e) => e.kind === "reading").length >= 3) break;
    }

    for (const a of appointments ?? []) {
      /* A date-only value parses as midnight, which would sort the day's
         appointment above readings taken in the evening. Anchor it to its
         scheduled time when there is one. */
      const day = a.scheduledDate ? new Date(a.scheduledDate) : null;
      if (!day || !isToday(day.getTime())) continue;
      const [h, m] = (a.scheduledTime ?? "").split(":").map(Number);
      if (!Number.isNaN(h)) day.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0);
      entries.push({
        at: day.getTime(),
        label: "Appointment",
        value: `${a.department || "General Practice"}${a.scheduledTime ? ` • ${a.scheduledTime.slice(0, 5)}` : ""}`,
        tone: patientTheme.colors.signal,
        kind: "appointment",
      });
    }

    if (topInsight?.createdAt) {
      const ms = new Date(topInsight.createdAt).getTime();
      if (isToday(ms)) {
        entries.push({ at: ms, label: "Health Agent", value: "Checked in on your trends", tone: "#F59E0B", kind: "agent" });
      }
    }

    return entries.sort((a, b) => b.at - a.at).slice(0, 5);
  }, [sourceVitals, appointments, topInsight]);

  if (loading || dataLoading) return <Loading />;
  if (error || dataError) return <ErrorState message={error || dataError || "Failed to load"} />;


  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Greeting — the state of things is the second line, in green */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[22px] font-semibold leading-tight" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
            {getGreeting()}, {user?.firstName || "there"}
          </p>
          <p className="text-[14px] font-semibold mt-1" style={{ color: patientTheme.colors.primaryDark }}>
            {statusSubtext}
          </p>
          <p className="text-[12px] mt-1.5 flex items-center gap-1.5" style={{ color: patientTheme.colors.textMuted }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                /* A pairing indicator is a *status*, so it takes the signal
                   colour, not the brand — the band being connected says "how
                   am I doing", not "what is this". */
                background: wearableConnected ? patientTheme.colors.signal : patientTheme.colors.textMuted,
                display: "inline-block",
              }}
            />
            Last updated {relativeTime(updatedAt)}
          </p>
        </div>
        <button
          onClick={() => navigate("/patient/profile")}
          aria-label="Your profile"
        >
          <Avatar seed={user?.profile?.id ?? user?.email} name={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`} size={46} />
        </button>
      </div>

      {/* Heart rate — the headline reading, on its own mint surface */}
      {heartRate !== null && (
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate("/patient/vitals/heartRate")}
          className="mh-card w-full text-left block"
          style={{ padding: 16, background: patientTheme.gradients.mint }}
          aria-label={`Heart rate, ${heartRate} BPM, ${hrInRange ? "in range" : "out of range"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {/* On the hero the mark inverts: a solid green disc carrying a
                  white heart, rather than a tinted tile like the small cards. */}
              <span
                className="mh-icon-green flex items-center justify-center flex-shrink-0"
                style={{ width: 40, height: 40 }}
              >
                <HeartIcon size={20} />
              </span>
              <p className="text-[13px] font-medium" style={{ color: patientTheme.colors.textPrimary }}>
                Heart Rate
              </p>
            </div>
            <StatusBadge status={hrInRange ? "inrange" : "high"} variant="pill" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <FluidText
              value={String(heartRate)}
              style={{
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: patientTheme.colors.textPrimary,
                fontVariantNumeric: "tabular-nums",
              }}
            />
            <span className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>
              BPM
            </span>
          </div>
          <p className="text-[12px] mt-1.5 font-medium" style={{ color: patientTheme.colors.textSecondary }}>
            Normal range: {BANDS.heartRate[0]} – {BANDS.heartRate[1]}
          </p>
          <div className="mt-1 -mx-1 flex items-stretch gap-1">
            <div className="flex flex-col justify-between flex-shrink-0" style={{ width: HERO_AXIS_W, paddingTop: 6, paddingBottom: 6 }}>
              <span className="text-[10px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
                {heroDomain[1]}
              </span>
              <span className="text-[10px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
                {heroDomain[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <HeroSpark data={heroSeries} domain={heroDomain} />
            </div>
          </div>
          {heroPoints.length > 1 && (
            <div className="flex justify-between mt-0.5" style={{ marginLeft: HERO_AXIS_W + 4 }}>
              <span className="text-[10px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
                {clockTime(new Date(heroPoints[0].at).toISOString())}
              </span>
              <span className="text-[10px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
                {clockTime(new Date(heroPoints[heroPoints.length - 1].at).toISOString())}
              </span>
            </div>
          )}
        </motion.button>
      )}

      {/* Blood pressure and oxygen — a pair */}
      <div className="grid grid-cols-2 gap-3">
        {bpSys !== null && (
          <MetricCard
            label="Blood Pressure"
            value={`${bpSys}/${bpDia ?? "—"}`}
            unit="mmHg"
            status={bpSys > 140 || (bpDia ?? 0) > 90 ? "high" : bpSys > 125 ? "attention" : "normal"}
            metric="bloodPressure"
            icon={<DropletIcon size={19} />}
            onClick={() => navigate("/patient/vitals/bloodPressure")}
          />
        )}
        {spo2 !== null && (
          <MetricCard
            label="Blood Oxygen"
            value={String(spo2)}
            unit="%"
            status={spo2 < 95 ? "low" : "normal"}
            metric="spo2"
            icon={<OxygenIcon size={19} />}
            onClick={() => navigate("/patient/vitals/spo2")}
          />
        )}
      </div>

      {/* Your Health Agent — what the agent noticed, and the two ways to reply */}
      <section
        className="mh-card"
        style={{ padding: 16, background: patientTheme.gradients.mint }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="mh-icon-green flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38 }}>
              <BrandMark size={17} />
            </span>
            <p className="text-[15px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
              Your Health Agent
            </p>
          </div>
          <button
            aria-label="Read this aloud"
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              color: patientTheme.colors.primaryDark,
              background: "linear-gradient(180deg, #EAF8EF 0%, #DDF2E6 100%)",
              border: "1px solid rgba(196, 224, 233, 0.8)",
            }}
          >
            <SpeakerIcon size={16} />
          </button>
        </div>

        <p className="text-[13px] leading-relaxed mt-3" style={{ color: patientTheme.colors.textPrimary }}>
          {topInsight?.message
            ? `${topInsight.message.split(/(?<=\.)\s/).slice(0, 2).join(" ")}`
            : "Your vitals look steady today. I'll keep watching your trends and let you know if anything changes."}
        </p>

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => navigate("/patient/insights")}
            className="mh-btn-primary flex-1 py-2.5 text-[13px] font-semibold flex items-center justify-center gap-1.5"
          >
            <TrendIcon size={16} />
            View trend
          </button>
          <button
            onClick={() => navigate("/patient/ai")}
            className="mh-btn-secondary flex-1 py-2.5 text-[13px] font-semibold"
          >
            Ask me
          </button>
        </div>
      </section>

      {/* Today's timeline */}
      {timeline.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
              Today's Timeline
            </h2>
            <button
              onClick={() => navigate("/patient/vitals")}
              className="text-[13px] font-semibold"
              style={{ color: patientTheme.colors.primaryDark }}
            >
              View all
            </button>
          </div>
          <div className="mh-card overflow-hidden">
            {timeline.map((e, i) => (
              <div
                key={`${e.at}-${i}`}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${patientTheme.colors.hairlineSoft}` }}
              >
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background:
                      e.kind === "appointment"
                        ? patientTheme.gradients.tile
                        : e.kind === "agent"
                          ? patientTheme.gradients.tileAmber
                          : patientTheme.gradients.tileRose,
                    color: e.tone,
                  }}
                >
                  {e.kind === "appointment" ? (
                    <CalendarIcon size={19} />
                  ) : e.kind === "agent" ? (
                    <SparkIcon size={19} />
                  ) : (
                    <HeartIcon size={19} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                    {e.label}
                  </p>
                  <p className="text-[12px] truncate" style={{ color: patientTheme.colors.textSecondary }}>
                    {e.value}
                  </p>
                </div>
                <span className="text-[11.5px] flex-shrink-0" style={{ color: patientTheme.colors.textMuted }}>
                  {clockTime(e.at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Whatever is booked next, so it is never a surprise */}
      {nextAppt && (
        <section>
          <h2 className="text-[16px] font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
            Next Appointment
          </h2>
          <button
            onClick={() => navigate("/patient/care/appointments")}
            className="mh-card w-full text-left p-4 flex items-center gap-3"
          >
            <span className="mh-icon w-10 h-10" style={{ color: patientTheme.colors.primaryDark, background: patientTheme.gradients.tile }}>
              <CalendarIcon size={19} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                {nextAppt.doctor?.user
                  ? `Dr. ${nextAppt.doctor.user.firstName} ${nextAppt.doctor.user.lastName}`
                  : nextAppt.department || "General Practice"}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
                {new Date(nextAppt.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                {nextAppt.scheduledTime ? ` • ${nextAppt.scheduledTime.slice(0, 5)}` : ""}
              </p>
            </div>
            <StatusBadge status={nextAppt.status} />
          </button>
        </section>
      )}
    </motion.div>
  );
}
