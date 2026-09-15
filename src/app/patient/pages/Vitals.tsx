import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Heart, Activity, Wind, Thermometer, ArrowLeft } from "lucide-react";
import { usePatientData } from "../../hooks/usePatientData";
import { useAuth } from "../../hooks/useAuth";
import { useWearable } from "../hooks/useWearable";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme } from "../theme";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { VitalCard } from "../components/VitalCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const tabs = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const MetricIcon: Record<string, React.ReactNode> = {
  heartRate: <Heart size={18} style={{ color: patientTheme.colors.success }} />,
  bloodPressure: <Activity size={18} style={{ color: patientTheme.colors.success }} />,
  spo2: <Wind size={18} style={{ color: patientTheme.colors.success }} />,
  temperature: <Thermometer size={18} style={{ color: patientTheme.colors.success }} />,
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
      return { status: "normal", text: "Within your usual range" };
    case "bloodPressure":
      if (value > 140) return { status: "attention", text: "High" };
      if (value > 125) return { status: "high", text: "Elevated" };
      return { status: "normal", text: "Normal" };
    case "spo2":
      if (value < 95) return { status: "attention", text: "Below 95%" };
      return { status: "normal", text: "Normal" };
    case "temperature":
      if (value > 37.6) return { status: "attention", text: "Fever range" };
      if (value > 37.2) return { status: "high", text: "Slightly elevated" };
      return { status: "normal", text: "Normal" };
    default:
      return { status: "normal", text: "Normal" };
  }
}

export default function Vitals() {
  const navigate = useNavigate();
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
      { key: "heartRate", label: "Heart rate", value: hr, unit: "BPM", baseline: "64–74" },
      { key: "bloodPressure", label: "Blood pressure", value: bpSys, unit: "mmHg", extra: bpDia, baseline: "110–125" },
      { key: "spo2", label: "SpO₂", value: spo2, unit: "%", baseline: "95–100" },
      { key: "temperature", label: "Temperature", value: temp, unit: "°C", baseline: "36.1–37.2" },
    ];
  }, [current]);

  const [selected, setSelected] = useState(metrics[0].key);
  const selectedMetric = metrics.find((m) => m.key === selected) || metrics[0];

  const chartData = useMemo(() => {
    return vitals
      .slice(0, 12)
      .reverse()
      .map((v: any) => {
        const ts = new Date(v.recordedAt);
        return {
          label: selected === "temperature" ? ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          value: selected === "bloodPressure" ? (v.bloodPressureSystolic ?? v.systolic) : v[selected],
          full: v,
        };
      });
  }, [vitals, selected]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const interp = interpretValue(selected, Number(selectedMetric.value));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/patient/home")}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: patientTheme.colors.surface, border: `1px solid ${patientTheme.colors.border}` }}
        >
          <ArrowLeft size={18} style={{ color: patientTheme.colors.textSecondary }} />
        </button>
        <h1 className="text-2xl font-bold" style={{ color: patientTheme.colors.textPrimary }}>Vitals</h1>
      </div>

      {/* Metric selector */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => {
          const isSelected = selected === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setSelected(m.key)}
              className="p-3 text-left rounded-2xl transition-all"
              style={{
                background: isSelected ? patientTheme.colors.primaryPale : patientTheme.colors.surface,
                border: `1px solid ${isSelected ? patientTheme.colors.primaryGreen : patientTheme.colors.border}`,
                boxShadow: isSelected ? patientTheme.shadows.soft : "none",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: patientTheme.colors.surface }}>
                  {MetricIcon[m.key]}
                </div>
                <span className="text-xs font-medium" style={{ color: patientTheme.colors.textMuted }}>{m.label}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: patientTheme.colors.textPrimary }}>
                {m.value === null ? "—" : `${m.value}${m.key === "bloodPressure" ? `/${m.extra}` : ""}`}
                <span className="text-xs font-normal ml-1" style={{ color: patientTheme.colors.textSecondary }}>{m.unit}</span>
              </p>
            </button>
          );
        })}
      </div>

      {/* Detail card */}
      <div
        className="p-5 rounded-3xl"
        style={{
          background: patientTheme.colors.surface,
          border: `1px solid ${patientTheme.colors.border}`,
          boxShadow: patientTheme.shadows.soft,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium" style={{ color: patientTheme.colors.textMuted }}>{selectedMetric.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color: patientTheme.colors.textPrimary }}>
                {selectedMetric.value === null ? "—" : selectedMetric.value}
              </span>
              <span className="text-sm font-medium" style={{ color: patientTheme.colors.textSecondary }}>{selectedMetric.unit}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={interp.status} />
              <span className="text-xs" style={{ color: patientTheme.colors.textMuted }}>{interp.text}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: patientTheme.colors.primaryPale }}>
            {MetricIcon[selected]}
          </div>
        </div>

        <SegmentedTabs options={tabs} value={tab} onChange={setTab} />

        <div className="h-48 mt-4 -mx-2">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mhVitalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={patientTheme.colors.primaryGreen} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: patientTheme.colors.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: patientTheme.colors.textMuted }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: patientTheme.colors.surface,
                    border: `1px solid ${patientTheme.colors.border}`,
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <ReferenceLine
                  y={Number(selectedMetric.baseline.split("–")[0])}
                  stroke={patientTheme.colors.textMuted}
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={patientTheme.colors.primaryGreen}
                  strokeWidth={2.5}
                  fill="url(#mhVitalGradient)"
                  activeDot={{ r: 5, strokeWidth: 0, fill: patientTheme.colors.primaryGreen }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm" style={{ color: patientTheme.colors.textMuted }}>Not enough data for a {tab} chart yet.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="p-3 rounded-2xl" style={{ background: "rgba(16,24,40,0.03)" }}>
            <p className="text-xs" style={{ color: patientTheme.colors.textMuted }}>Average</p>
            <p className="text-lg font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
              {selectedMetric.value ?? "—"} {selectedMetric.unit}
            </p>
          </div>
          <div className="p-3 rounded-2xl" style={{ background: "rgba(16,24,40,0.03)" }}>
            <p className="text-xs" style={{ color: patientTheme.colors.textMuted }}>Baseline</p>
            <p className="text-lg font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
              {selectedMetric.baseline} {selectedMetric.unit}
            </p>
          </div>
        </div>

        {current && (
          <p className="text-xs mt-4 text-center" style={{ color: patientTheme.colors.textMuted }}>
            Last reading {formatTime(current.recordedAt)}
          </p>
        )}
      </div>

      {/* Recent readings list */}
      <div className="space-y-3">
        <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textSecondary }}>Recent readings</p>
        {vitals.slice(0, 5).map((v: any) => (
          <div
            key={v.id}
            className="flex items-center justify-between p-3 rounded-2xl"
            style={{ background: patientTheme.colors.surface, border: `1px solid ${patientTheme.colors.border}` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: patientTheme.colors.primaryPale }}>
                {MetricIcon[selected]}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: patientTheme.colors.textPrimary }}>
                  {selected === "bloodPressure"
                    ? `${v.bloodPressureSystolic ?? v.systolic}/${v.bloodPressureDiastolic ?? v.diastolic} ${selectedMetric.unit}`
                    : `${v[selected]} ${selectedMetric.unit}`}
                </p>
                <p className="text-xs" style={{ color: patientTheme.colors.textMuted }}>{formatTime(v.recordedAt)}</p>
              </div>
            </div>
            <StatusBadge status={interpretValue(selected, Number(selected === "bloodPressure" ? v.bloodPressureSystolic ?? v.systolic : v[selected])).status} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
