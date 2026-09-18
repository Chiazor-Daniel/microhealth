/**
 * MicroHealth metric registry — the single definition of every measure the
 * product can show.
 *
 * ## Why this exists
 *
 * The app used to hold four metrics, and each screen defined them for itself:
 * a `RANGES` table in Vitals, a `METRICS` table in VitalsDetail, a `BANDS`
 * table in Home, and a second copy of all three on the native side. Four
 * metrics survived that. Seventeen would not have — every new measure meant
 * six hand-kept definitions that could silently disagree about whether a
 * resting heart rate of 55 is fine.
 *
 * So a metric is declared once, here, and every screen reads it back. Nothing
 * in this file knows about React, CSS or React Native: it is plain data plus
 * pure functions, importable from both builds. Icons are referenced by glyph
 * *name* (`src/icons/geometry.ts`), not by component, so the registry stays
 * framework-free.
 *
 * ## Metrics are not all the same shape
 *
 * The old screens assumed every metric was "a number with a sparkline on a
 * Day/Week/Month axis". That is true of eight of these and false of the rest.
 * Cholesterol has no "value over the last day" — it is one number from one
 * blood draw. Sleep is a sequence of *states*, not values. ECG is a waveform.
 * Steps accumulate rather than sample.
 *
 * `shape` and `cadence` say which kind of thing a metric is, and screens are
 * expected to branch on them rather than trying to force one card onto all
 * seventeen. A `cumulative` metric must not get a Day/Week/Month sample line;
 * a `panel` must not get one series per analyte.
 *
 * ## Where the data comes from
 *
 * `source` records which store a reading arrives in. The band reports several
 * measures in one wide packet, so those live as columns on a single row and
 * are read by `read`. Everything episodic — a night of sleep, an ECG capture,
 * a composition scan, a lab panel — is its own record and carries its value
 * directly, so it needs no reader.
 */

import type { GlyphName } from "../icons/geometry";
import { metricTint } from "../tokens";

/* ================================================================== */
/* Vocabulary                                                          */
/* ================================================================== */

/**
 * What a metric physically *is*. Screens render by shape, not by metric.
 *
 *  scalar        one number. The common case.
 *  dual          two coupled numbers that are meaningless apart (blood pressure).
 *  waveform      a sampled signal, not a value (ECG).
 *  hypnogram     a sequence of states over a night (sleep stages).
 *  composition   parts of a whole, shown as a breakdown (body composition).
 *  panel         several analytes from one draw (the blood lipid panel).
 *  cumulative    accumulates across a day rather than being sampled (steps).
 *  categorical   a label, not a quantity (emotion).
 */
export type MetricShape =
  | "scalar"
  | "dual"
  | "waveform"
  | "hypnogram"
  | "composition"
  | "panel"
  | "cumulative"
  | "categorical";

/**
 * How often readings arrive — and therefore what time windows are meaningful.
 *
 *  stream    continuously, seconds apart (heart rate, SpO2)
 *  spot      on demand, when the patient takes a measurement (blood pressure)
 *  nightly   once per night (sleep)
 *  daily     one rollup per day (steps, calories)
 *  interval  now and then, days or weeks apart (body composition, labs)
 */
export type MetricCadence = "stream" | "spot" | "nightly" | "daily" | "interval";

/** Which section of the Vitals screen a metric belongs to. */
export type MetricCategory =
  | "live"
  | "cardiac"
  | "sleep"
  | "activity"
  | "body"
  | "wellbeing"
  | "labs";

/** The judgement a single reading earns. */
export type MetricStatus = "normal" | "attention" | "low" | "high";

/** Which store a reading comes from. */
export type MetricSource =
  /** A column on the band's wide packet (one row carries several metrics). */
  | "vitals"
  /** Its own record: a night, a capture, a scan, a panel. */
  | "record";

/**
 * The healthy band for a metric, and which side of it matters.
 *
 * `concern` names the dangerous direction, which is what lets one scorer serve
 * metrics as different as SpO2 (only ever too low) and steps (only ever too
 * few) without a bespoke rule each.
 */
export interface Band {
  low: number;
  high: number;
  /**
   *  "both" — either edge is a concern (heart rate: tachy *and* brady)
   *  "low"  — falling below `low` is the concern; high is good (SpO2, steps)
   *  "high" — rising above `high` is the concern; low is good (stress, LDL)
   */
  concern: "both" | "low" | "high";
}

