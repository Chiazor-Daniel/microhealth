import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, semantic, spacing } from "@tokens";
import { font, linearGradient } from "@rn/theme";
import { GlyphIcon } from "@/icons";
import { Sparkline, sparkDomain } from "./Sparkline";
import { card, iconBrand, iconTile, iconTileBorder, pillTone, tabular } from "./styles";
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

/**
 * Below this width, half-width tiles run out of room for a full metric name.
 *
 * At 320px a two-up tile leaves about 66px for its label, and "Triglycerides"
 * cannot wrap — it is one word — so it would be clipped mid-word. The registry
 * already carries a short name for exactly this, and a small screen is where
 * it earns its place.
 */
const NARROW = 360;

const SPEC: Record<
  TileSize,
  { pad: number; icon: number; disc: number; label: number; value: number; unit: number; spark: number; gap: number; chip: number; headGap: number }
> = {
  /* Matched to web's Home hero, which is a bespoke element rather than a
     MetricTile: 40px disc, 40px value, a 72px chart, and a 10px header gap.
     These were 44/34/46/8 — close enough to look like a rendering difference
     rather than a design one, which is the worst kind of drift. */
  hero: { pad: 16, icon: 20, disc: 40, label: 13, value: 40, unit: 13, spark: 72, gap: 8, chip: 11, headGap: 10 },
  tile: { pad: 13, icon: 16, disc: 34, label: 11.5, value: 22, unit: 11, spark: 32, gap: 9, chip: 10, headGap: 8 },
  /** Today's rollups — three to a row, so only the essentials survive. */
  mini: { pad: 12, icon: 17, disc: 0, label: 10.5, value: 19, unit: 10, spark: 0, gap: 8, chip: 0, headGap: 8 },
};

/**
 * The header on a genuinely small screen.
 *
 * A three-up row at 320px leaves a mini tile ~33px for its label after the
 * glyph and the gap, and "Energy" needs 35 — it clipped by two pixels, with no
 * second line to take, because it is a single word.
 *
 * The label cannot give here. `Energy` is already the registry's `short` for a
 * metric whose full name is longer, so there is no shorter word to fall back
 * to, and a metric name that stops mid-word ("Energ") fails the one job this
 * row has. The glyph can give: it is decoration at this size — the label is
 * what names the tile — and a 14px mark still reads where 17px did. Closing
 * the gap costs nothing either; 8px was tuned for a 34px disc that `mini` does
 * not have.
 *
 * So the six reclaimed pixels come out of the icon, not the word.
 */
