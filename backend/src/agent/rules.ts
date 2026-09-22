import { type VitalRow } from "./types";

// Generic clinical ranges used only when a patient baseline is unavailable.
export const DEFAULT_RANGES = {  heartRate: { min: 60, max: 100, unit: "bpm" },
  systolic: { min: 90, max: 120, unit: "mmHg" },
  diastolic: { min: 60, max: 80, unit: "mmHg" },
  spo2: { min: 95, max: 100, unit: "%" },
  temperature: { min: 36.1, max: 37.2, unit: "°C" },
};

export interface RangeCheck {
  metric: keyof typeof DEFAULT_RANGES;
  value: number;
  status: "normal" | "low" | "high" | "attention";
}

export function checkVitalRanges(vital: VitalRow): RangeCheck[] {
  const out: RangeCheck[] = [];
  if (vital.heartRate != null) {
    out.push({ metric: "heartRate", value: vital.heartRate, status: classify("heartRate", vital.heartRate) });
  }
  if (vital.bloodPressureSystolic != null) {
    out.push({ metric: "systolic", value: vital.bloodPressureSystolic, status: classify("systolic", vital.bloodPressureSystolic) });
  }
  if (vital.bloodPressureDiastolic != null) {
    out.push({ metric: "diastolic", value: vital.bloodPressureDiastolic, status: classify("diastolic", vital.bloodPressureDiastolic) });
  }
  if (vital.spo2 != null) {
    out.push({ metric: "spo2", value: vital.spo2, status: classify("spo2", vital.spo2) });
  }
  if (vital.temperature != null) {
    out.push({ metric: "temperature", value: vital.temperature, status: classify("temperature", vital.temperature) });
  }
  return out;
}

function classify(metric: keyof typeof DEFAULT_RANGES, value: number): "normal" | "low" | "high" | "attention" {
  const { min, max } = DEFAULT_RANGES[metric];
  if (metric === "spo2") {
    if (value < 90) return "attention";
    if (value < min) return "low";
    return "normal";
  }
  if (value < min) {
    const criticalLow = metric === "heartRate" ? 50 : metric === "systolic" ? 85 : metric === "diastolic" ? 50 : metric === "temperature" ? 35.5 : min * 0.9;
    return value < criticalLow ? "attention" : "low";
  }
  if (value > max) {
    const criticalHigh = metric === "heartRate" ? 120 : metric === "systolic" ? 160 : metric === "diastolic" ? 100 : metric === "temperature" ? 38.5 : max * 1.1;
    return value > criticalHigh ? "attention" : "high";
  }
  return "normal";
}

export function detectTrend(vitals: VitalRow[], metric: "heartRate" | "systolic" | "diastolic" | "spo2" | "temperature"): {
  direction: "stable" | "rising" | "falling";
  change: number;
  recent: number;
  prior: number;
} {
  const values = vitals
    .map((v) => ({
      value:
        metric === "heartRate"
          ? v.heartRate
          : metric === "systolic"
          ? v.bloodPressureSystolic
          : metric === "diastolic"
          ? v.bloodPressureDiastolic
          : metric === "spo2"
          ? v.spo2
          : v.temperature,
      at: v.recordedAt ? new Date(v.recordedAt).getTime() : 0,
    }))
    .filter((v) => v.value != null)
    .sort((a, b) => a.at - b.at);

  if (values.length < 4) {
    const latest = values[values.length - 1]?.value ?? 0;
    return { direction: "stable", change: 0, recent: latest, prior: latest };
  }

  const half = Math.max(2, Math.floor(values.length / 2));
  const prior = average(values.slice(0, half).map((v) => v.value as number));
  const recent = average(values.slice(-half).map((v) => v.value as number));
  const change = Number((recent - prior).toFixed(1));

  let direction: "stable" | "rising" | "falling" = "stable";
  if (change > 3) direction = "rising";
  else if (change < -3) direction = "falling";

  return { direction, change, recent, prior };
}

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function computeBaseline(vitals: VitalRow[]): { heartRate: { min: number; max: number }; systolic: { min: number; max: number }; diastolic: { min: number; max: number }; spo2: { min: number; max: number }; temperature: { min: number; max: number } } {
  const pick = (fn: (v: VitalRow) => number | null | undefined) =>
    vitals.map(fn).filter((v): v is number => v != null);

  const hr = pick((v) => v.heartRate);
  const sys = pick((v) => v.bloodPressureSystolic);
  const dia = pick((v) => v.bloodPressureDiastolic);
  const spo2 = pick((v) => v.spo2);
  const temp = pick((v) => v.temperature);

  return {
    heartRate: percentileRange(hr, DEFAULT_RANGES.heartRate.min, DEFAULT_RANGES.heartRate.max),
    systolic: percentileRange(sys, DEFAULT_RANGES.systolic.min, DEFAULT_RANGES.systolic.max),
    diastolic: percentileRange(dia, DEFAULT_RANGES.diastolic.min, DEFAULT_RANGES.diastolic.max),
    spo2: percentileRange(spo2, DEFAULT_RANGES.spo2.min, DEFAULT_RANGES.spo2.max),
    temperature: percentileRange(temp, DEFAULT_RANGES.temperature.min, DEFAULT_RANGES.temperature.max),
  };
}

function percentileRange(values: number[], fallbackMin: number, fallbackMax: number) {
  if (values.length < 3) return { min: fallbackMin, max: fallbackMax };
  const sorted = [...values].sort((a, b) => a - b);
  const low = sorted[Math.floor(values.length * 0.1)];
  const high = sorted[Math.floor(values.length * 0.9)];
  return { min: Math.round(low), max: Math.round(high) };
}

/**
 * Care labels (Agentic AI MVP, function 1).
 *
 * The words a patient sees. Low-to-medium health literacy is the audience, so
 * the internal range states map onto four plain labels: Normal, Watch
 * Closely, Needs Attention, Seek Care Now. `urgent` priority always wins —
 * whatever the numbers say, an urgent flag means Seek Care Now.
 */
export type CareLabel = "Normal" | "Watch Closely" | "Needs Attention" | "Seek Care Now";

export function careLabel(
  status: "normal" | "low" | "high" | "attention",
  priority?: "info" | "watch" | "attention" | "urgent"
): CareLabel {
  if (priority === "urgent") return "Seek Care Now";
  switch (status) {
    case "normal":
      return "Normal";
    case "low":
    case "high":
      return priority === "attention" ? "Needs Attention" : "Watch Closely";
    case "attention":
      return "Needs Attention";
    default:
      return "Watch Closely";
  }
}
