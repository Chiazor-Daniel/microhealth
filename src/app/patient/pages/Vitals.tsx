import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Heart, Activity, Wind, Thermometer, Plus } from "lucide-react";
import { usePatientData } from "../../hooks/usePatientData";
import { useAuth } from "../../hooks/useAuth";
import { useWearable } from "../hooks/useWearable";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme } from "../theme";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { StatusBadge } from "../components/StatusBadge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

const tabs = [
  { value: "today", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const MetricIcon: Record<string, React.ReactNode> = {
  heartRate: <Heart size={18} />,
  bloodPressure: <Activity size={18} />,
  spo2: <Wind size={18} />,
  temperature: <Thermometer size={18} />,
};

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function interpretValue(metric: string, value: number) {
  switch (metric) {
    case "heartRate":
      if (value < 55) return { status: "attention", text: "Lower than usual" };
      if (value > 100) return { status: "attention", text: "Higher than usual" };
      if (value > 85) return { status: "high", text: "Slightly elevated" };
      return { status: "normal", text: "Normal range" };
    case "bloodPressure":
      if (value > 140) return { status: "attention", text: "High" };
      if (value > 125) return { status: "high", text: "Elevated" };
      return { status: "normal", text: "Normal range" };
    case "spo2":
      if (value < 95) return { status: "attention", text: "Below 95%" };
      return { status: "normal", text: "Normal range" };
    case "temperature":
      if (value > 37.6) return { status: "attention", text: "Fever range" };
      if (value > 37.2) return { status: "high", text: "Slightly elevated" };
      return { status: "normal", text: "Normal range" };
    default:
      return { status: "normal", text: "Normal range" };
  }
}

/** Sparkline for compact vital cards — single green line, no axes. */
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mhSparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.18} />
            <stop offset="100%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={patientTheme.colors.primaryGreen}
          strokeWidth={2}
          fill="url(#mhSparkGradient)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Vitals() {
  const { user } = useAuth();
  const { vitals: existingVitals, loading, error, refresh } = usePatientData();
  const { latest: wearableLatest } = useWearable(user?.profile?.id, true);
  const [tab, setTab] = useState<"today" | "week" | "month">("today");

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

  const current = vitals[0];

  const metrics = useMemo(() => {
    const hr = current?.heartRate ?? null;
    const bpSys = current?.bloodPressureSystolic ?? current?.systolic ?? null;
    const bpDia = current?.bloodPressureDiastolic ?? current?.diastolic ?? null;
    const spo2 = current?.spo2 ?? null;
    const temp = current?.temperature ?? null;
    return [
      { key: "heartRate", label: "Heart Rate", value: hr, unit: "bpm", baseline: [64, 74] as [number, number] },
      { key: "bloodPressure", label: "Blood Pressure", value: bpSys, unit: "mmHg", baseline: [110, 125] as [number, number] },
      { key: "spo2", label: "Blood Oxygen", value: spo2, unit: "%", baseline: [95, 100] as [number, number] },
      { key: "temperature", label: "Temperature", value: temp, unit: "°C", baseline: [36.1, 37.2] as [number, number] },
    ];
  }, [current]);

  const [selected, setSelected] = useState("heartRate");
  const selectedMetric = metrics.find((m) => m.key === selected) || metrics[0];

  const readingCount = tab === "today" ? 10 : tab === "week" ? 20 : 40;

  const chartData = useMemo(() => {
    return vitals
      .slice(0, readingCount)
      .reverse()
      .map((v: any) => ({
        label: formatTime(v.recordedAt),
        value: selected === "bloodPressure" ? (v.bloodPressureSystolic ?? v.systolic) : v[selected],
      }));
  }, [vitals, selected, readingCount]);

  const sparkData = (key: string) =>
    vitals.slice(0, 10).reverse().map((v: any) => (key === "bloodPressure" ? (v.bloodPressureSystolic ?? v.systolic) : v[key]));

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const interp = interpretValue(selected, Number(selectedMetric.value));
  const prevValue = selected === "bloodPressure"
    ? (vitals[1]?.bloodPressureSystolic ?? vitals[1]?.systolic ?? null)
    : vitals[1]?.[selected] ?? null;
  const delta =
    selectedMetric.value != null && prevValue != null && selectedMetric.value !== prevValue
      ? `${selectedMetric.value > prevValue ? "+" : ""}${Math.round((selectedMetric.value - prevValue) * 10) / 10} ${selectedMetric.unit} · recently`
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>Vitals</h1>
        <button
          aria-label="Add reading"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: patientTheme.colors.surface,
            border: `1px solid ${patientTheme.colors.border}`,
            color: patientTheme.colors.textSecondary,
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Range tabs */}
      <SegmentedTabs options={tabs} value={tab} onChange={setTab} />

      {/* Hero chart card */}
      <div
        style={{
          background: patientTheme.colors.surface,
          borderRadius: patientTheme.radius.card,
          border: `1px solid ${patientTheme.colors.border}`,
          boxShadow: patientTheme.shadows.soft,
          padding: 18,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: patientTheme.colors.primaryPale, color: patientTheme.colors.primaryGreen }}
            >
              {MetricIcon[selected]}
            </div>
            <div>
              <p className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>
                {selectedMetric.label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[32px] font-bold tracking-tight leading-none" style={{ color: patientTheme.colors.textPrimary }}>
                  {selectedMetric.value === null ? "—" : selectedMetric.value}
                </span>
                <span className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>
                  {selectedMetric.unit}
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status={interp.status} />
        </div>

        {delta && (
          <span
            className="inline-flex items-center mt-2.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: patientTheme.colors.successSoft, color: patientTheme.colors.success }}
          >
            {delta}
          </span>
        )}

        <div className="h-44 mt-4 -mx-1">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="mhVitalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: patientTheme.colors.textMuted }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: patientTheme.colors.textMuted }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  domain={["dataMin - 4", "dataMax + 4"]}
                />
                <Tooltip
                  cursor={{ stroke: patientTheme.colors.border, strokeWidth: 1 }}
                  contentStyle={{
                    background: patientTheme.colors.surface,
                    border: `1px solid ${patientTheme.colors.border}`,
                    borderRadius: 10,
                    fontSize: 12,
                    color: patientTheme.colors.textPrimary,
                    boxShadow: patientTheme.shadows.soft,
                  }}
                />
                {/* "Your Range" band */}
                <ReferenceArea
                  y1={selectedMetric.baseline[0]}
                  y2={selectedMetric.baseline[1]}
                  fill={patientTheme.colors.primaryGreen}
                  fillOpacity={0.05}
                  ifOverflow="extendDomain"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={patientTheme.colors.primaryGreen}
                  strokeWidth={2}
                  fill="url(#mhVitalGradient)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: patientTheme.colors.primaryGreen }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-[13px]" style={{ color: patientTheme.colors.textMuted }}>
                Not enough data for this range yet.
              </p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-center mt-2" style={{ color: patientTheme.colors.textMuted }}>
          Shaded band · your range {selectedMetric.baseline[0]}–{selectedMetric.baseline[1]} {selectedMetric.unit}
        </p>
      </div>

      {/* Other vitals with sparklines */}
      <div className="grid grid-cols-2 gap-3">
        {metrics
          .filter((m) => m.key !== selected)
          .map((m) => {
            const mInterp = interpretValue(m.key, Number(m.value));
            return (
              <button
                key={m.key}
                onClick={() => setSelected(m.key)}
                className="text-left p-4"
                style={{
                  background: patientTheme.colors.surface,
                  borderRadius: patientTheme.radius.card,
                  border: `1px solid ${patientTheme.colors.border}`,
                  boxShadow: patientTheme.shadows.soft,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>{m.label}</p>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: patientTheme.colors.primaryPale, color: patientTheme.colors.primaryGreen }}
                  >
                    {MetricIcon[m.key]}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold" style={{ color: patientTheme.colors.textPrimary }}>
                    {m.value === null ? "—" : m.value}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>{m.unit}</span>
                </div>
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: mInterp.status === "normal" ? patientTheme.colors.success : patientTheme.colors.warning }}>
                  {mInterp.text}
                </p>
                <div className="mt-2 -mb-1">
                  <Sparkline data={sparkData(m.key).filter((v) => v != null)} />
                </div>
              </button>
            );
          })}
      </div>
    </motion.div>
  );
}