/** A named sub-reading, for `dual` and `composition` metrics. */
export interface MetricPart {
  key: string;
  label: string;
  /** Defaults to the parent metric's unit. */
  unit?: string;
  /** Defaults to the parent metric's precision. */
  precision?: number;
  band: Band;
  read?: (reading: any) => number | null;
}

export interface Metric {
  key: string;
  label: string;
  /** Two or three letters, for a compact tile or a chart axis. */
  short: string;
  unit: string;
  category: MetricCategory;
  shape: MetricShape;
  cadence: MetricCadence;
  source: MetricSource;
  /** Decimal places when formatted. */
  precision: number;
  icon: GlyphName;
  band: Band;
  /**
   * How much this metric counts toward the health score, relative to the
   * others. 0 means "shown but not scored" — context, not a verdict. Weight 0
   * is the honest choice for anything the patient cannot act on today.
   */
  weight: number;
  /**
   * Reads the value out of a band packet. Absent for `record` metrics, whose
   * records carry their value directly.
   */
  read?: (reading: any) => number | null;
  /** Sub-readings. Required for `dual` and `composition` shapes. */
  parts?: MetricPart[];
  /**
   * Extra windows this metric is meaningful over, beyond the default time
   * range. Heart rate is the one metric patients expect at three resolutions.
   */
  windows?: readonly string[];
  /** Overrides the default wording for a status, where the default misleads. */
  labels?: Partial<Record<MetricStatus, string>>;
  /** One line explaining the measure, for a detail screen. */
  note?: string;
}

/* ================================================================== */
/* The band arithmetic                                                 */
/* ================================================================== */

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** How far outside the band a value sits, in multiples of the band's width. */
export function excursion(value: number, band: Band): number {
  const width = Math.max(band.high - band.low, 1e-6);
  const over = value > band.high ? (value - band.high) / width : 0;
  const under = value < band.low ? (band.low - value) / width : 0;
  switch (band.concern) {
    case "high":
      return over;
    case "low":
      return under;
    case "both":
      return Math.max(over, under);
  }
}

/**
 * A reading's health sub-score, 0–1.
 *
 * Within the band it is 1. Outside, it falls off linearly: a value one full
 * band-width past the edge scores 0. That makes the score self-scaling — a
 * band as narrow as SpO2's (95–100) is not judged by the same absolute slack
 * as a band as wide as heart rate's (60–100), which is the point. Being 5 bpm
 * over on heart rate is unremarkable; 5 points under on SpO2 is not.
 */
export function bandScore(value: number, band: Band): number {
  return clamp01(1 - excursion(value, band));
}

/** The status a single reading earns. */
export function classify(value: number, band: Band): MetricStatus {
  if (value >= band.low && value <= band.high) return "normal";
  /* Up to a quarter of a band-width outside is "worth a look" rather than an
     outright low/high — otherwise every reading a hair off the edge shouts. */
  return excursion(value, band) <= 0.25 ? "attention" : value > band.high ? "high" : "low";
}

/** The human wording for a status, honouring a metric's own overrides. */
export function statusLabel(status: MetricStatus, metric: Metric): string {
  if (metric.labels?.[status]) return metric.labels[status]!;
  switch (status) {
    case "normal":
      return "Normal";
    case "attention":
      return "Attention";
    case "low":
      return "Low";
    case "high":
      return "High";
  }
}

/** An icon tile colour pair for a metric. */
export function tintOf(metric: Metric) {
  return metricTint(metric.key);
}

/* ================================================================== */
/* The registry                                                        */
/* ================================================================== */

