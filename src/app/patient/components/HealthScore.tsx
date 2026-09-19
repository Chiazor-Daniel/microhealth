import { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { patientTheme } from "../theme";
import { gradients, colors } from "../../../tokens";
import { SCORE_BAND_LABEL, type HealthScore, type ScoreBand } from "../../../metrics/healthScore";

/**
 * The health score ring.
 *
 * ## What it is doing here, given it was removed once
 *
 * An earlier version of this card had a ring and it was cut, for a good reason:
 * the score sits in a narrow, *high* band, so a healthy patient sees a nearly
 * closed circle almost every time, and at 100 it is a literal solid donut that
 * says nothing a plain number would not.
 *
 * Three things make it work now, and all three are load-bearing — remove any
 * one and it goes back to being decoration:
 *
 * **The track is visible.** Pale mint, not near-white. A ring is only a meter
 * if you can see the part that is *not* filled.
 *
 * **The delta carries the change.** The ring says where you are; `+2 from your
 * usual` says whether that is better or worse, which a full circle cannot.
 *
 * **It fills.** A ring that animates from empty communicates a *process*, so
 * the eye reads the arc travelling rather than a shape that is simply there.
 *
 * ## The gradient
 *
 * Deep green → fresh green → teal → turquoise, sweeping across the circle.
 * Four stops, not two: a straight green-to-teal interpolation passes through a
 * muddy grey-green, and the midpoint of the arc is where most of its visible
 * length sits.
 *
 * As the arc fills it reveals more of the gradient, which is what makes the
 * colour appear to travel along the stroke. There is no conic gradient in SVG,
 * so this is the honest way to get that effect rather than rotating a layer and
 * hoping it reads.
 */

const RING = {
  /** Stroke width as a fraction of the diameter. */
  stroke: 0.1,
  /** How long the arc takes to sweep, in seconds. */
  sweep: 1.15,
  /** How long the number takes to reach it, after the arc starts. */
  count: 1.0,
  /** The arc leads; the number follows it in. */
  delay: 0.15,
} as const;

/** A count-up that starts at zero and eases into the target. */
function useCountUp(target: number | null, durationMs: number, delayMs: number, skip: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target == null) return;
    if (skip) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      /* Cubic ease-out — the same shape as the arc, so the two land together
         rather than one snapping while the other is still moving. */
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const id = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      window.clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, delayMs, skip]);

  return target == null ? null : value;
}

