/**
 * The MicroHealth health score.
 *
 * ## The rule, in full
 *
 * There is no hidden model here. The score is:
 *
 *   1. For each metric that has a reading, compute a sub-score 0–1:
 *      inside its healthy band is 1.0, and the score falls off linearly to 0.0
 *      at one full band-width outside. (See `bandScore`.)
 *
 *   2. Combine the sub-scores as a weighted mean, weighted by each metric's
 *      `weight`. Metrics with weight 0 are shown but not scored.
 *
 *   3. **Cap it by the worst metric.** The mean cannot exceed the lowest
 *      sub-score by more than `WORST_ALLOWANCE`. (See below — this step is
 *      not optional.)
 *
 *   4. Multiply by 100 and band it:
 *      ≥ 85 Good · 70–84 Fair · < 70 Needs attention
 *
 * ## Why step 3 exists
 *
 * A pure weighted mean is unsafe here. SpO2 carries a weight of 1.5 out of a
 * total of 11.5, so a genuine desaturation — 91%, well into the danger zone —
 * scores 0.20 on its own metric and drags the mean only to 0.89: a headline of
 * "89, Good". Every other metric being healthy averages the emergency away.
 *
 * So the mean is capped at `worstSubScore + WORST_ALLOWANCE`. One severe
 * reading can always move the headline, and a score in the "Good" band is a
 * claim that *no* metric is badly out — which is the guarantee a patient will
 * actually read into it. The same packet now scores 55, "Needs attention".
 *
 * The allowance keeps the score from becoming a pure worst-case: a single
 * mildly-off reading still nudges rather than dictates. Set it to 0 and the
 * score is simply the worst metric; set it to 1 and step 3 does nothing.
 *
 * Three further consequences are worth stating plainly, because they are
 * deliberate:
 *
 * **It is band-relative, not absolute.** Being 5 bpm over on heart rate costs
 * almost nothing (its band is 40 wide); being 5 points under on SpO2 costs
 * substantially (its band is 5 wide). That is the correct clinical reading of
 * those two facts, and a score built on raw deltas would get it backwards.
 *
 * **A metric with no reading is not a zero.** It is simply absent, and the
 * weights renormalise over what is present. A patient who has never worn the
 * band is not scored as unhealthy for the metrics they have no data for — but
 * `coverage` reports how much of the picture is actually filled in, so the UI
 * can say "based on 4 of 12 measures" rather than implying certainty.
 *
 * **The score is a summary, not a diagnosis.** It answers "how am I doing
 * overall". Finding the thing that is wrong is what the per-metric statuses
 * and the flags are for — `limiting` names whichever metric capped it.
 */

import {
  allMetrics,
  bandScore,
  classify,
  excursion,
  metrics,
  statusLabel,
  type Band,
  type Metric,
  type MetricStatus,
} from "./registry";

/** A single metric's reading, already extracted. */
export interface MetricReading {
  metricKey: string;
  /** The primary value. Null when the metric has a record but no value. */
  value: number | null;
  /** Sub-values, for `dual` and `composition` metrics. */
  parts?: Record<string, number | null>;
}

/** One metric's contribution to the score, kept so the UI can explain itself. */
export interface Contribution {
  metric: Metric;
  value: number | null;
  parts: { key: string; label: string; value: number | null; status: MetricStatus; score: number }[];
  status: MetricStatus;
  /** The metric's own sub-score, after combining its parts. */
  score: number;
  weight: number;
  /** How far outside its band, in band-widths. 0 when in range. */
  excursion: number;
}

export type ScoreBand = "good" | "fair" | "attention";

export interface HealthScore {
  /** 0–100, rounded. Null when nothing scorable is present. */
  score: number | null;
  band: ScoreBand | null;
  /** The weighted mean before capping, 0–1. Null when nothing is present. */
  ratio: number | null;
  /** The mean after the worst-metric cap. Null when nothing is present. */
  capped: number | null;
  /**
   * Whether the cap actually bound — i.e. the number is being held below the
   * mean by one metric. The UI can then say "limited by Blood Oxygen" instead
   * of leaving the patient to work out why the score is lower than it feels.
   */
  limited: boolean;
  /** The metric that capped the score, when `limited`. */
  limiting: Contribution | null;
  /** Every metric that moved the number, worst first. */
  contributions: Contribution[];
  /** How much of the scorable picture is present, 0–1. */
  coverage: number;
  /** The metrics that were scored, for "based on N of M measures". */
  scoredCount: number;
  scorableCount: number;
}

export const SCORE_BANDS = { good: 85, fair: 70 } as const;

/**
 * How far the weighted mean is allowed to exceed the worst sub-score.
 *
 * This is the one tuning knob in the whole rule. Lower makes the score behave
 * more like "your worst metric"; higher makes it behave more like a plain
 * average. 0.35 is chosen so that a metric at 0 out of 1 caps the headline at
 * 35 ("Needs attention") while a metric at 0.8 caps at nothing at all.
 */
export const WORST_ALLOWANCE = 0.35;

export function scoreBandOf(score: number): ScoreBand {
  if (score >= SCORE_BANDS.good) return "good";
  if (score >= SCORE_BANDS.fair) return "fair";
  return "attention";
}

