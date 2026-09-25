import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { colors, gradients, semantic, spacing } from "@tokens";
import { font } from "@rn/theme";
import { SCORE_BAND_LABEL, limitingAdvice, type HealthScore, type ScoreBand } from "@metrics/healthScore";

/**
 * The health score ring — the native twin of the web component.
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
 * so this is the honest way to get that effect rather than rotating a layer
 * and hoping it reads.
 */

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING = {
  /** Stroke width as a fraction of the diameter. */
  stroke: 0.1,
  sweepMs: 1150,
  countMs: 1000,
  delayMs: 160,
} as const;

/**
 * A count-up that starts at zero and eases into the target.
 *
 * Runs on a plain interval rather than reanimated: the arc is what has to be
 * smooth and that is on the UI thread, but a number is text — reanimated
 * cannot drive `Text` children without another dependency, and crossing back
 * to JS every frame for a label nobody is watching frame-by-frame would cost
 * more than it buys. ~25 updates over the sweep is enough to read as counting.
 */
function useCountUp(target: number | null, durationMs: number, delayMs: number, skip: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target == null) return;
    if (skip) {
      setValue(target);
      return;
    }
    const started = { at: 0 };
    let timer: ReturnType<typeof setInterval> | null = null;
    const begin = setTimeout(() => {
      started.at = Date.now();
      timer = setInterval(() => {
        const p = Math.min(1, (Date.now() - started.at) / durationMs);
        /* Cubic ease-out — the same shape as the arc, so the two land
           together rather than one snapping while the other is still moving. */
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p >= 1 && timer) clearInterval(timer);
      }, 40);
    }, delayMs);
    return () => {
      clearTimeout(begin);
      if (timer) clearInterval(timer);
    };
  }, [target, durationMs, delayMs, skip]);

  return target == null ? null : value;
}

export function ScoreRing({ result, size = 104 }: { result: HealthScore; size?: number }) {
  const reduce = useReducedMotion();
  const sw = size * RING.stroke;
  const r = (size - sw) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = result.score == null ? 0 : Math.max(0, Math.min(100, result.score)) / 100;

  const shown = useCountUp(result.score, RING.countMs, RING.delayMs, !!reduce);

  const progress = useSharedValue(reduce ? pct : 0);
  useEffect(() => {
    progress.value = reduce
      ? pct
      : withDelay(RING.delayMs, withTiming(pct, { duration: RING.sweepMs, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  }, [pct, reduce, progress]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const stops = gradients.scoreRing.colors;
  const locs = gradients.scoreRing.locations ?? stops.map((_, i) => i / (stops.length - 1));

  return (
    /* The number is centred by the *parent*, and the SVG is absolutely
       positioned behind it. The first version had it the other way round — an
       absolutely-positioned overlay on top of an SVG in normal flow — and on
       device the text fell out of the ring entirely and landed below it.
       Centring with flexbox and taking the SVG out of flow cannot fail that
       way: the layout engine does the centring, not an offset. */
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg style={{ position: "absolute", top: 0, left: 0 }} width={size} height={size}>
        <Defs>
          {/* userSpaceOnUse so the sweep spans the circle rather than each
              path's own bounding box — the latter would restart the gradient
              on the track and again on the arc. */}
          <LinearGradient id="mhScoreRing" x1={0} y1={size} x2={size} y2={0} gradientUnits="userSpaceOnUse">
            {stops.map((col, i) => (
              <Stop key={col} offset={locs[i]} stopColor={col} />
            ))}
          </LinearGradient>
        </Defs>

        <Circle cx={c} cy={c} r={r} fill="none" stroke={colors.scoreTrack} strokeWidth={sw} />

        {/* SVG starts an arc at 3 o'clock; the ring reads from 12.
            Rotation goes on a wrapping <G> with an explicit transform string.
            The `rotation`/`origin` props on the shape itself did not apply on
            device — the arc swept from 3 o'clock, which is what made it read
            as a "C" opening sideways rather than a ring filling from the top. */}
        <G transform={`rotate(-90 ${c} ${c})`}>
          <AnimatedCircle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="url(#mhScoreRing)"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={arcProps}
          />
        </G>
      </Svg>

      <Text style={[styles.valueText, { fontSize: size * 0.32 }]}>{shown ?? "—"}</Text>
      <Text style={[styles.denom, { fontSize: size * 0.095 }]}>/100</Text>
    </View>
  );
}

/** The band as a chip — the verdict in words, beside the shape. */
export function ScoreBandChip({ band }: { band: ScoreBand | null }) {
  const tone =
    band === "good"
      ? { fg: semantic.signalDeep, bg: "#DCEFDA" }
      : band === "fair"
        ? { fg: "#B45309", bg: "#F7E9CE" }
        : band === "attention"
          ? { fg: "#BE123C", bg: "#F7DADB" }
          : { fg: semantic.textSecondary, bg: "#E9EEF2" };

  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }]}>
      <Text style={[styles.chipLabel, { color: tone.fg }]}>{band ? SCORE_BAND_LABEL[band] : "No data"}</Text>
    </View>
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
  const colour = steady ? semantic.textMuted : up ? semantic.signalDeep : "#B45309";

  return (
    <View style={styles.deltaRow}>
      <Text style={[styles.deltaValue, { color: colour }]}>
        {steady ? "—" : `${up ? "↑" : "↓"} ${Math.abs(delta)}`}
      </Text>
      <Text style={styles.deltaCaption}>{steady ? "steady since yesterday" : "from your usual"}</Text>
    </View>
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
  delta?: number | null,
  name?: string
): { line: string; sub: string } {
  /* Third-person mode for family screens: "Ngozi is doing well today."
     Home keeps calling without a name and reads exactly as before. */
  const you = (s: string) =>
    name ? s.replace(/^You're\b/, `${name} is`).replace(/^Your\b/, `${name}'s`) : s;
  if (result.score == null) {
    return { line: you("Not enough readings yet."), sub: name ? `${name}'s score appears once we have a few.` : "Your score appears once we have a few." };
  }
  /* A capped score means one metric is holding the headline down, and saying
     "you're doing well" over the top of that would contradict the number. */
  if (result.limited && result.limiting) {
    return limitingAdvice(result.limiting.metric.key, result.limiting.metric.label);
  }
  /* The verdict has to agree with the arrow beside it. "Keep it up" printed
     under an amber "↓2" is the card arguing with itself, and the patient
     resolves that by trusting neither. */
  const falling = delta != null && delta <= -NOISE_FLOOR;
  switch (result.band) {
    case "good":
      return falling
        ? { line: you("You're doing well today."), sub: "Slightly down from yesterday." }
        : { line: you("You're doing well today."), sub: "Keep it up." };
    case "fair":
      return { line: you("Mostly steady today."), sub: "A couple of things to keep an eye on." };
    default:
      return { line: you("A few measures need attention."), sub: name ? `${name}'s agent has flagged them.` : "Your agent has flagged them." };
  }
}

const styles = StyleSheet.create({
  centre: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  valueText: { ...font(700), color: semantic.textPrimary, letterSpacing: -0.05 * 33, includeFontPadding: false },
  denom: { ...font(500), color: semantic.textMuted, marginTop: 1 },

  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipLabel: { fontSize: 11, ...font(600), letterSpacing: -0.005 * 11 },

  deltaRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  deltaValue: { fontSize: 13, ...font(700) },
  deltaCaption: { fontSize: 11.5, ...font(400), color: semantic.textMuted },
});
