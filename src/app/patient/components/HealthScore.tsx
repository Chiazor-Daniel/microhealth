import { motion } from "motion/react";
import { patientTheme } from "../theme";
import { SCORE_BAND_LABEL, SCORE_BANDS, type HealthScore, type ScoreBand } from "../../../metrics/healthScore";

/**
 * The health score.
 *
 * ## Why there is no ring
 *
 * The first version was a ring. It looked good on paper and failed in use, for
 * a reason worth writing down: **the score lives in a narrow, high band.** A
 * patient who is basically fine scores 90–100 nearly every time, so the ring
 * was a closed green donut almost always — and at 100 it was a literal solid
 * circle, conveying nothing a plain number would not.
 *
 * A ring is a good instrument for a value that sweeps its whole range. It is a
 * bad one for a value that sits at the top of it. And there were two meters for
 * one number — the ring *and* the scale — which is what made the card read
 * busy without being informative.
 *
 * So the number carries the magnitude and the scale carries the position. The
 * scale is the part a ring could never do: 88 and 97 sit in visibly different
 * places on it.
 */

const BAND = {
  good: { fg: patientTheme.colors.signalBright, chip: "#DCEFDA", tick: "#FFFFFF" },
  fair: { fg: patientTheme.colors.warning, chip: "#F7E9CE", tick: "#FFFFFF" },
  attention: { fg: patientTheme.colors.error, chip: "#F7DADB", tick: "#FFFFFF" },
} as const;

function bandOf(score: number): ScoreBand {
  if (score >= SCORE_BANDS.good) return "good";
  if (score >= SCORE_BANDS.fair) return "fair";
  return "attention";
}

/**
 * The band as a chip — the verdict in words.
 *
 * The scale shows *where* the score sits; this says what that means. Colour
 * alone would leave the patient to infer it, and the two colour-blind
 * conditions that matter most here are exactly the ones that make red and
 * green hard to tell apart.
 */
export function ScoreBandChip({ band }: { band: ScoreBand | null }) {
  const b = band ? BAND[band] : { fg: patientTheme.colors.textSecondary, chip: "#E9EEF2", tick: "#FFFFFF" };
  return (
    <span
      className="text-[11px] font-semibold whitespace-nowrap flex-shrink-0"
      style={{ color: b.fg, background: b.chip, borderRadius: 999, padding: "3px 10px", letterSpacing: "-0.005em" }}
    >
      {band ? SCORE_BAND_LABEL[band] : "No data"}
    </span>
  );
}

/**
 * Where the score sits on its own scale.
 *
 * The two tick marks are the band thresholds, drawn from the same constants
 * the scorer uses — so the scale and the verdict cannot disagree. They are
 * what give a high score a reference: without them a marker sitting at 95% of
 * the bar says nothing about whether that is good or merely acceptable.
 */
export function ScoreScale({ score }: { score: number | null }) {
  const pct = score == null ? null : Math.max(0, Math.min(100, score));
  const b = pct == null ? null : BAND[bandOf(pct)];

  return (
    <div className="mt-3">
      {/* The track is inset by the marker's own radius, so the marker stays
          fully inside the bar at 0 and at 100 rather than hanging off the end
          of it. */}
      <div className="relative" style={{ height: 8, margin: "0 7px" }}>
        <div
          className="absolute inset-0"
          style={{
            borderRadius: 999,
            background: `linear-gradient(90deg, ${BAND.attention.fg} 0%, ${BAND.fair.fg} ${SCORE_BANDS.fair}%, ${BAND.good.fg} ${SCORE_BANDS.good}%, ${BAND.good.fg} 100%)`,
            opacity: 0.3,
          }}
        />
        {/* Band thresholds. */}
        {[SCORE_BANDS.fair, SCORE_BANDS.good].map((t) => (
          <span
            key={t}
            className="absolute"
            style={{ left: `${t}%`, top: 0, bottom: 0, width: 1.5, background: "rgba(15,23,42,0.18)" }}
          />
        ))}
        {pct != null && (
          <motion.span
            className="absolute"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: `${pct}%`, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              top: -3,
              width: 14,
              height: 14,
              marginLeft: -7,
              borderRadius: 999,
              background: "#FFFFFF",
              border: `3px solid ${b!.fg}`,
              boxShadow: "0 1px 4px rgba(16,24,40,0.22)",
            }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
          Needs attention
        </span>
        <span className="text-[10px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
          Good
        </span>
      </div>
    </div>
  );
}

/**
 * What is holding the score down, said plainly.
 *
 * A summary that will not say what it is summarising invites the patient to
 * guess. When the worst-metric cap bound, this is the sentence that explains
 * the number.
 */
export function scoreExplanation(result: HealthScore): string {
  if (result.score == null) return "Not enough readings yet to score your day.";
  if (result.limited && result.limiting) {
    return `${result.limiting.metric.label} is the one to watch right now.`;
  }
  const off = result.contributions.filter((c) => c.status !== "normal").length;
  if (off === 0) return "Every measure is inside your usual range.";
  if (off === 1) return "One measure is slightly outside your usual range.";
  return `${off} measures are slightly outside your usual range.`;
}

/**
 * How much of the picture the score is actually based on.
 *
 * Only worth saying when it is *not* everything. "Based on 13 of 13 measures"
 * is a sentence that takes up a line to tell the patient nothing.
 */
export function scoreCoverage(result: HealthScore): string | null {
  if (result.score == null) return null;
  if (result.scoredCount >= result.scorableCount) return null;
  return `Based on ${result.scoredCount} of ${result.scorableCount} measures`;
}
