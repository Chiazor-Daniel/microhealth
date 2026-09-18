import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import {
  HeartIcon, DropletIcon, OxygenIcon, ThermometerIcon,
  ChevronLeftIcon, MoreIcon, ArrowUpIcon, ArrowDownIcon, MinusIcon,
} from "../icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { usePatientData } from "../../hooks/usePatientData";
import { useAuth } from "../../hooks/useAuth";
import { useWearable } from "../hooks/useWearable";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme, metricTint } from "../theme";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { buildSeries, axisLabel, distinctTicks } from "../lib/timeSeries";

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
}> = {
  heartRate: {
    label: "Heart Rate",
    unit: "BPM",
    icon: <HeartIcon size={21} />,
    baseline: [64, 78],
    read: (v) => v?.heartRate ?? null,
  },
  bloodPressure: {
    label: "Blood Pressure",
    unit: "mmHg",
    icon: <DropletIcon size={21} />,
    baseline: [90, 120],
    read: (v) => v?.bloodPressureSystolic ?? v?.systolic ?? null,
  },
  spo2: {
    label: "Blood Oxygen",
    unit: "%",
    icon: <OxygenIcon size={21} />,
    baseline: [95, 100],
    read: (v) => v?.spo2 ?? null,
  },
  temperature: {
    label: "Temperature",
    unit: "°C",
    icon: <ThermometerIcon size={21} />,
    baseline: [36.1, 37.2],
    read: (v) => v?.temperature ?? null,
  },
};

const RANGES = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "3 Months" },
];

const PERIOD_LABEL: Record<string, string> = {
  day: "Compared to earlier today",
  week: "Compared to last week",
  month: "Compared to last month",
  quarter: "Compared to last quarter",
};

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
      buildSeries(vitals, range, def.read).map((p) => ({
        label: axisLabel(p.at, range),
        value: p.value,
      })),
    [vitals, range, def]
  );

  /* Distinct tick labels — a minute can hold several readings, and forcing a
     tick at each of them prints the same time more than once. */
  const xTicks = useMemo(() => distinctTicks(series.map((p) => p.label)), [series]);

  const current = def.read(vitals[0]);
  /* Movement across the window, not against the reading 3 seconds ago. */
  const windowStart = series.length > 1 ? series[0].value : null;
  const delta = current != null && windowStart != null ? Math.round((current - windowStart) * 10) / 10 : null;

  const inRange = current != null && current >= def.baseline[0] && current <= def.baseline[1];
  const tint = metricTint(metric);

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
      {/* Header — bare controls, the title is the axis of the screen */}
      <div className="relative flex items-center justify-center h-9">
        <button
          onClick={() => navigate("/patient/vitals")}
          aria-label="Back to vitals"
          className="absolute left-0 flex items-center justify-center w-9 h-9 -ml-2"
          style={{ color: patientTheme.colors.textPrimary }}
        >
          <ChevronLeftIcon size={22} />
        </button>
        <h1 className="text-[17px] font-semibold" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
          {def.label}
        </h1>
        <button
          aria-label="More options"
          className="absolute right-0 flex items-center justify-center w-9 h-9 -mr-1"
          style={{ color: patientTheme.colors.textSecondary }}
        >
          <MoreIcon size={18} />
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
                  ticks={xTicks}
                  tick={{ fontSize: 10, fill: patientTheme.colors.textMuted }}
                  axisLine={false}
                  tickLine={false}
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
                  cursor={{ stroke: "rgba(133,192,206,0.55)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
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

      {/* Your Range — the band the reading should sit in, and how the latest
          reading moved against the previous one. */}
      <div className="mh-card p-4">
        <p className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>
          Your Range
        </p>
        <p className="text-[24px] font-bold mt-1" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
          {def.baseline[0]} – {def.baseline[1]} {def.unit}
        </p>

        <div className="flex items-center gap-3.5 mt-4">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              color: delta != null && delta < 0 ? "#B45309" : patientTheme.colors.primaryDark,
              background:
                delta != null && delta < 0
                  ? "linear-gradient(160deg, #FFFBF0 0%, #FEF3C7 100%)"
                  : "linear-gradient(160deg, #F0FBF4 0%, #DCF2E5 100%)",
              border: `1px solid ${delta != null && delta < 0 ? "rgba(250, 227, 160, 0.9)" : "rgba(196, 224, 233, 0.9)"}`,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 2px rgba(16,24,40,0.05), 0 6px 14px -5px rgba(8,84,108,0.18)",
            }}
          >
            {delta == null || delta === 0 ? (
              <MinusIcon size={26} />
            ) : delta > 0 ? (
              <ArrowUpIcon size={26} />
            ) : (
              <ArrowDownIcon size={26} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-semibold"
              style={{ color: delta != null && delta < 0 ? "#B45309" : patientTheme.colors.primaryDark }}
            >
              {delta == null || delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta} ${def.unit}`}
            </p>
            <p className="text-[12.5px]" style={{ color: patientTheme.colors.textSecondary }}>
              {PERIOD_LABEL[range]}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: patientTheme.colors.textMuted }}>
              {inRange ? "(healthy variation)" : "(outside your usual range)"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
