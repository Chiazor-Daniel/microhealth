import { useMemo, useState, type ReactElement } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, semantic, spacing, type GradientName } from "@tokens";
import { linearGradient, font } from "@rn/theme";
import { useInsights } from "@app/patient/hooks/useInsights";

import { Screen } from "@/ui/Screen";
import { Reveal, TapScale } from "@/ui/motion";
import { SegmentedTabs } from "@/ui/SegmentedTabs";
import { buttonPrimary, card, iconTile, iconTileBorder } from "@/ui/styles";
import {
  CalendarIcon,
  CapsuleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DropletIcon,
  FlaskIcon,
  HeartIcon,
  InsightMarkIcon,
  SparkIcon,
  TrendIcon,
  WatchIcon,
  type GlyphProps,
} from "@/icons";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];

const WINDOW_DAYS: Record<string, number> = { today: 1, week: 7, month: 30 };

type Visual = { Icon: (p: GlyphProps) => ReactElement; fg: string; tile: GradientName; tone: string };

/**
 * The web writes each of these as a two-stop CSS gradient; the token beside it
 * is the same gradient with its middle stop filled in, and `tone` is the border
 * its icon container takes.
 */
const TILES = {
  green: { fg: semantic.accentDeep, tile: "tile", tone: "green" },
  rose: { fg: colors.rose, tile: "tileRose", tone: "rose" },
  amber: { fg: colors.amber, tile: "tileAmber", tone: "amber" },
  blue: { fg: colors.blue, tile: "tileBlue", tone: "blue" },
  teal: { fg: colors.teal, tile: "tileTeal", tone: "teal" },
} as const satisfies Record<string, Omit<Visual, "Icon">>;

/**
 * Icon + tint per insight. The design system fixes these pairs, so a
 * hydration reminder is amber and a sleep note is blue wherever they appear —
 * the tint is how the list is read at a glance.
 */
function visualFor(type: string, title: string): Visual {
  const t = `${type} ${title}`.toLowerCase();
  if (t.includes("hydrat") || t.includes("water") || t.includes("fluid")) return { Icon: DropletIcon, ...TILES.amber };
  if (t.includes("sleep") || t.includes("rest")) return { Icon: SparkIcon, ...TILES.blue };
  if (t.includes("medic") || t.includes("dose") || t.includes("prescription")) return { Icon: CapsuleIcon, ...TILES.green };
  if (t.includes("appointment")) return { Icon: CalendarIcon, ...TILES.green };
  if (t.includes("lab") || t.includes("result")) return { Icon: FlaskIcon, ...TILES.green };
  if (t.includes("heart") || t.includes("recovery")) return { Icon: HeartIcon, ...TILES.rose };
  switch (type) {
    case "trend":
      return { Icon: TrendIcon, ...TILES.green };
    case "lab":
      return { Icon: FlaskIcon, ...TILES.green };
    case "recovery":
      return { Icon: HeartIcon, ...TILES.rose };
    case "medication":
    case "appointment":
      return { Icon: CapsuleIcon, ...TILES.green };
    case "wearable":
      return { Icon: WatchIcon, ...TILES.amber };
    default:
      return { Icon: SparkIcon, ...TILES.green };
  }
}

/**
 * The web keeps this one local to the insights page rather than using the
 * shared helper: a dense list of findings says "5m ago" where the rest of the
 * app says "5 min ago", and every character here is worth keeping short.
 */
