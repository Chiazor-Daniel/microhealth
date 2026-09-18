import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";
import { useInsights } from "@app/patient/hooks/useInsights";

import { Screen } from "@/ui/Screen";
import { Reveal, TapScale } from "@/ui/motion";
import { SegmentedTabs } from "@/ui/SegmentedTabs";
import { ErrorState } from "@/ui/ErrorState";
import { card, iconTile } from "@/ui/styles";
import {
  BellIcon,
  CapsuleIcon,
  CheckAllIcon,
  ChevronLeftIcon,
  DropletIcon,
  FlaskIcon,
  HeartIcon,
  PersonFilledIcon,
  SparkIcon,
  WatchIcon,
  type GlyphProps,
} from "@/icons";

type Filter = "all" | "health" | "appointments" | "system";

const TABS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "health", label: "Health" },
  { value: "appointments", label: "Appointments" },
  { value: "system", label: "System" },
];

/** Which filter each insight type belongs to. */
const GROUP: Record<string, Exclude<Filter, "all">> = {
  vital_trend: "health",
  vital_recovery: "health",
  lab_result: "health",
  appointment_reminder: "appointments",
  medication_due: "system",
  wearable_offline: "system",
  system: "system",
};

const ICONS: Record<string, (p: GlyphProps) => React.ReactElement> = {
  vital_trend: HeartIcon,
  vital_recovery: HeartIcon,
  lab_result: FlaskIcon,
  appointment_reminder: PersonFilledIcon,
  medication_due: CapsuleIcon,
  wearable_offline: WatchIcon,
  system: SparkIcon,
};

/** Hydration is called out in blue by the design system; everything else
    sits on the category tint. */
const HYDRATION = /hydrat|water|fluid/i;

function iconFor(type: string, title: string) {
  if (HYDRATION.test(title)) return { Icon: DropletIcon, key: "hydration" as const };
  return { Icon: ICONS[type] ?? BellIcon, key: (GROUP[type] ?? "system") as keyof typeof TINTS };
}

/**
 * Each category carries its own tint, so the feed is scannable by colour.
 *
 * The tile a category sits on is one of the shared tile gradients rather than
 * a colour of its own — the icon container keeps the design system's default
 * border the way the web feed's plain `.mh-icon` does.
 */
const TINTS = {
  health: { fg: colors.rose, gradient: "tileRose" as const },
  appointments: { fg: semantic.accentDeep, gradient: "tile" as const },
  system: { fg: semantic.accentDeep, gradient: "tile" as const },
  hydration: { fg: colors.blue, gradient: "tileBlue" as const },
};

function timeLabel(iso?: string) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 2) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Notifications() {
  const router = useRouter();
  const { insights, loading, error, markRead } = useInsights();
  const [filter, setFilter] = useState<Filter>("all");

  /**
   * The agent can raise the same finding more than once — a trend that
   * persists is genuinely re-detected. The feed cares about the finding, not
   * how many times it fired, so collapse per title and keep the newest.
   */
  const collapse = (list: typeof insights) => {
    const byTitle = new Map<string, { item: (typeof list)[number]; count: number }>();
    for (const i of list) {
      const key = i.title.trim().toLowerCase();
      const existing = byTitle.get(key);
      if (!existing) {
        byTitle.set(key, { item: i, count: 1 });
      } else {
        const newer = new Date(i.createdAt) > new Date(existing.item.createdAt);
        byTitle.set(key, { item: newer ? i : existing.item, count: existing.count + 1 });
      }
    }
    return [...byTitle.values()].sort(
      (a, b) => new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime(),
    );
  };

  const visible = useMemo(
    () => (filter === "all" ? insights : insights.filter((i) => GROUP[i.type as string] === filter)),
    [insights, filter],
  );

  const isToday = (iso: string) => Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
  const today = collapse(visible.filter((i) => isToday(i.createdAt)));
  const earlier = collapse(visible.filter((i) => !isToday(i.createdAt)));

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green600} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} />
      </Screen>
    );
  }

  const rows = (list: ReturnType<typeof collapse>) => (
    <View style={styles.rows}>
      {list.map(({ item: n }, i) => {
        const { Icon, key } = iconFor(n.type as string, n.title);
        const tint = TINTS[key];
        const unread = !n.isRead;

        return (
          <Reveal key={n.id} index={i}>
          <TapScale
            onPress={() => {
              if (unread) markRead(n.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${n.title}. ${n.message}`}
            style={[card, styles.row]}
          >
            <LinearGradient {...linearGradient(tint.gradient)} style={[iconTile, styles.rowIcon]}>
              <Icon size={19} color={tint.fg} />
            </LinearGradient>
            <View style={styles.rowText}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{n.title}</Text>
                {/* The dot is the only thing marking an item as unread, so it
                    has to be named for anyone who cannot see it. */}
                {unread ? (
                  <View style={styles.unread} accessibilityLabel="Unread" accessible />
                ) : null}
              </View>
              <Text style={styles.message} numberOfLines={2}>
                {n.message}
              </Text>
            </View>
            <Text style={styles.time}>{timeLabel(n.createdAt)}</Text>
          </TapScale>
          </Reveal>
        );
      })}
      {list.length === 0 ? <Text style={styles.empty}>Nothing here yet.</Text> : null}
    </View>
  );

  return (
    <Screen>
      {/* Header — the title is the axis, the one action sits quietly beside it */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push("/home")}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.back}
        >
          <ChevronLeftIcon size={22} color={semantic.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={() => insights.forEach((n) => !n.isRead && markRead(n.id))}
          accessibilityRole="button"
          style={styles.markAll}
        >
          <CheckAllIcon size={15} color={semantic.accentDeep} />
          <Text style={styles.markAllLabel} numberOfLines={1}>Mark all read</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: spacing.blockGap }}>
        <SegmentedTabs options={TABS} value={filter} onChange={setFilter} />
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Today</Text>
        {rows(today)}
      </View>

      {earlier.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Earlier</Text>
          {rows(earlier)}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center" },

  header: { height: 36, alignItems: "center", justifyContent: "center" },
  back: { position: "absolute", left: -8, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  /* `text-[17px] font-semibold`, centred on Tailwind's 1.5 line box. */
  headerTitle: {
    fontSize: 17,
    ...font(600),
    lineHeight: 25.5,
    letterSpacing: -0.02 * 17,
    color: semantic.textPrimary,
  },
  markAll: { position: "absolute", right: 0, flexDirection: "row", alignItems: "center", gap: 4 },
  markAllLabel: { fontSize: 12.5, ...font(600), lineHeight: 18.75, color: semantic.accentDeep },

  block: { marginTop: spacing.blockGap },
  sectionTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary, marginBottom: spacing.sm },

  rows: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: 14 },
  rowIcon: { width: 40, height: 40 },
  rowText: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  title: { fontSize: 13.5, ...font(600), lineHeight: 18.5, color: semantic.textPrimary, flexShrink: 1 },
  unread: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.green600, marginTop: 6 },
  message: { fontSize: 12.5, lineHeight: 17.2, color: semantic.textSecondary, marginTop: 2 },
  time: { fontSize: 11, lineHeight: 16.5, color: semantic.textMuted, marginTop: 2 },

  empty: { fontSize: 13, lineHeight: 19.5, color: semantic.textMuted, paddingVertical: 24, textAlign: "center" },
});
