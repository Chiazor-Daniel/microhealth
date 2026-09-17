import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { HeartIcon, DropletIcon, OxygenIcon, ThermometerIcon, WatchIcon, ChevronRightIcon } from "../icons";
import { usePatientData } from "../../hooks/usePatientData";
import { useAuth } from "../../hooks/useAuth";
import { useWearable } from "../hooks/useWearable";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme, metricTint } from "../theme";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { StatusBadge } from "../components/StatusBadge";
import { buildSeries } from "../lib/timeSeries";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

const tabs = [
  { value: "today", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "3 Months" },
] as const;

type TabValue = (typeof tabs)[number]["value"];

const MetricIcon: Record<string, React.ReactNode> = {
  heartRate: <HeartIcon size={20} />,
  bloodPressure: <DropletIcon size={20} />,
  spo2: <OxygenIcon size={20} />,
  temperature: <ThermometerIcon size={20} />,
};

/** The healthy band for each metric, and how it is written out. */
const RANGES: Record<string, { lo: number; hi: number; label: string }> = {
  heartRate: { lo: 60, hi: 100, label: "60 – 100 bpm" },
  bloodPressure: { lo: 90, hi: 120, label: "90/60 – 120/80 mmHg" },
  spo2: { lo: 95, hi: 100, label: "95 – 100 %" },
  temperature: { lo: 36.1, hi: 37.2, label: "36.1 – 37.2 °C" },
};

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function interpretValue(metric: string, value: number) {
  switch (metric) {
    case "heartRate":
      if (value < 55) return { status: "low", text: "Low" };
      if (value > 100) return { status: "high", text: "High" };
      if (value > 85) return { status: "attention", text: "Elevated" };
      return { status: "normal", text: "Normal" };
    case "bloodPressure":
      if (value > 140) return { status: "high", text: "High" };
      if (value > 125) return { status: "attention", text: "Elevated" };
      return { status: "normal", text: "Normal" };
    case "spo2":
      if (value < 95) return { status: "low", text: "Low" };
      return { status: "normal", text: "Normal" };
    case "temperature":
      if (value > 37.6) return { status: "high", text: "Fever" };
      if (value > 37.2) return { status: "attention", text: "Elevated" };
      return { status: "normal", text: "Normal" };
    default:
      return { status: "normal", text: "Normal" };
  }
}

/**
 * The reading's own sparkline — a single luminous line with a whisper of fill.
 * Every card carries one, which is what makes the screen scannable at a glance.
 */