export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  good: "Good",
  fair: "Fair",
  attention: "Needs attention",
};

/**
 * Combine a metric's sub-readings into one score.
 *
 * `dual` takes the *worst* part: blood pressure is judged on either number
 * being high, and averaging 150/70 into "fine" would hide a hypertensive
 * reading. `composition` takes the *mean*: it is a profile, not a pass/fail,
 * so one soft measure should not condemn the rest.
 */
function combineParts(
  metric: Metric,
  values: { key: string; label: string; value: number | null; band: Band }[]
): { score: number; status: MetricStatus; worst: number; verdict: { key: string; label: string; band: Band; value: number } | null } {
  const scored = values.filter((v): v is typeof v & { value: number } => v.value != null);
  if (!scored.length) return { score: 0, status: "normal", worst: 0, verdict: null };

  const each = scored.map((v) => ({
    ...v,
    score: bandScore(v.value, v.band),
    status: classify(v.value, v.band),
  }));
  const scores = each.map((e) => e.score);
  const score =
    metric.shape === "dual" ? Math.min(...scores) : scores.reduce((a, b) => a + b, 0) / scores.length;

  const worstExcursion = Math.max(...scored.map((v) => excursion(v.value, v.band)));
  const anyOff = each.find((e) => e.status !== "normal");
  return {
    score,
    status: anyOff?.status ?? "normal",
    worst: worstExcursion,
    verdict: anyOff ? { key: anyOff.key, label: anyOff.label, band: anyOff.band, value: anyOff.value } : null,
  };
}

/**
 * Score a set of readings.
 *
 * Metrics absent from `readings` are skipped entirely rather than counted as
 * failures — see the note on coverage at the top of this file.
 */
export function computeHealthScore(readings: MetricReading[]): HealthScore {
  const byKey = new Map(readings.map((r) => [r.metricKey, r]));
  const scorable = allMetrics.filter((m) => m.weight > 0);

  const contributions: Contribution[] = [];

  for (const metric of scorable) {
    const reading = byKey.get(metric.key);
    if (!reading) continue;

    const parts = (metric.parts ?? []).map((p) => ({
      key: p.key,
      label: p.label,
      value: reading.parts?.[p.key] ?? null,
      band: p.band,
    }));

    const { score, status, worst } = combineParts(
      metric,
      parts.length
        ? parts
        : [{ key: metric.key, label: metric.label, value: reading.value, band: metric.band }]
    );

    /* A metric present but with no value at all contributes nothing. */
    const hasAny = parts.length ? parts.some((p) => p.value != null) : reading.value != null;
    if (!hasAny) continue;

    contributions.push({
      metric,
      value: reading.value,
      parts: parts.map((p) => ({
        key: p.key,
        label: p.label,
        value: p.value,
        status: p.value == null ? "normal" : classify(p.value, p.band),
        score: p.value == null ? 0 : bandScore(p.value, p.band),
      })),
      status,
      score,
      weight: metric.weight,
      excursion: worst,
    });
  }

  contributions.sort((a, b) => a.score - b.score);

  const totalWeight = contributions.reduce((sum, c) => sum + c.weight, 0);
  const ratio = totalWeight > 0
    ? contributions.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight
    : null;

  /* The worst-metric cap. `contributions` is sorted worst-first, so the first
     entry is the binding one. */
  const worst = contributions[0];
  const cap = worst ? worst.score + WORST_ALLOWANCE : 1;
  const capped = ratio == null ? null : Math.min(ratio, cap);
  const limited = ratio != null && capped !== ratio;

  const score = capped == null ? null : Math.round(capped * 100);

  return {
    score,
    band: score == null ? null : scoreBandOf(score),
    ratio,
    capped,
    limited,
    limiting: limited ? worst : null,
    contributions,
    coverage: scorable.length ? contributions.length / scorable.length : 0,
    scoredCount: contributions.length,
    scorableCount: scorable.length,
  };
}

/**
 * Pull every metric the registry can read out of a band packet.
 *
 * The band reports several measures in one row, so one row yields several
 * readings. Metrics whose `source` is `record` are absent by construction —
 * they are not on the packet, and reporting them as missing would be wrong.
 */
export function readingsFromPacket(packet: any): MetricReading[] {
  if (!packet) return [];
  const out: MetricReading[] = [];
  for (const metric of allMetrics) {
    if (metric.source !== "vitals" || !metric.read) continue;
    const value = metric.read(packet);
    if (value == null) continue;
    const parts = metric.parts
      ? Object.fromEntries(metric.parts.map((p) => [p.key, p.read?.(packet) ?? null]))
      : undefined;
    out.push({ metricKey: metric.key, value, parts });
  }
  return out;
}

/** A one-line summary of what is dragging the score down, for the UI. */
export function worstOffender(result: HealthScore): { metric: Metric; status: MetricStatus; label: string } | null {
  const worst = result.contributions.find((c) => c.status !== "normal");
  if (!worst) return null;
  return { metric: worst.metric, status: worst.status, label: statusLabel(worst.status, worst.metric) };
}

export { metrics };
