import { motion } from "motion/react";
import { patientTheme } from "../theme";
import { SCORE_BAND_LABEL, type HealthScore } from "../../../metrics/healthScore";

/**
 * The health score ring.
 *
 * The one place the leaf accent is allowed to be large. Everything else that
 * carries meaning wears the brand teal; this carries a *verdict*, so it wears
 * the signal colour — which is what stops the score reading as chrome.
 *
 * The number is drawn rather than counted up. A figure that animates from 0
 * to 82 reads as a slot machine on something a patient may be anxious about,
 * and it makes the value ambiguous for the second it is in flight.
 */
export function HealthScoreRing({ result, size = 104 }: { result: HealthScore; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = result.score == null ? 0 : Math.max(0, Math.min(100, result.score)) / 100;

  const band = result.band;
  const ring =
    band === "good" ? patientTheme.gradients.scoreRing
    : band === "fair" ? "linear-gradient(180deg, #F59E0B 0%, #D97706 100%)"
    : "linear-gradient(180deg, #EF4444 0%, #DC2626 100%)";
  /* SVG takes a paint server, not a CSS gradient string, so the ring is
     stroked with the band's flat colour and the gradient rides the number. */
  const strokeColor =
    band === "good" ? patientTheme.colors.signalBright
    : band === "fair" ? patientTheme.colors.warning
    : patientTheme.colors.error;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={patientTheme.colors.hairlineSoft}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          style={{
            fontSize: size * 0.3,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: patientTheme.colors.textPrimary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {result.score ?? "—"}
        </span>
        <span
          className="mt-1"
          style={{ fontSize: 10.5, fontWeight: 600, color: strokeColor }}
        >
          {band ? SCORE_BAND_LABEL[band] : "No data"}
        </span>
      </div>
      {/* The gradient is declared but only used by the label above on the
          web build; keeping it here documents the intended ramp. */}
      <span style={{ display: "none", background: ring }} />
    </div>
  );
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
  if (off === 0) return `All ${result.scoredCount} measures in range.`;
  if (off === 1) return "One measure is slightly outside your usual range.";
  return `${off} measures are slightly outside your usual range.`;
}