export const metrics = {
  /* ---------------- Live: what the band is reading right now ---------------- */

  heartRate: {
    key: "heartRate",
    label: "Heart Rate",
    short: "HR",
    unit: "bpm",
    category: "live",
    shape: "scalar",
    cadence: "stream",
    source: "vitals",
    precision: 0,
    icon: "heart",
    band: { low: 60, high: 100, concern: "both" },
    weight: 1.2,
    /* The one metric patients expect at three resolutions: what is it now,
       what has the last five minutes looked like, what has the half hour. */
    windows: ["realtime", "5m", "30m"] as const,
    read: (v) => v?.heartRate ?? null,
    note: "Sustained above 100 at rest is tachycardia; in the low 50s during sleep is normal.",
  },

  spo2: {
    key: "spo2",
    label: "Blood Oxygen",
    short: "SpO₂",
    unit: "%",
    category: "live",
    shape: "scalar",
    cadence: "stream",
    source: "vitals",
    precision: 0,
    icon: "oxygen",
    /* Only ever too low — there is no upper concern. */
    band: { low: 95, high: 100, concern: "low" },
    /* The most immediately actionable number in the set, hence the top weight. */
    weight: 1.5,
    read: (v) => v?.spo2 ?? null,
    note: "Below 90% is an emergency. Repeated dips overnight are what the apnea check looks for.",
  },

  respiratoryRate: {
    key: "respiratoryRate",
    label: "Respiration",
    short: "RR",
    unit: "br/min",
    category: "live",
    shape: "scalar",
    cadence: "stream",
    source: "vitals",
    precision: 0,
    icon: "lungs",
    band: { low: 12, high: 20, concern: "both" },
    weight: 1.2,
    read: (v) => v?.respiratoryRate ?? null,
    note: "Rises before most other signs when a respiratory infection is taking hold.",
  },

  bodyTemperature: {
    key: "bodyTemperature",
    label: "Temperature",
    short: "Temp",
    unit: "°C",
    category: "live",
    shape: "scalar",
    cadence: "stream",
    source: "vitals",
    precision: 1,
    icon: "thermometer",
    band: { low: 36.1, high: 37.2, concern: "both" },
    weight: 1.0,
    read: (v) => v?.temperature ?? null,
  },

  /* ---------------- Cardiac ---------------- */

  bloodPressure: {
    key: "bloodPressure",
    label: "Blood Pressure",
    short: "BP",
    unit: "mmHg",
    category: "cardiac",
    shape: "dual",
    cadence: "spot",
    source: "vitals",
    precision: 0,
    icon: "droplet",
    /* The parent band is the systolic one; the pair is judged part by part. */
    band: { low: 90, high: 120, concern: "both" },
    weight: 1.4,
    read: (v) => v?.bloodPressureSystolic ?? v?.systolic ?? null,
    parts: [
      {
        key: "systolic",
        label: "Systolic",
        band: { low: 90, high: 120, concern: "both" },
        read: (v) => v?.bloodPressureSystolic ?? v?.systolic ?? null,
      },
      {
        key: "diastolic",
        label: "Diastolic",
        band: { low: 60, high: 80, concern: "both" },
        read: (v) => v?.bloodPressureDiastolic ?? v?.diastolic ?? null,
      },
    ],
    labels: { attention: "Elevated" },
    note: "Read as a pair. Either number being high matters, so they are scored separately.",
  },

  ecg: {
    key: "ecg",
    label: "ECG",
    short: "ECG",
    unit: "",
    category: "cardiac",
    shape: "waveform",
    cadence: "spot",
    source: "record",
    precision: 0,
    icon: "ecg",
    band: { low: 0, high: 0, concern: "both" },
    /* Not scored: the waveform has no value. The rhythm *classification* that
       accompanies a capture is what would carry a score, and that lives with
       the record rather than here. */
    weight: 0,
    note: "A 30-second capture. The tracing is reviewed for rhythm, not amplitude.",
  },

  /* ---------------- Wellbeing ---------------- */

  hrv: {
    key: "hrv",
    label: "HRV",
    short: "HRV",
    unit: "ms",
    category: "wellbeing",
    shape: "scalar",
    cadence: "stream",
    source: "vitals",
    precision: 0,
    icon: "hrv",
    /* Higher is generally better, but it is highly individual — so it informs
       the trend without dominating the score. */
    band: { low: 20, high: 100, concern: "low" },
    weight: 0.7,
    read: (v) => v?.hrv ?? null,
    note: "Beat-to-beat variation. A falling trend often shows strain before you feel it.",
  },

  stress: {
    key: "stress",
    label: "Stress",
    short: "Stress",
    unit: "",
    category: "wellbeing",
    shape: "scalar",
    cadence: "stream",
    source: "vitals",
    precision: 0,
    icon: "gauge",
    band: { low: 0, high: 40, concern: "high" },
    weight: 0.6,
    read: (v) => v?.stress ?? null,
    note: "A 0–100 index derived from HRV and skin conductance, not a clinical measure.",
  },

  fatigue: {
    key: "fatigue",
    label: "Fatigue",
    short: "Fatigue",
    unit: "",
    category: "wellbeing",
    shape: "scalar",
    cadence: "stream",
    source: "vitals",
    precision: 0,
    icon: "batteryLow",
    band: { low: 0, high: 40, concern: "high" },
    weight: 0.6,
    read: (v) => v?.fatigue ?? null,
  },

  gsr: {
    key: "gsr",
    label: "Skin Conductance",
    short: "GSR",
    unit: "µS",
    category: "wellbeing",
    shape: "scalar",
    cadence: "stream",
    source: "vitals",
    precision: 1,
    icon: "sweat",
    /* Genuinely two-sided: both a very dry and a very damp reading are notable. */
    band: { low: 2, high: 20, concern: "both" },
    weight: 0.4,
    read: (v) => v?.gsr ?? null,
    note: "Sweat gland activity. Feeds the stress index rather than being read on its own.",
  },

  emotion: {
    key: "emotion",
    label: "Emotion",
    short: "Mood",
    unit: "",
    category: "wellbeing",
    shape: "categorical",
    cadence: "spot",
    source: "record",
    precision: 0,
    icon: "smile",
    band: { low: 0, high: 0, concern: "both" },
    /* A label, and usually self-reported. It contextualises the numbers; it
       must not move the health score. */
    weight: 0,
    note: "Inferred from the vitals above, and correctable by the patient.",
  },

  /* ---------------- Sleep ---------------- */

  sleep: {
    key: "sleep",
    label: "Sleep",
    short: "Sleep",
    unit: "h",
    category: "sleep",
    shape: "hypnogram",
    cadence: "nightly",
    source: "record",
    precision: 1,
    icon: "moon",
    /* Scored on duration; the stage breakdown is shown but not scored, since
       stage boundaries vary a lot between devices. */
    band: { low: 7, high: 9, concern: "low" },
    weight: 0.8,
    parts: [
      { key: "deep", label: "Deep", unit: "h", precision: 1, band: { low: 1, high: 2.5, concern: "low" } },
      { key: "light", label: "Light", unit: "h", precision: 1, band: { low: 3, high: 5, concern: "low" } },
      { key: "rem", label: "REM", unit: "h", precision: 1, band: { low: 1, high: 2.5, concern: "low" } },
      { key: "awake", label: "Awake", unit: "h", precision: 1, band: { low: 0, high: 0.5, concern: "high" } },
    ],
    labels: { low: "Short", attention: "Slightly short" },
    note: "One record per night, not a running value — a 'day' axis would be meaningless.",
  },

  /* ---------------- Activity (all rollups, not samples) ---------------- */

  steps: {
    key: "steps",
    label: "Steps",
    short: "Steps",
    unit: "",
    category: "activity",
    shape: "cumulative",
    cadence: "daily",
    source: "record",
    precision: 0,
    icon: "footsteps",
    band: { low: 0, high: 10000, concern: "low" },
    weight: 0.5,
    labels: { low: "Below target", attention: "Almost there", normal: "Goal met" },
    note: "Accumulates across the day, so this is progress toward a target — not a sample.",
  },

  distance: {
    key: "distance",
    label: "Distance",
    short: "Dist",
    unit: "km",
    category: "activity",
    shape: "cumulative",
    cadence: "daily",
    source: "record",
    precision: 2,
    icon: "route",
    band: { low: 0, high: 8, concern: "low" },
    weight: 0,
    labels: { low: "Below target", attention: "Almost there", normal: "Goal met" },
  },

  calories: {
    key: "calories",
    label: "Calories",
    short: "kcal",
    unit: "kcal",
    category: "activity",
    shape: "cumulative",
    cadence: "daily",
    source: "record",
    precision: 0,
    icon: "flame",
    band: { low: 0, high: 600, concern: "low" },
    weight: 0,
    labels: { low: "Below target", attention: "Almost there", normal: "Goal met" },
  },

  met: {
    key: "met",
    label: "Activity Intensity",
    short: "MET",
    unit: "MET",
    category: "activity",
    shape: "scalar",
    cadence: "daily",
    source: "record",
    precision: 1,
    icon: "run",
    band: { low: 1.5, high: 6, concern: "low" },
    /* Context only: it explains the calorie burn rather than being a target. */
    weight: 0,
    note: "1 MET is sitting still. 3–6 is moderate activity; above 6 is vigorous.",
  },

  /* ---------------- Body ---------------- */

  bloodGlucose: {
    key: "bloodGlucose",
    label: "Blood Glucose",
    short: "Glucose",
    unit: "mg/dL",
    category: "body",
    shape: "scalar",
    cadence: "interval",
    source: "record",
    precision: 0,
    icon: "glucose",
    band: { low: 70, high: 140, concern: "both" },
    weight: 1.1,
    note: "Fasting and post-meal carry different targets; this band is the general one.",
  },

  bodyComposition: {
    key: "bodyComposition",
    label: "Body Composition",
    short: "Body",
    unit: "%",
    category: "body",
    shape: "composition",
    cadence: "interval",
    source: "record",
    precision: 1,
    icon: "bodyComposition",
    band: { low: 10, high: 25, concern: "high" },
    weight: 0.5,
    parts: [
      { key: "bodyFat", label: "Body fat", unit: "%", precision: 1, band: { low: 10, high: 25, concern: "high" } },
      { key: "muscleMass", label: "Muscle", unit: "%", precision: 1, band: { low: 30, high: 45, concern: "low" } },
      { key: "water", label: "Water", unit: "%", precision: 1, band: { low: 50, high: 65, concern: "low" } },
      { key: "weight", label: "Weight", unit: "kg", precision: 1, band: { low: 50, high: 90, concern: "both" } },
    ],
    note: "Read as a breakdown. Weight alone says much less than the proportions do.",
  },

  /* ---------------- Labs ----------------
     Defined here so the metric picker and any summary card can speak about
     them, but they are *rendered* by the Labs module, which owns the panel,
     the reference ranges and the ordering workflow. Vitals links there rather
     than duplicating the numbers. */

  uricAcid: {
    key: "uricAcid",
    label: "Uric Acid",
    short: "Uric",
    unit: "mg/dL",
    category: "labs",
    shape: "panel",
    cadence: "interval",
    source: "record",
    precision: 1,
    icon: "flask",
    band: { low: 3.4, high: 7.2, concern: "high" },
    weight: 0,
  },

  cholesterol: {
    key: "cholesterol",
    label: "Total Cholesterol",
    short: "Chol",
    unit: "mg/dL",
    category: "labs",
    shape: "panel",
    cadence: "interval",
    source: "record",
    precision: 0,
    icon: "flask",
    band: { low: 0, high: 200, concern: "high" },
    weight: 0,
  },

  triglycerides: {
    key: "triglycerides",
    label: "Triglycerides",
    short: "Trig",
    unit: "mg/dL",
    category: "labs",
    shape: "panel",
    cadence: "interval",
    source: "record",
    precision: 0,
    icon: "flask",
    band: { low: 0, high: 150, concern: "high" },
    weight: 0,
  },

  hdl: {
    key: "hdl",
    label: "HDL",
    short: "HDL",
    unit: "mg/dL",
    category: "labs",
    shape: "panel",
    cadence: "interval",
    source: "record",
    precision: 0,
    icon: "flask",
    /* The one lipid where higher is better. */
    band: { low: 40, high: 100, concern: "low" },
    weight: 0,
  },

  ldl: {
    key: "ldl",
    label: "LDL",
    short: "LDL",
    unit: "mg/dL",
    category: "labs",
    shape: "panel",
    cadence: "interval",
    source: "record",
    precision: 0,
    icon: "flask",
    band: { low: 0, high: 100, concern: "high" },
    weight: 0,
  },
} satisfies Record<string, Metric>;

export type MetricKey = keyof typeof metrics;

/** Every metric, in registry order. */
export const allMetrics: Metric[] = Object.values(metrics);

/** The order sections appear in on the Vitals screen. */
export const CATEGORY_ORDER: MetricCategory[] = [
  "live",
  "cardiac",
  "sleep",
  "activity",
  "body",
  "wellbeing",
  "labs",
];

export const CATEGORY_LABEL: Record<MetricCategory, string> = {
  live: "Live now",
  cardiac: "Heart",
  sleep: "Sleep",
  activity: "Activity",
  body: "Body",
  wellbeing: "Wellbeing",
  labs: "Blood tests",
};

export function metricsIn(category: MetricCategory): Metric[] {
  return allMetrics.filter((m) => m.category === category);
}

export function metricOf(key: string): Metric | undefined {
  return (metrics as Record<string, Metric>)[key];
}

export type { GlyphName };
