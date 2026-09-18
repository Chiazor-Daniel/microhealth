import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { colors, semantic, spacing } from "@tokens";
import { font, text } from "@rn/theme";
import { SCORE_BAND_LABEL, SCORE_BANDS, type HealthScore, type ScoreBand } from "@metrics/healthScore";

/**
 * The health score ring — the native twin of the web component.
 *
 * The one place the leaf accent is allowed to be large. Everything else that
 * carries meaning wears the brand teal; this carries a *verdict*, so it wears
 * the signal colour, which is what stops the score reading as chrome.
 *
 * Three things are deliberate, and all three were learned from the web version
 * getting them wrong first:
 *
 * **The track is visible.** A ring is only a meter if you can see the part
 * that is *not* filled. A near-white track on a white card made every score
 * above ~95 look identical — which is most of the scores a healthy patient
 * gets.
 *
 * **The band label lives outside.** Inside, it competed with the number and
 * squeezed both.
 *
 * **The number is sized off the ring**, so the two scale together.
 *
 * The arc is drawn without animation. The web version animates its dash offset,
 * but on native that means driving an animated prop through reanimated for a
 * decoration — and a score that counts up reads as a slot machine on something
 * a patient may be anxious about.
 */

const ARC: Record<ScoreBand, { stroke: string; track: string }> = {
  good: { stroke: colors.leaf500, track: "#DCEFDA" },
  fair: { stroke: colors.warning, track: "#F7E9CE" },
  attention: { stroke: colors.error, track: "#F7DADB" },
};

export function arcFor(band: ScoreBand | null) {
  return band ? ARC[band] : { stroke: colors.inkMuted, track: "#E9EEF2" };
}

export function bandOf(score: number): ScoreBand {
  if (score >= SCORE_BANDS.good) return "good";
  if (score >= SCORE_BANDS.fair) return "fair";
  return "attention";
}

export function HealthScoreRing({ result, size = 96 }: { result: HealthScore; size?: number }) {
  const stroke = size * 0.098;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = result.score == null ? 0 : Math.max(0, Math.min(100, result.score)) / 100;
  const arc = arcFor(result.band);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* SVG starts its arc at 3 o'clock; the ring reads from 12. */}
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={arc.track} strokeWidth={stroke} />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={arc.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - pct)}
          />
        </G>
      </Svg>
      <View style={styles.centre} pointerEvents="none">
        <Text style={[styles.value, { fontSize: size * 0.36 }]}>{result.score ?? "—"}</Text>
      </View>
    </View>
  );
}

/** The band as a chip — the label the ring deliberately no longer carries. */
export function ScoreBandChip({ band }: { band: ScoreBand | null }) {
  const arc = arcFor(band);
  return (
    <View style={[styles.chip, { backgroundColor: arc.track }]}>
      <Text style={[styles.chipLabel, { color: arc.stroke }]}>{band ? SCORE_BAND_LABEL[band] : "No data"}</Text>
    </View>
  );
}

/**
 * Where the score sits on its own scale.
 *
 * A ring answers "how full", which at the scores most patients see is almost
 * always "nearly" — it cannot distinguish 88 from 97. This can: the marker's
 * position against the two band thresholds is the whole reading, and the
 * thresholds come from the same constants the scorer uses, so the scale and
 * the verdict cannot disagree.
 */
export function ScoreScale({ score }: { score: number | null }) {
  const pct = score == null ? null : Math.max(0, Math.min(100, score));
  const arc = arcFor(pct == null ? null : bandOf(pct));

  return (
    <View style={styles.scale}>
      <View style={styles.scaleTrack}>
        <LinearGradient
          colors={[ARC.attention.stroke, ARC.fair.stroke, ARC.good.stroke, ARC.good.stroke]}
          locations={[0, SCORE_BANDS.fair / 100, SCORE_BANDS.good / 100, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, styles.scaleFill]}
        />
        {pct != null && (
          <View style={[styles.marker, { left: `${pct}%`, borderColor: arc.stroke }]} />
        )}
      </View>
      <View style={styles.scaleLabels}>
        {(["attention", "fair", "good"] as const).map((b) => (
          <Text key={b} style={styles.scaleLabel}>
            {SCORE_BAND_LABEL[b]}
          </Text>
        ))}
      </View>
    </View>
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


const styles = StyleSheet.create({
  centre: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  value: { ...font(700), color: semantic.textPrimary, letterSpacing: -0.05 * 40, includeFontPadding: false },
  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipLabel: { fontSize: 10.5, ...font(600), letterSpacing: -0.005 * 10.5 },

  scale: { marginTop: spacing.sm },
  scaleTrack: { height: 6, borderRadius: 999, overflow: "visible", backgroundColor: "#E9EEF2" },
  scaleFill: { borderRadius: 999, opacity: 0.28 },
  marker: {
    position: "absolute",
    top: -3,
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 2.5,
  },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  scaleLabel: { fontSize: 10, ...font(500), color: semantic.textMuted },
});
