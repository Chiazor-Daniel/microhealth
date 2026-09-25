/**
 * Turning raw readings into what a screen actually draws.
 *
 * The registry says what a metric *is*; this says what it currently *says* —
 * the display string, the status, the formatted parts. Both platforms read
 * from here, so a blood pressure reading renders as "118/76" in the same
 * place on web and native, and neither one has to re-implement the rule.
 *
 * Framework-free: no React, no DOM. It is a pure function of (packet,
 * records) → display values.
 */

import {
  allMetrics,
  classify,
  metricOf,
  statusLabel,
  type Metric,
  type MetricStatus,
} from "./registry";
import type { MetricReading } from "./healthScore";

/** A row from the `metric_readings` table. */
export interface MetricRecord {
  metricKey: string;
  value: number | null;
  value2?: number | null;
  unit?: string | null;
  source?: string | null;
  /** JSON. What a metric needs beyond one or two numbers — a hypnogram, a rhythm. */
  meta?: string | null;
  recordedAt: string;
}

/** One metric, resolved and ready to render. */
export interface MetricValue {
  metric: Metric;
  /** The primary number, or null when there is no reading. */
  value: number | null;
  /** Ready to print — "118/76", "7.4", "9,842". */
  display: string;
  unit: string;
  status: MetricStatus;
  statusText: string;
  /** Sub-values, formatted. Empty for a plain scalar. */
  parts: {
    key: string;
    label: string;
    value: number | null;
    display: string;
    unit: string;
    status: MetricStatus;
  }[];
  /** When the reading was taken, when known. */
  at?: string;
  /** Where it came from — a cuff reading and a lab result are not equal. */
  source?: string;
}

/**
 * Format a number the way its metric asks to be read.
 *
 * Counts get thousands separators and no decimals — a step count of
 * "5,431.0" would be absurd. Anything with a declared precision keeps it,
 * including cumulative metrics: distance is a rollup but "6 km" for 6.06 km
 * is a lie the precision was there to prevent.
 */
export function formatValue(value: number, metric: Metric): string {
  const dp = metric.precision;
  if (metric.shape === "cumulative" && dp === 0) return group(Math.round(value));
  return value.toFixed(dp);
}

function emptyValue(metric: Metric): MetricValue {
  return {
    metric,
    value: null,
    display: "—",
    unit: metric.unit,
    status: "normal",
    statusText: "No reading",
    parts: [],
  };
}

/**
 * The current packet: newest non-null value per field across recent rows.
 *
 * Sensors drop fields — a row with only heart rate must not blank the blood
 * pressure tile just because it arrived last. Every "current number" read
 * goes through here instead of `rows[0]`.
 */
const CURRENT_FIELDS = [
  "heartRate",
  "bloodPressureSystolic",
  "bloodPressureDiastolic",
  "spo2",
  "temperature",
  "respiratoryRate",
  "bloodSugar",
  "weight",
] as const;

export function currentVitals(rows: any[]): any | undefined {
  if (!rows.length) return undefined;
  const out: Record<string, any> = { ...rows[0] };
  for (const f of CURRENT_FIELDS) {
    if (out[f] != null) continue;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i]?.[f] != null) {
        out[f] = rows[i][f];
        break;
      }
    }
  }
  return out;
}

/**
 * Resolve one metric from whatever is available.
 *
 * `packet` is the band's wide row; `record` is a stored episodic reading.
 * A metric declares which one it expects via its `source`, so there is no
 * guessing here — a sleep record can never be read out of a heart-rate packet.
 */
export function resolveMetric(
  metric: Metric,
  packet: any,
  record?: MetricRecord
): MetricValue {
  if (metric.source === "record") {
    if (!record || record.value == null) return emptyValue(metric);
    return valueFromParts(metric, record.value, record, undefined, record.recordedAt);
  }

  if (!metric.read) return emptyValue(metric);
  const raw = metric.read(packet);
  if (raw == null) return emptyValue(metric);
  return valueFromParts(metric, raw, undefined, packet, packet?.recordedAt);
}

/**
 * Build the display value from a primary number plus its parts.
 *
 * `record` carries parts for episodic metrics (a composition scan's four
 * proportions, pulled from `meta`); `packet` carries them for the wide-packet
 * ones (blood pressure's diastolic, read by each part's own reader).
 */