const MINI_NARROW = { icon: 14, headGap: 5 } as const;

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
  const { width } = useWindowDimensions();
  const narrow = width < NARROW;
  const { metric } = mv;
  const compact = size === "mini";
  const s = compact && narrow ? { ...SPEC.mini, ...MINI_NARROW } : SPEC[size];
  /* The hero always has room for the full name; a cramped tile does not. */
  const label = (compact || (narrow && size === "tile")) && metric.short ? metric.short : metric.label;
  const showStatus = !compact && (alwaysStatus || mv.status !== "normal");
  const hasChart = !extra && !!series && series.length > 1 && s.spark > 0;
  const hasParts = !compact && mv.parts.length > 0 && mv.parts.some((p) => p.value != null);

  /* Sparkline needs a concrete width — it draws an SVG path, not a layout.
     Measuring the slot it was given is what keeps it correct at any tile
     width, which matters because the grid is 2-up on one screen and 3-up on
     another. */
  const [chartW, setChartW] = useState(0);
  const heroDomain = size === "hero" && hasChart ? sparkDomain(series!) : ([0, 0] as [number, number]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        card,
        styles.root,
        { padding: s.pad },
        /* The hero clips so the wash below can fill the rounded corners. */
        size === "hero" && { overflow: "hidden" },
        pressed && { opacity: 0.92 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${metric.label}, ${mv.display} ${mv.unit}, ${mv.statusText}`}
    >
      {/* The hero's ground.

          Web draws this as `background: gradients.wash` on the card itself. RN
          has no gradient background, so it goes on a filled layer behind the
          content — same stops, same angle, same pale teal. Without it the hero
          was the one card on Home still sitting on plain white while every
          other feature panel had a tinted ground, which made it read as a
          different, flatter kind of card than it is. */}
      {size === "hero" && (
        <LinearGradient
          {...linearGradient("wash")}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.card }]}
          pointerEvents="none"
        />
      )}

      {/* Header — the label owns this line, so it always names the metric. */}
      <View style={[styles.header, { gap: s.headGap }]}>
        {size === "hero" ? (
          /* The hero inverts the mark: a solid brand disc carrying a white
             glyph, rather than the tinted tile the smaller cards use. This is
             `.mh-icon-brand` — the same element as web's hero. */
          <LinearGradient
            {...linearGradient("brandSolid")}
            style={[iconBrand, { width: s.disc, height: s.disc }]}
          >
            <GlyphIcon name={metric.icon} size={s.icon} color={colors.onGreen} />
          </LinearGradient>
        ) : s.disc > 0 ? (
          <LinearGradient
            {...linearGradient("tile")}
            style={[iconTile, { width: s.disc, height: s.disc, borderColor: iconTileBorder.brand }]}
          >
            <GlyphIcon name={metric.icon} size={s.icon} color={semantic.brandDeep} />
          </LinearGradient>
        ) : (
          <GlyphIcon name={metric.icon} size={s.icon} color={semantic.brandDeep} />
        )}
        {/* Two lines, not one. A truncated label stops naming the metric —
            "Blood O…" is worse than a label that takes a second line, and on a
            narrow phone the half-width tiles cannot fit "Blood Oxygen" on one
            line at any size. It only wraps when it has to. */}
        <Text style={[styles.label, { fontSize: s.label, lineHeight: Math.round(s.label * 1.25) }]} numberOfLines={2}>
          {label}
        </Text>
      </View>

      {/* Value, with the status at the far end of the same line.
          The row wraps: a narrow tile cannot hold "122/75" + "mmHg" +
          "Elevated" on one line, and without wrapping they simply overprinted
          each other. The status keeps `marginLeft: auto` so it stays
          right-aligned whether it lands beside the value or below it. */}
      <View style={[styles.valueRow, { marginTop: s.gap }]}>
        <View style={styles.valueGroup}>
          <Text style={[styles.value, tabular, { fontSize: s.value }]} numberOfLines={1}>
            {mv.display}
          </Text>
          {!!mv.unit && <Text style={[styles.unit, { fontSize: s.unit }]}>{mv.unit}</Text>}
        </View>
        {showStatus && (
          <View style={styles.statusSlot}>
            <RangeState status={mv.status} label={mv.statusText} size={s.chip} />
          </View>
        )}
      </View>

      {/* The band the reading should sit in — the hero's own line, exactly as
          web prints it. Only the hero has the width to spare for it. */}
      {size === "hero" && (
        <Text style={styles.heroRange}>
          Normal range: {metric.band.low} – {metric.band.high}
        </Text>
      )}

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
        /* The hero carries a value gutter: the spark is scaled to the series'
           own range, so without the two numbers the shape says "something
           moved" but not by how much. Web draws the same 26px column beside
           the line, max at the top and min at the bottom. */
        (size === "hero" ? (
          <View style={styles.heroChartRow}>
            <View style={styles.heroAxis}>
              <Text style={styles.heroAxisLabel}>{heroDomain[1]}</Text>
              <Text style={styles.heroAxisLabel}>{heroDomain[0]}</Text>
            </View>
            <View style={styles.heroChart} onLayout={(e) => setChartW(e.nativeEvent.layout.width)}>
              {chartW > 0 && (
                <Sparkline data={series!} width={chartW} height={s.spark} color={semantic.brand} dot={false} strokeWidth={2} />
              )}
            </View>
          </View>
        ) : (
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
        ))
      )}    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-start" },
  header: { flexDirection: "row", alignItems: "center" },
  label: { ...font(500), color: semantic.textPrimary, flex: 1, minWidth: 0 },
  valueRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", columnGap: 8, rowGap: 2 },
  /* The number never breaks — "116/74" is one token. The unit does, dropping
     to a second line when the tile is too narrow for both. */
  valueGroup: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: 5, rowGap: 0 },
  statusSlot: { marginLeft: "auto" },
  value: { ...font(700), color: semantic.textPrimary, letterSpacing: -0.035 * 22 },
  unit: { ...font(500), color: semantic.textSecondary },
  parts: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.sm, rowGap: 3, marginTop: 7 },
  part: { fontSize: 10.5, ...font(500), color: semantic.textMuted },
  chart: { marginTop: 4, marginHorizontal: -3 },
  heroRange: { fontSize: 12, ...font(500), color: semantic.textSecondary, marginTop: 6 },
  heroChartRow: { flexDirection: "row", alignItems: "stretch", marginTop: 4, marginHorizontal: -3 },
  /* The value gutter. 26px on web; the labels are the series' own rounded
     extremes, which is what makes the shape legible as a magnitude. */
  heroAxis: { width: 26, justifyContent: "space-between", paddingVertical: 6 },
  heroAxisLabel: { fontSize: 10, ...font(500), color: semantic.textMuted },
  heroChart: { flex: 1, minWidth: 0 },
});