function relativeTime(iso?: string) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 2) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Insights() {
  const router = useRouter();
  const { insights, loading } = useInsights();
  const [range, setRange] = useState<RangeValue>("today");

  const filtered = useMemo(() => {
    const cutoff = Date.now() - WINDOW_DAYS[range] * 24 * 60 * 60 * 1000;
    const inWindow = insights.filter((i) => new Date(i.createdAt).getTime() >= cutoff);

    /* The agent can emit the same finding more than once; collapse to the
       newest per title so the list reads as distinct findings. */
    const byTitle = new Map<string, (typeof inWindow)[number]>();
    for (const i of inWindow) {
      const key = i.title.trim().toLowerCase();
      const existing = byTitle.get(key);
      if (!existing || new Date(i.createdAt) > new Date(existing.createdAt)) {
        byTitle.set(key, i);
      }
    }
    return [...byTitle.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [insights, range]);

  const featured =
    filtered.find((i) => i.priority === "watch" || i.priority === "attention" || i.priority === "urgent") ?? filtered[0];
  const others = filtered.filter((i) => i.id !== featured?.id);

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green600} />
        </View>
      </Screen>
    );
  }

  const featuredVisual = featured ? visualFor(featured.type as string, featured.title) : null;

  return (
    <Screen>
      {/* Header — bare chevron, the title on the axis */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/home")} accessibilityLabel="Back" style={styles.headerBack}>
          <ChevronLeftIcon size={22} color={semantic.textPrimary} />
        </Pressable>
        <Text style={styles.title}>AI Insights</Text>
      </View>

      <View style={styles.block}>
        <SegmentedTabs
          options={RANGES as unknown as { value: RangeValue; label: string }[]}
          value={range}
          onChange={setRange}
          fill
        />
      </View>

      {filtered.length === 0 ? (
        <View style={[card, styles.empty]}>
          <LinearGradient
            {...linearGradient("tile")}
            style={[iconTile, { width: 52, height: 52, borderColor: iconTileBorder.green }]}
          >
            <SparkIcon size={24} color={semantic.accentDeep} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Nothing to report</Text>
          <Text style={styles.emptyBody}>Your readings look steady in this period.</Text>
        </View>
      ) : (
        <>
          {/* The strongest current signal, given the room to explain itself */}
          {featured && featuredVisual ? (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Health Trend</Text>
              <View style={[card, styles.featuredCard]}>
                <View style={styles.featuredTop}>
                  {/* The featured mark is the agent's own, not a metric tile — it
                      sits above the metric glyphs in the hierarchy. */}
                  <View style={styles.featuredMark}>
                    <InsightMarkIcon size={40} color={semantic.textPrimary} />
                  </View>
                  <View style={styles.featuredBody}>
                    <Text style={styles.featuredTitle}>{featured.title}</Text>
                    <Text style={styles.featuredMessage}>{featured.message}</Text>
                    <Text style={styles.featuredTime}>{relativeTime(featured.createdAt)}</Text>
                  </View>
                </View>

                <Pressable onPress={() => router.push("/ai")}>
                  <LinearGradient {...linearGradient("buttonPrimary")} style={[buttonPrimary, styles.cta]}>
                    <Text style={styles.ctaLabel}>View details</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ) : null}

          {others.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Other Insights</Text>
              <View style={styles.rows}>
                {others.map((ins, i) => {
                  const v = visualFor(ins.type as string, ins.title);
                  return (
                    <Reveal key={ins.id} index={i}>
                    <TapScale
                      onPress={() => router.push("/ai")}
                      accessibilityLabel={`${ins.title}. ${ins.message}`}
                    >
                      <View style={[card, styles.row]}>
                        <LinearGradient
                          {...linearGradient(v.tile)}
                          style={[iconTile, { width: 40, height: 40, borderColor: iconTileBorder[v.tone] }]}
                        >
                          <v.Icon size={19} color={v.fg} />
                        </LinearGradient>
                        <View style={styles.rowBody}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {ins.title}
                          </Text>
                          <Text style={styles.rowMessage} numberOfLines={1}>
                            {ins.message}
                          </Text>
                        </View>
                        <ChevronRightIcon size={16} color={semantic.textMuted} />
                      </View>
                    </TapScale>
                    </Reveal>
                  );
                })}
              </View>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center" },

  header: { height: 36, alignItems: "center", justifyContent: "center" },
  headerBack: {
    position: "absolute",
    left: -8,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, ...font(600), lineHeight: 25.5, letterSpacing: -0.02 * 17, color: semantic.textPrimary },

  block: { marginTop: spacing.blockGap },
  sectionTitle: {
    fontSize: 15,
    ...font(600),
    lineHeight: 22.5,
    letterSpacing: -0.01 * 15,
    color: semantic.textPrimary,
    marginBottom: spacing.sm,
  },

  empty: { paddingVertical: 56, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center", marginTop: spacing.blockGap },
  emptyTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary, marginTop: 14 },
  emptyBody: { fontSize: 13, lineHeight: 19.5, color: semantic.textMuted, marginTop: 4, textAlign: "center" },

  featuredCard: { padding: spacing.cardPadding },
  featuredTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  featuredMark: { width: 42, height: 42, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  featuredBody: { flex: 1 },
  featuredTitle: { fontSize: 15.5, ...font(600), lineHeight: 21.3, letterSpacing: -0.01 * 15.5, color: semantic.textPrimary },
  featuredMessage: { fontSize: 13, lineHeight: 21.1, color: semantic.textSecondary, marginTop: 6 },
  featuredTime: { fontSize: 11.5, lineHeight: 17.25, color: semantic.textMuted, marginTop: spacing.xs },
  cta: { marginTop: spacing.md, paddingVertical: 10, alignItems: "center" },
  ctaLabel: { fontSize: 13, ...font(600), lineHeight: 19.5, color: colors.onGreen },

  rows: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: 14 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 13.5, ...font(600), lineHeight: 20.25, color: semantic.textPrimary },
  rowMessage: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textSecondary, marginTop: 2 },
});