function valueFromParts(
  metric: Metric,
  value: number,
  record?: MetricRecord,
  packet?: any,
  at?: string
): MetricValue {
  const meta = record?.meta ? safeParse(record.meta) : undefined;

  const parts = (metric.parts ?? []).map((p) => {
    const pv = packet ? p.read?.(packet) ?? null : (meta?.[p.key] ?? null);
    return {
      key: p.key,
      label: p.label,
      value: pv,
      display: pv == null ? "—" : formatValue(pv, { ...metric, precision: p.precision ?? metric.precision }),
      unit: p.unit ?? metric.unit,
      status: pv == null ? ("normal" as MetricStatus) : classify(pv, p.band),
    };
  });

  /* A dual metric reads as its parts — "118/76", not "118". Joining here
     rather than in the component means the number is identical everywhere. */
  const dual =
    metric.shape === "dual" && parts.length >= 2 && parts[0].value != null && parts[1].value != null;

  const display = dual
    ? `${parts[0].display}/${parts[1].display}`
    : formatValue(value, metric);

  /* For a dual metric the status is the worst of the pair: either number
     being high is what matters, so averaging them would hide it. */
  const status =
    metric.shape === "dual" && parts.length
      ? worstStatus(parts.map((p) => p.status))
      : classify(value, metric.band);

  return {
    metric,
    value,
    display,
    unit: metric.unit,
    status,
    statusText: statusLabel(status, metric),
    parts,
    at,
    source: record?.source ?? undefined,
  };
}

const RANK: Record<MetricStatus, number> = { normal: 0, attention: 1, low: 2, high: 2 };

/** Thousands separators, because "10000 steps" is unreadable. */
function group(n: number): string {
  return n.toLocaleString("en-US");
}

function worstStatus(statuses: MetricStatus[]): MetricStatus {
  return statuses.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "normal" as MetricStatus);
}

function safeParse(json: string): Record<string, number> | undefined {
  try {
    return JSON.parse(json);
  } catch {
    /* A malformed meta blob costs the parts, not the whole reading. */
    return undefined;
  }
}

/**
 * The current value of every metric the product knows about.
 *
 * Metrics with no reading are still returned, resolved to an empty state —
 * a screen decides whether to hide them or show "not recording yet", and it
 * needs the metric's label and icon to do either.
 */
export function resolveAll(packet: any, records: MetricRecord[]): MetricValue[] {
  /* Newest first in, newest first out: the API returns them ordered, and the
     first occurrence of a key is therefore the current one. */
  const latestByKey = new Map<string, MetricRecord>();
  for (const r of records) {
    if (!latestByKey.has(r.metricKey)) latestByKey.set(r.metricKey, r);
  }
  return allMetrics.map((m) => resolveMetric(m, packet, latestByKey.get(m.key)));
}

/** Only the metrics that actually have something to show. */
export function withReadings(values: MetricValue[]): MetricValue[] {
  return values.filter((v) => v.value != null);
}

/**
 * The newest reading from before a cut-off — what "yesterday" looked like.
 *
 * Used to put a delta under the health score. It reads the *packet* as it
 * stood, not today's, because a score compared against itself is always zero.
 * Returns null rather than guessing when the history does not reach back far
 * enough: a delta is a claim about change, and inventing one is worse than
 * omitting it.
 */
export function packetBefore(vitals: any[], hoursAgo = 24): any | null {
  const cutoff = Date.now() - hoursAgo * 3600_000;
  return vitals.find((v) => v?.recordedAt && new Date(v.recordedAt).getTime() < cutoff) ?? null;
}

/** Records taken before the same cut-off, so the two scores cover one window each. */
export function recordsBefore(records: MetricRecord[], hoursAgo = 24): MetricRecord[] {
  const cutoff = Date.now() - hoursAgo * 3600_000;
  return records.filter((r) => new Date(r.recordedAt).getTime() < cutoff);
}

/**
 * Resolved values → the input the health score wants.
 *
 * The scorer only needs a number per metric, so this drops the formatting and
 * keeps the parts that a dual or composition metric is judged on.
 */
export function toScoreReadings(values: MetricValue[]): MetricReading[] {
  return values
    .filter((v) => v.value != null)
    .map((v) => ({
      metricKey: v.metric.key,
      value: v.value,
      parts: v.parts.length
        ? Object.fromEntries(v.parts.map((p) => [p.key, p.value]))
        : undefined,
    }));
}

export { metricOf };