export function ScoreRing({ result, size = 104 }: { result: HealthScore; size?: number }) {
  const reduce = useReducedMotion();
  const uid = useId();
  const gid = `mhScoreRing${uid.replace(/:/g, "")}`;

  const sw = size * RING.stroke;
  const r = (size - sw) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = result.score == null ? 0 : Math.max(0, Math.min(100, result.score)) / 100;

  const shown = useCountUp(
    result.score,
    RING.count * 1000,
    RING.delay * 1000,
    !!reduce
  );

  const stops = gradients.scoreRing.colors;
  const locs = gradients.scoreRing.locations ?? stops.map((_, i) => i / (stops.length - 1));

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          {/* userSpaceOnUse so the sweep spans the circle rather than each
              path's own bounding box — the latter would restart the gradient
              on the track and again on the arc. */}
          <linearGradient id={gid} x1={0} y1={size} x2={size} y2={0} gradientUnits="userSpaceOnUse">
            {stops.map((col, i) => (
              <stop key={col} offset={`${Math.round(locs[i] * 100)}%`} stopColor={col} />
            ))}
          </linearGradient>
        </defs>

        <circle cx={c} cy={c} r={r} fill="none" stroke={colors.scoreTrack} strokeWidth={sw} />

        <motion.circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={sw}
          strokeLinecap="round"
          /* SVG starts an arc at 3 o'clock; the ring reads from 12. */
          transform={`rotate(-90 ${c} ${c})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduce ? circumference * (1 - pct) : circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: RING.sweep, ease: [0.16, 1, 0.3, 1], delay: reduce ? 0 : RING.delay }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          style={{
            fontSize: size * 0.32,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: patientTheme.colors.textPrimary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {shown ?? "—"}
        </span>
        <span
          className="mt-0.5"
          style={{ fontSize: size * 0.095, fontWeight: 500, color: patientTheme.colors.textMuted }}
        >
          /100
        </span>
      </div>
    </div>
  );
}

/** The band as a chip — the verdict in words, beside the shape. */
export function ScoreBandChip({ band }: { band: ScoreBand | null }) {
  const tone =
    band === "good"
      ? { fg: patientTheme.colors.signalDeep, bg: "#DCEFDA" }
      : band === "fair"
        ? { fg: "#B45309", bg: "#F7E9CE" }
        : band === "attention"
          ? { fg: "#BE123C", bg: "#F7DADB" }
          : { fg: patientTheme.colors.textSecondary, bg: "#E9EEF2" };

  return (
    <span
      className="text-[11px] font-semibold whitespace-nowrap flex-shrink-0"
      style={{ color: tone.fg, background: tone.bg, borderRadius: 999, padding: "3px 10px" }}
    >
      {band ? SCORE_BAND_LABEL[band] : "No data"}
    </span>
  );
}

/**
 * How the score moved against the same window a day ago.
 *
 * Renders nothing when there is no prior reading. A delta is a claim about
 * change, and showing `0` because there was nothing to compare against would
 * be a quiet lie.
 *
 * ## The noise floor
 *
 * A one-point move on a 0–100 score is not a change, it is rounding — a
 * different reading a few seconds later lands there. Showing it as an amber
 * "↓1" beside "you're doing well" trains the patient to read alarm into
 * nothing, which is worse than showing no delta at all.
 *
 * So anything under two points reports as steady. That threshold is the reason
 * the arrow means something when it does appear.
 */
const NOISE_FLOOR = 2;

export function ScoreDelta({ delta }: { delta: number | null }) {
  if (delta == null) return null;

  const steady = Math.abs(delta) < NOISE_FLOOR;
  const up = delta > 0;
  const colour = steady
    ? patientTheme.colors.textMuted
    : up
      ? patientTheme.colors.signalDeep
      : "#B45309";

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[13px] font-bold" style={{ color: colour, fontVariantNumeric: "tabular-nums" }}>
        {steady ? "—" : `${up ? "↑" : "↓"} ${Math.abs(delta)}`}
      </span>
      <span className="text-[11.5px]" style={{ color: patientTheme.colors.textMuted }}>
        {steady ? "steady since yesterday" : "from your usual"}
      </span>
    </div>
  );
}

/**
 * What the score means, in words.
 *
 * The ring and the chip are both shorthand. This is the sentence a patient
 * would actually say to themselves, and it is the one line that does not need
 * decoding.
 */
export function scoreVerdict(
  result: HealthScore,
  delta?: number | null
): { line: string; sub: string } {
  if (result.score == null) {
    return { line: "Not enough readings yet.", sub: "Your score appears once we have a few." };
  }
  /* A capped score means one metric is holding the headline down, and saying
     "you're doing well" over the top of that would contradict the number. */
  if (result.limited && result.limiting) {
    const metric = result.limiting.metric.label;
    return { line: `${metric} is the one to watch.`, sub: "Everything else is steady." };
  }
  /* The verdict has to agree with the arrow beside it. "Keep it up" printed
     under an amber "↓2" is the card arguing with itself, and the patient
     resolves that by trusting neither. */
  const falling = delta != null && delta <= -NOISE_FLOOR;
  switch (result.band) {
    case "good":
      return falling
        ? { line: "You're doing well today.", sub: "Slightly down from yesterday." }
        : { line: "You're doing well today.", sub: "Keep it up." };
    case "fair":
      return { line: "Mostly steady today.", sub: "A couple of things to keep an eye on." };
    default:
      return { line: "A few measures need attention.", sub: "Your agent has flagged them." };
  }
}
