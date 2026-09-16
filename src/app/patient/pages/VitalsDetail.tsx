import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft, MoreVertical, Heart, Activity, Wind, Thermometer, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import { usePatientData } from "../../hooks/usePatientData";
import { useAuth } from "../../hooks/useAuth";
import { useWearable } from "../hooks/useWearable";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme, metricTint } from "../theme";
import { SegmentedTabs } from "../components/SegmentedTabs";

/**
 * Per-metric definition: label, unit, the healthy band, and the value reader.
 * `baseline` drives both the "In range" judgement and the shaded chart band.
 */
const METRICS: Record<string, {
  label: string;
  unit: string;
  icon: React.ReactNode;
  baseline: [number, number];
  read: (v: any) => number | null;
  prev: (v: any) => number | null;
}> = {
  heartRate: {
    label: "Heart Rate",
    unit: "BPM",
    icon: <Heart size={20} />,
    baseline: [64, 78],
    read: (v) => v?.heartRate ?? null,
    prev: (v) => v?.heartRate ?? null,
  },
  bloodPressure: {
    label: "Blood Pressure",
    unit: "mmHg",
    icon: <Activity size={20} />,
    baseline: [90, 120],
    read: (v) => v?.bloodPressureSystolic ?? v?.systolic ?? null,
    prev: (v) => v?.bloodPressureSystolic ?? v?.systolic ?? null,
  },
  spo2: {
    label: "Blood Oxygen",
    unit: "%",
    icon: <Wind size={20} />,
    baseline: [95, 100],
    read: (v) => v?.spo2 ?? null,
    prev: (v) => v?.spo2 ?? null,
  },
  temperature: {
    label: "Temperature",
    unit: "°C",
    icon: <Thermometer size={20} />,
    baseline: [36.1, 37.2],
    read: (v) => v?.temperature ?? null,
    prev: (v) => v?.temperature ?? null,
  },
};

const RANGES = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "3 Months" },
];

const POINTS: Record<string, number> = { day: 12, week: 20, month: 40, quarter: 60 };
const PERIOD_LABEL: Record<string, string> = {
  day: "Compared to earlier today",
  week: "Compared to last week",
  month: "Compared to last month",
  quarter: "Compared to last quarter",
};