function Spark({ data, height = 46 }: { data: number[]; height?: number }) {
  if (data.length < 2) return <div style={{ height }} />;
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 6, right: 2, left: 2, bottom: 0 }}>
        <defs>
          <linearGradient id="mhSparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.28} />
            <stop offset="60%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.08} />
            <stop offset="100%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={false}
          contentStyle={{
            background: "rgba(255,255,255,0.97)",
            border: "1px solid rgba(226,236,231,0.95)",
            borderRadius: 12,
            fontSize: 11,
            padding: "5px 9px",
            boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 8px 20px -8px rgba(16,24,40,0.16)",
          }}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={patientTheme.colors.primaryGreen}
          strokeWidth={2}
          strokeLinecap="round"
          fill="url(#mhSparkGradient)"
          dot={{ r: 1.8, fill: patientTheme.colors.primaryGreen, stroke: "#fff", strokeWidth: 1 }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
          className="mh-chart-line"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Vitals() {
  const { user } = useAuth();
  const { vitals: existingVitals, loading, error, refresh } = usePatientData();
  const { latest: wearableLatest } = useWearable(user?.profile?.id, true);
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabValue>("today");

  const vitals = useMemo(() => {
    const list = [...existingVitals];
    if (wearableLatest) {
      list.unshift({
        id: "wearable-latest",
        patientId: wearableLatest.patientId,
        heartRate: wearableLatest.heartRate,
        spo2: wearableLatest.spo2,
        temperature: wearableLatest.temperature,
        bloodPressureSystolic: wearableLatest.systolic,
        bloodPressureDiastolic: wearableLatest.diastolic,
        recordedAt: wearableLatest.timestamp,
      });
    }
    return list;
  }, [existingVitals, wearableLatest]);

  const current: any = vitals[0];

  const metrics = useMemo(() => {
    const bpSys = current?.bloodPressureSystolic ?? current?.systolic ?? null;
    const bpDia = current?.bloodPressureDiastolic ?? current?.diastolic ?? null;
    return [
      {
        key: "heartRate",
        label: "Heart Rate",
        display: current?.heartRate ?? null,
        unit: "bpm",
        reading: current?.heartRate,
      },
      {
        key: "bloodPressure",
        label: "Blood Pressure",
        display: bpSys == null ? null : bpDia == null ? bpSys : `${bpSys}/${bpDia}`,
        unit: "mmHg",
        reading: bpSys,
      },
      { key: "spo2", label: "Blood Oxygen", display: current?.spo2 ?? null, unit: "%", reading: current?.spo2 },
      {
        key: "temperature",
        label: "Temperature",
        display: current?.temperature ?? null,
        unit: "°C",
        reading: current?.temperature,
      },
    ];
  }, [current]);

  const sparkFor = (key: string) =>
    buildSeries(vitals, tab, (v) =>
      key === "bloodPressure" ? (v.bloodPressureSystolic ?? v.systolic) : v[key]
    ).map((p) => p.value);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header — the title is the axis of the screen, so it centres */}
      <div className="relative flex items-center justify-center">
        <h1
          className="text-[22px] font-semibold"
          style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}
        >
          Vitals
        </h1>
        <span
          className="absolute right-0 flex items-center justify-center w-10 h-10"
          style={{ color: patientTheme.colors.textSecondary }}
          title="MicroHealth Band"
        >
          <WatchIcon size={20} />
        </span>
      </div>

      <SegmentedTabs options={tabs as unknown as { value: TabValue; label: string }[]} value={tab} onChange={setTab} />

      {/* Every metric gets its own full-width card and its own sparkline, so
          the screen can be read top to bottom without picking one first. */}
      <div className="space-y-3">
        {metrics.map((m) => {
          const interp = interpretValue(m.key, Number(m.reading));
          const tint = metricTint(m.key);
          const range = RANGES[m.key];
          const series = sparkFor(m.key);

          return (
            <motion.button
              key={m.key}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(`/patient/vitals/${m.key}`)}
              className="mh-card w-full text-left block"
              style={{ padding: 16 }}
              aria-label={`${m.label}, ${m.display ?? "no reading"} ${m.unit}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="mh-icon w-11 h-11" style={{ color: tint.fg, background: tint.tile }}>
                    {MetricIcon[m.key]}
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: patientTheme.colors.textPrimary }}>
                    {m.label}
                  </p>
                </div>
                {/* On this screen every metric states its status as a capsule —
                    there is room for it, and the cards are compared side by
                    side. Home's compact pair states it as plain text instead. */}
                <StatusBadge status={m.key === "heartRate" ? "inrange" : interp.status} variant="pill" />
              </div>

              <div className="flex items-baseline gap-1.5 mt-3">
                <span
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    lineHeight: 1.02,
                    letterSpacing: "-0.035em",
                    color: patientTheme.colors.textPrimary,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {m.display === null ? "—" : m.display}
                </span>
                <span className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>
                  {m.unit}
                </span>
              </div>

              <p className="text-[12px] mt-1 font-medium" style={{ color: patientTheme.colors.textMuted }}>
                Normal range: {range.label}
              </p>

              {/* The card opens a detail screen, so it says so — the chevron
                  gets its own column rather than sitting on the last point. */}
              <div className="mt-2 flex items-center gap-1">
                <div className="flex-1 min-w-0">
                  <Spark data={series} />
                </div>
                <span style={{ color: patientTheme.colors.textMuted }} aria-hidden>
                  <ChevronRightIcon size={17} />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
