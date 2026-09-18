import { motion } from "motion/react";
import { patientTheme } from "../theme";
import { SCORE_BAND_LABEL, SCORE_BANDS, type HealthScore, type ScoreBand } from "../../../metrics/healthScore";

/**
 * The health score ring.
 *
 * The one place the leaf accent is allowed to be large. Everything else that
 * carries meaning wears the brand teal; this carries a *verdict*, so it wears
 * the signal colour — which is what stops the score reading as chrome.
 *
 * ## Why it looks like this
 *
 * The first version was a ring with the number and the band label stacked
 * inside it. It read as a closed green donut with two competing labels in the
 * middle, and at the scores a healthy person actually gets — the high
 * nineties — the arc closed on itself and showed nothing at all.
 *
 * Three changes fix that:
 *
 * **The track is visible.** A ring is only a meter if you can see the part
 * that is *not* filled. A near-white track on a white card made every score
 * above ~95 look identical.
 *
 * **The band label moved out.** Inside, it competed with the number and
 * squeezed both. Outside, beside the title, each has room.
 *
 * **The number is the ring.** It is sized off the ring's diameter rather than
 * a fixed value, so the two always scale together.
 *
 * The number is drawn rather than counted up. A figure animating from 0 to 82
 * reads as a slot machine on something a patient may be anxious about, and it
 * makes the value ambiguous for the second it is in flight.
 */

const ARC = {
  good: { stroke: patientTheme.colors.signalBright, track: "#DCEFDA" },
  fair: { stroke: patientTheme.colors.warning, track: "#F7E9CE" },
  attention: { stroke: patientTheme.colors.error, track: "#F7DADB" },
} as const;

function arcFor(band: ScoreBand | null) {
  return band ? ARC[band] : { stroke: patientTheme.colors.textMuted, track: "#E9EEF2" };
}

export function HealthScoreRing({ result, size = 96 }: { result: HealthScore; size?: number }) {
  const stroke = size * 0.098;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = result.score == null ? 0 : Math.max(0, Math.min(100, result.score)) / 100;
  const arc = arcFor(result.band);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={arc.track}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={arc.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          style={{
            fontSize: size * 0.36,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: patientTheme.colors.textPrimary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {result.score ?? "—"}
        </span>
      </div>
    </div>
  );
}

/** The band as a chip — the label the ring deliberately no longer carries. */
export function ScoreBandChip({ band }: { band: ScoreBand | null }) {
  const arc = arcFor(band);
  return (
    <span
      className="text-[10.5px] font-semibold whitespace-nowrap flex-shrink-0"
      style={{
        color: arc.stroke,
        background: arc.track,
        borderRadius: 999,
        padding: "3px 9px",
        letterSpacing: "-0.005em",
      }}
    >
      {band ? SCORE_BAND_LABEL[band] : "No data"}
    </span>
  );
}

/**
 * Where the score sits on its own scale.
 *
 * A ring answers "how full", which at the high scores most patients see is
 * almost always "nearly" — it cannot distinguish 88 from 97. This can: the
 * marker's position against the two band thresholds is the whole reading, and
 * the thresholds are drawn from the same constants the scorer uses, so the
 * scale and the verdict cannot disagree.
 */
export function ScoreScale({ score }: { score: number | null }) {
  const pct = score == null ? null : Math.max(0, Math.min(100, score));
  return (
    <div className="mt-3">
      <div className="relative" style={{ height: 6, borderRadius: 999, overflow: "visible" }}>
        {/* The graded track: red to amber to leaf, in the band proportions. */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: 999,
            background: `linear-gradient(90deg, ${ARC.attention.stroke} 0%, ${ARC.fair.stroke} ${SCORE_BANDS.fair}%, ${ARC.good.stroke} ${SCORE_BANDS.good}%, ${ARC.good.stroke} 100%)`,
            opacity: 0.28,
          }}
        />
        {pct != null && (
          <motion.span
            className="absolute"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: `${pct}%`, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              top: -3,
              width: 12,
              height: 12,
              marginLeft: -6,
              borderRadius: 999,
              background: "#FFFFFF",
              border: `2.5px solid ${arcFor(scoreBandFrom(pct)).stroke}`,
              boxShadow: "0 1px 3px rgba(16,24,40,0.18)",
            }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1.5">
        {(["attention", "fair", "good"] as const).map((b) => (
          <span key={b} className="text-[10px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
            {SCORE_BAND_LABEL[b]}
          </span>
        ))}
      </div>
    </div>
  );
}

function scoreBandFrom(score: number): ScoreBand {
  if (score >= SCORE_BANDS.good) return "good";
  if (score >= SCORE_BANDS.fair) return "fair";
  return "attention";
}

/**
 * What is holding the score down, said plainly.
 *
 * The score is a summary, and a summary that will not say what it is
 * summarising invites the patient to guess. When the worst-metric cap bound,
 * this is the sentence that explains the number.
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
