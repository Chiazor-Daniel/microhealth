import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { semantic, spacing } from "@tokens";
import { font } from "@rn/theme";
import { SCORE_BAND_LABEL, SCORE_BANDS, type HealthScore, type ScoreBand } from "@metrics/healthScore";

/**
 * The health score — the native twin of the web component.
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
  good: { fg: semantic.signal, chip: "#DCEFDA" },
  fair: { fg: "#B45309", chip: "#F7E9CE" },
  attention: { fg: "#DC2626", chip: "#F7DADB" },
} as const;

function bandOf(score: number): ScoreBand {
  if (score >= SCORE_BANDS.good) return "good";
  if (score >= SCORE_BANDS.fair) return "fair";
  return "attention";
}

/** The marker's radius. The track is inset by it so the dot never overhangs. */
const DOT = 14;

/**
 * The band as a chip — the verdict in words.
 *
 * The scale shows *where* the score sits; this says what that means. Colour
 * alone would leave the patient to infer it, and the two colour-blind
 * conditions that matter most here are exactly the ones that make red and
 * green hard to tell apart.
 */
export function ScoreBandChip({ band }: { band: ScoreBand | null }) {
  const b = band ? BAND[band] : { fg: semantic.textSecondary, chip: "#E9EEF2" };
  return (
    <View style={[styles.chip, { backgroundColor: b.chip }]}>
      <Text style={[styles.chipLabel, { color: b.fg }]}>{band ? SCORE_BAND_LABEL[band] : "No data"}</Text>
    </View>
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
  const fg = pct == null ? semantic.textMuted : BAND[bandOf(pct)].fg;

  return (
    <View style={styles.scale}>
      <View style={styles.trackWrap}>
        <View style={styles.track}>
          <LinearGradient
            colors={[BAND.attention.fg, BAND.fair.fg, BAND.good.fg, BAND.good.fg]}
            locations={[0, SCORE_BANDS.fair / 100, SCORE_BANDS.good / 100, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, styles.trackFill]}
          />
          {/* Band thresholds. */}
          {[SCORE_BANDS.fair, SCORE_BANDS.good].map((t) => (
            <View key={t} style={[styles.tick, { left: `${t}%` }]} />
          ))}
        </View>
        {pct != null && (
          <View style={[styles.dot, { left: `${pct}%`, borderColor: fg }]} />
        )}
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>Needs attention</Text>
        <Text style={styles.scaleLabel}>Good</Text>
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

const styles = StyleSheet.create({
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipLabel: { fontSize: 11, ...font(600), letterSpacing: -0.005 * 11 },

  scale: { marginTop: spacing.sm },
  /* Inset by the dot's radius so the marker stays inside the bar at 0 and at
     100 rather than hanging off the end of it. */
  trackWrap: { height: DOT, marginHorizontal: DOT / 2, justifyContent: "center" },
  track: { height: 8, borderRadius: 999, overflow: "hidden" },
  trackFill: { borderRadius: 999, opacity: 0.3 },
  tick: { position: "absolute", top: 0, bottom: 0, width: 1.5, backgroundColor: "rgba(15,23,42,0.18)" },
  dot: {
    position: "absolute",
    width: DOT,
    height: DOT,
    marginLeft: -DOT / 2,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
  },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  scaleLabel: { fontSize: 10, ...font(500), color: semantic.textMuted },
});
