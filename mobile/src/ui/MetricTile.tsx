import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, semantic, spacing } from "@tokens";
import { font, linearGradient } from "@rn/theme";
import { GlyphIcon } from "@/icons";
import { Sparkline } from "./Sparkline";
import { card, iconTile, iconTileBorder, pillTone, tabular } from "./styles";
import type { MetricValue } from "@metrics/readings";

/**
 * The metric tile — one card, one anatomy, three sizes.
 *
 * The native twin of `src/app/patient/components/MetricTile.tsx`. Both read
 * the same registry and the same resolved values, so a metric has to look the
 * same on the two platforms; what differs is only how a card is laid out, and
 * React Native has no grid to lay it out with.
 *
 * The anatomy, always in this order:
 *
 *     [icon] label
 *     value unit ................... [status]
 *     parts
 *     chart / extra
 *
 * Three rules make it hold:
 *
 * **The label owns the header line.** Putting the status up there left the
 * label fighting it for a half-width tile, and a label truncated to "Blood
 * Pres…" does not name the metric.
 *
 * **Nothing renders at a size too small to carry it.** Parts and status are
 * dropped at `mini`; a night's four stages stacked one per line stretched that
 * tile to three times its neighbours and dragged the whole Today row with it.
 *
 * **Every tile stretches.** In a row, cards fill the tallest sibling rather
 * than floating in the middle of it.
 */

export type TileSize = "hero" | "tile" | "mini";

const SPEC: Record<
  TileSize,
  { pad: number; icon: number; disc: number; label: number; value: number; unit: number; spark: number; gap: number; chip: number }
> = {
  hero: { pad: 16, icon: 20, disc: 44, label: 13, value: 34, unit: 12.5, spark: 46, gap: 12, chip: 11 },
  tile: { pad: 13, icon: 16, disc: 34, label: 11.5, value: 22, unit: 11, spark: 32, gap: 9, chip: 10 },
  /** Today's rollups — three to a row, so only the essentials survive. */
  mini: { pad: 12, icon: 17, disc: 0, label: 10.5, value: 19, unit: 10, spark: 0, gap: 8, chip: 0 },
};

/**
 * The range state, in the metric's own words.
 *
 * Deliberately *not* `StatusBadge`. That component keys off a fixed vocabulary
 * and renders "Normal" for anything in range — right for an appointment, wrong
 * for a metric whose range is a target. Steps in range are not "Normal", they
 * are "Goal met", and only the registry knows that. So the wording comes from
 * the resolved value and only the colour is decided here.
 */
function RangeState({ status, label, size }: { status: MetricValue["status"]; label: string; size: number }) {
  const colour =
    status === "normal" ? semantic.signalDeep : status === "attention" ? pillTone.amber.fg : colors.error;
  return (
    <Text style={[{ fontSize: size, ...font(600), color: colour, letterSpacing: -0.005 * size }]} numberOfLines={1}>
      {label}
    </Text>
  );
}

/** A sub-reading, tinted by how it compares to its own band. */
function PartTag({ part }: { part: MetricValue["parts"][number] }) {
  const colour =
    part.status === "normal" ? semantic.textSecondary : part.status === "attention" ? pillTone.amber.fg : colors.error;
  return (
    <Text style={[styles.part, tabular]}>
      {part.label} <Text style={{ color: colour }}>{part.display}</Text>
    </Text>
  );
}

export function MetricTile({
  mv,
  size = "tile",
  series,
  extra,
  alwaysStatus = false,
  style,
  onPress,
}: {
  mv: MetricValue;
  size?: TileSize;
  series?: number[];
  /** Rendered in place of the chart — the heart-rate windows, for instance. */
  extra?: ReactNode;
  /** Draw the status even when it is normal. Vitals does; Home does not. */
  alwaysStatus?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const s = SPEC[size];
  const { metric } = mv;
  const compact = size === "mini";
  const showStatus = !compact && (alwaysStatus || mv.status !== "normal");
  const hasChart = !extra && !!series && series.length > 1 && s.spark > 0;
  const hasParts = !compact && mv.parts.length > 0 && mv.parts.some((p) => p.value != null);

  /* Sparkline needs a concrete width — it draws an SVG path, not a layout.
     Measuring the slot it was given is what keeps it correct at any tile
     width, which matters because the grid is 2-up on one screen and 3-up on
     another. */
  const [chartW, setChartW] = useState(0);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [card, styles.root, { padding: s.pad }, pressed && { opacity: 0.92 }, style]}
      accessibilityRole="button"
      accessibilityLabel={`${metric.label}, ${mv.display} ${mv.unit}, ${mv.statusText}`}
    >
      {/* Header — the label owns this line, so it always names the metric. */}
      <View style={styles.header}>
        {s.disc > 0 ? (
          <LinearGradient
            {...linearGradient("tile")}
            style={[iconTile, { width: s.disc, height: s.disc, borderColor: iconTileBorder.brand }]}
          >
            <GlyphIcon name={metric.icon} size={s.icon} color={semantic.brandDeep} />
          </LinearGradient>
        ) : (
          <GlyphIcon name={metric.icon} size={s.icon} color={semantic.brandDeep} />
        )}
        <Text style={[styles.label, { fontSize: s.label }]} numberOfLines={1}>
          {compact ? metric.short || metric.label : metric.label}
        </Text>
      </View>

      {/* Value, with the status at the far end of the same line. */}
      <View style={[styles.valueRow, { marginTop: s.gap }]}>
        <View style={styles.valueGroup}>
          <Text style={[styles.value, tabular, { fontSize: s.value }]} numberOfLines={1}>
            {mv.display}
          </Text>
          {!!mv.unit && <Text style={[styles.unit, { fontSize: s.unit }]}>{mv.unit}</Text>}
        </View>
        {showStatus && <RangeState status={mv.status} label={mv.statusText} size={s.chip} />}
      </View>

      {hasParts && (
        <View style={styles.parts}>
          {mv.parts
            .filter((p) => p.value != null)
            .map((p) => (
              <PartTag key={p.key} part={p} />
            ))}
        </View>
      )}

      {extra}

      {hasChart && (
        <View style={styles.chart} onLayout={(e) => setChartW(e.nativeEvent.layout.width)}>
          {chartW > 0 && (
            <Sparkline
              data={series!}
              width={chartW}
              height={s.spark}
              color={semantic.brand}
              dot={false}
              strokeWidth={2}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-start" },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { ...font(500), color: semantic.textPrimary, flex: 1, minWidth: 0 },
  valueRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  valueGroup: { flexDirection: "row", alignItems: "baseline", gap: 5, flexShrink: 1 },
  value: { ...font(700), color: semantic.textPrimary, letterSpacing: -0.035 * 22 },
  unit: { ...font(500), color: semantic.textSecondary },
  parts: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.sm, rowGap: 3, marginTop: 7 },
  part: { fontSize: 10.5, ...font(500), color: semantic.textMuted },
  chart: { marginTop: 4, marginHorizontal: -3 },
});