function formatAxis(iso: string, range: string) {
  const d = new Date(iso);
  if (range === "day") return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function VitalsDetail() {
  const { metric = "heartRate" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vitals: existingVitals, loading, error, refresh } = usePatientData();
  const { latest: wearableLatest } = useWearable(user?.profile?.id, true);
  const [range, setRange] = useState<"day" | "week" | "month" | "quarter">("day");

  const def = METRICS[metric] ?? METRICS.heartRate;

  const vitals = useMemo(() => {
    const list = [...existingVitals];
    if (wearableLatest) {
      list.unshift({
        id: "wearable-latest",
        heartRate: wearableLatest.heartRate,
        spo2: wearableLatest.spo2,
        temperature: wearableLatest.temperature,
        bloodPressureSystolic: wearableLatest.systolic,
        bloodPressureDiastolic: wearableLatest.diastolic,
        recordedAt: wearableLatest.timestamp,
      } as any);
    }
    return list;
  }, [existingVitals, wearableLatest]);

  const series = useMemo(
    () =>
      vitals
        .slice(0, POINTS[range])
        .reverse()
        .map((v: any) => ({ label: formatAxis(v.recordedAt, range), value: def.read(v) }))
        .filter((p) => p.value != null),
    [vitals, range, def]
  );

  const current = def.read(vitals[0]);
  const previous = def.prev(vitals[1]);
  const delta = current != null && previous != null ? Math.round((current - previous) * 10) / 10 : null;

  const inRange = current != null && current >= def.baseline[0] && current <= def.baseline[1];
  const tint = metricTint(metric);

  // Widest excursion across the window, for the "your range" summary.
  const observed = series.map((p) => p.value as number);
  const observedLow = observed.length ? Math.min(...observed) : def.baseline[0];
  const observedHigh = observed.length ? Math.max(...observed) : def.baseline[1];

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const lastAt = vitals[0]?.recordedAt
    ? new Date(vitals[0].recordedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/patient/vitals")}
          aria-label="Back to vitals"
          className="mh-btn-icon w-9 h-9 flex items-center justify-center"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-[17px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
          {def.label}
        </h1>
        <button aria-label="More options" className="mh-btn-icon w-9 h-9 flex items-center justify-center">
          <MoreVertical size={16} />
        </button>
      </div>

      <SegmentedTabs options={RANGES} value={range} onChange={setRange} />

      {/* Hero readout */}
      <div className="mh-card-feature mh-card" style={{ padding: 18 }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="mh-icon w-11 h-11" style={{ color: tint.fg, background: tint.tile }}>
              {def.icon}
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    lineHeight: 1.02,
                    letterSpacing: "-0.03em",
                    color: patientTheme.colors.textPrimary,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {current == null ? "—" : current}
                </span>
                <span className="text-[13px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
                  {def.unit}
                </span>
              </div>
              <p className="text-[12.5px] mt-1" style={{ color: patientTheme.colors.textMuted }}>
                Last reading · {lastAt}
              </p>
            </div>
          </div>
          <span className={`mh-pill ${inRange ? "" : "mh-pill-amber"} px-2.5 py-1 text-[11px] font-semibold`}>
            {inRange ? "In range" : "Out of range"}
          </span>
        </div>

        {/* Chart */}
        <div className="h-48 mt-4 -mx-1">
          {series.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mhDetailGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.22} />
                    <stop offset="55%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.06} />
                    <stop offset="100%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0} />
                  </linearGradient>
                  <filter id="mhDetailPointGlow" x="-120%" y="-120%" width="340%" height="340%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid vertical={false} stroke={patientTheme.colors.hairlineSoft} strokeDasharray="3 6" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: patientTheme.colors.textMuted }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={34}
                  dy={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: patientTheme.colors.textMuted }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickCount={4}
                  domain={["dataMin - 4", "dataMax + 4"]}
                  allowDataOverflow
                />
                <Tooltip
                  cursor={{ stroke: "rgba(134,202,158,0.55)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                  contentStyle={{
                    background: "rgba(255,255,255,0.97)",
                    border: "1px solid rgba(226,236,231,0.95)",
                    borderRadius: 14,
                    fontSize: 12,
                    color: patientTheme.colors.textPrimary,
                    boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 24px -8px rgba(16,24,40,0.14)",
                    padding: "8px 12px",
                  }}
                />
                <ReferenceArea
                  y1={def.baseline[0]}
                  y2={def.baseline[1]}
                  fill={patientTheme.colors.primaryGreen}
                  fillOpacity={0.045}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={patientTheme.colors.primaryGreen}
                  strokeWidth={2.25}
                  strokeLinecap="round"
                  fill="url(#mhDetailGradient)"
                  className="mh-chart-line"
                  dot={{ r: 2.2, fill: "#fff", stroke: patientTheme.colors.primaryGreen, strokeWidth: 1.6 }}
                  activeDot={{
                    r: 6,
                    fill: patientTheme.colors.primaryGreen,
                    stroke: "#fff",
                    strokeWidth: 2.5,
                    filter: "url(#mhDetailPointGlow)",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-[13px]" style={{ color: patientTheme.colors.textMuted }}>
                Not enough readings in this range yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Your range */}
      <div className="mh-card p-4">
        <p className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>
          Your Range
        </p>
        <p className="text-[22px] font-bold mt-1" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
          {def.baseline[0]} – {def.baseline[1]} {def.unit}
        </p>
        <p className="text-[12px] mt-1" style={{ color: patientTheme.colors.textMuted }}>
          Observed this period: {Math.round(observedLow * 10) / 10} – {Math.round(observedHigh * 10) / 10} {def.unit}
        </p>
      </div>

      {/* Change since previous reading — hidden when there's no real change */}
      {delta !== null && delta !== 0 && (
        <div className="mh-card flex items-center gap-3 p-4">
          <div className="mh-icon w-11 h-11" style={{ color: tint.fg, background: tint.tile }}>
            <TrendingUp size={19} style={{ transform: delta < 0 ? "scaleY(-1)" : undefined }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
              {delta > 0 ? "+" : ""}{delta} {def.unit}
            </p>
            <p className="text-[12.5px]" style={{ color: patientTheme.colors.textSecondary }}>
              {PERIOD_LABEL[range]}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: patientTheme.colors.textMuted }}>
              {inRange ? "(healthy variation)" : "(outside your usual range)"}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
