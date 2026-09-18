import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, semantic, spacing } from "@tokens";
import { font } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";
import { usePatientData } from "@app/hooks/usePatientData";
import { useWearable } from "@app/patient/hooks/useWearable";
import { buildSeries } from "@app/patient/lib/timeSeries";
import { CATEGORY_LABEL, CATEGORY_ORDER, metricsIn, type Metric } from "@metrics/registry";
import { resolveAll, type MetricValue } from "@metrics/readings";

import { Screen } from "@/ui/Screen";
import { Reveal, TapScale } from "@/ui/motion";
import { ErrorState } from "@/ui/ErrorState";
import { SegmentedTabs } from "@/ui/SegmentedTabs";
import { EmptyState } from "@/ui/EmptyState";
import { MetricTile } from "@/ui/MetricTile";
import { GlyphIcon, WatchIcon, ChevronRightIcon } from "@/icons";
import { card, tabular } from "@/ui/styles";
import { useBandConnected } from "@/lib/band";

const tabs = [
  { value: "today", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "3 Months" },
] as const;

type TabValue = (typeof tabs)[number]["value"];

/**
 * The three resolutions a heart rate is actually read at.
 *
 * "Real-time" is the latest packet; the other two are the mean over the
 * trailing window. A number sampled every few seconds is unreadable on its
 * own — the averages are what say whether 78 right now is a blip or a trend.
 */
function HeartRateWindows({ vitals, latest }: { vitals: any[]; latest: number | null }) {
  const windows = useMemo(() => {
    const now = Date.now();
    const mean = (minutes: number) => {
      const cutoff = now - minutes * 60_000;
      const inWindow = vitals
        .filter((v) => v?.heartRate != null && v.recordedAt && new Date(v.recordedAt).getTime() >= cutoff)
        .map((v) => v.heartRate as number);
      if (!inWindow.length) return null;
      return Math.round(inWindow.reduce((a, b) => a + b, 0) / inWindow.length);
    };
    return [
      { label: "Now", value: latest },
      { label: "5 min", value: mean(5) },
      { label: "30 min", value: mean(30) },
    ];
  }, [vitals, latest]);

  return (
    <View style={styles.windows}>
      {windows.map((w) => (
        <View key={w.label} style={styles.window}>
          <Text style={styles.windowLabel}>{w.label}</Text>
          <Text style={[styles.windowValue, tabular]}>
            {w.value ?? "—"}
            <Text style={styles.windowUnit}> bpm</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Everything the registry knows but nothing is recording yet.
 *
 * Collapsed into one row rather than a section each, so a category with no
 * data does not get a header announcing emptiness — but the names still show,
 * because a patient should be able to see what the product is *going* to
 * measure, not just what it measures today.
 */
function NotRecording({ metrics, onOpen }: { metrics: Metric[]; onOpen: (m: Metric) => void }) {
  const [open, setOpen] = useState(false);
  if (!metrics.length) return null;

  return (
    <View style={[card, { padding: spacing.md }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.notRecordingHead}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.notRecordingTitle}>
            {metrics.length} more {metrics.length === 1 ? "measure" : "measures"} not recording yet
          </Text>
          {/* The names, so the breadth is visible without expanding. One line,
              because this is a hint rather than an inventory. */}
          <Text style={styles.notRecordingNames} numberOfLines={1}>
            {metrics.map((m) => m.label).join(" · ")}
          </Text>
        </View>
        <ChevronRightIcon size={16} color={semantic.textMuted} />
      </Pressable>

      {open && (
        <View style={styles.notRecordingList}>
          {metrics.map((m) => (
            <Pressable key={m.key} onPress={() => onOpen(m)} style={styles.notRecordingRow}>
              <GlyphIcon name={m.icon} size={16} color={semantic.textMuted} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.notRecordingLabel} numberOfLines={1}>
                  {m.label}
                </Text>
                <Text style={styles.notRecordingMeta}>
                  {CATEGORY_LABEL[m.category]} · {m.cadence === "interval" ? "on demand" : m.cadence}
                </Text>
              </View>
              <Text style={styles.notRecordingNone}>No readings</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Lay a section's cards out as rows.
 *
 * The first metric of a section carries it, so it gets the full width. After
 * that the cards pair up — and when what remains is an odd number, the last
 * one takes the full width too, rather than leaving a gap beside it. React
 * Native has no grid, so the rows are built here and each is a flex row.
 */
function rowsOf(values: MetricValue[]): MetricValue[][] {
  if (!values.length) return [];
  const rows: MetricValue[][] = [[values[0]]];
  const rest = values.slice(1);
  for (let i = 0; i < rest.length; i += 2) rows.push(rest.slice(i, i + 2));
  return rows;
}

export default function Vitals() {
  const { user } = useAuth();
  const { vitals: existingVitals, metricRecords, loading, error, refresh } = usePatientData();
  const bandConnected = useBandConnected(user?.profile?.id, existingVitals.length > 0);
  const { latest: wearableLatest } = useWearable(user?.profile?.id, bandConnected);
  const router = useRouter();
  const [tab, setTab] = useState<TabValue>("today");

  /* The band's newest packet first, then the stored history — the same shape
     every screen reads from, so Home and Vitals cannot disagree about what the
     current heart rate is. */
  const vitals = useMemo(() => {
    const list = [...existingVitals];
    if (wearableLatest) {
      list.unshift({
        id: "wearable-latest",
        patientId: wearableLatest.patientId,
        heartRate: wearableLatest.heartRate,
        spo2: wearableLatest.spo2,
        temperature: wearableLatest.temperature,
        bloodPressureSystolic: wearableLatest.systolic,
        bloodPressureDiastolic: wearableLatest.diastolic,
        respiratoryRate: wearableLatest.respiratoryRate,
        hrv: wearableLatest.hrv,
        stress: wearableLatest.stress,
        fatigue: wearableLatest.fatigue,
        gsr: wearableLatest.gsr,
        recordedAt: wearableLatest.timestamp,
      } as any);
    }
    return list;
  }, [existingVitals, wearableLatest]);

  const current: any = vitals[0];

  /* Every metric the registry defines, resolved against the packet and the
     patient's episodic records. Metrics with nothing yet come back empty
     rather than missing, which is what lets the sections below say so. */
  const allValues = useMemo(() => resolveAll(current, metricRecords), [current, metricRecords]);
  const byKey = useMemo(() => new Map(allValues.map((v) => [v.metric.key, v])), [allValues]);

  const sparkFor = (metric: Metric) => {
    if (!metric.read) return undefined;
    return buildSeries(vitals, tab, (v) => metric.read!(v)).map((p) => p.value as number);
  };

  const openMetric = (metric: Metric) => {
    if (metric.category === "labs") router.push("/care");
    else router.push(`/vitals/${metric.key}`);
  };

  /* Everything the registry defines that has nothing to show yet, gathered
     across every category so it can be one row at the foot of the screen. */
  const allMissing = useMemo(() => allValues.filter((v) => v.value == null).map((v) => v.metric), [allValues]);

  if (loading && !vitals.length) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={semantic.brand} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={refresh} />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header — the title is the axis of the screen, so it centres */}
      <View style={styles.header}>
        <Text style={styles.title}>Vitals</Text>
        <View style={styles.headerAction} accessibilityLabel="MicroHealth Band">
          <WatchIcon size={20} color={semantic.textSecondary} />
        </View>
      </View>

      <View style={{ marginTop: spacing.blockGap }}>
        <SegmentedTabs options={tabs as unknown as { value: TabValue; label: string }[]} value={tab} onChange={setTab} fill />
      </View>

      {/* A screen of em dashes is what a new account would otherwise see, and
          it reads as broken rather than as empty. */}
      {!vitals.length ? (
        <EmptyState
          icon={<WatchIcon size={22} color={semantic.brand} />}
          title="No vitals yet"
          body="Your band sends heart rate, blood pressure, oxygen and temperature here automatically. You can also add a reading by hand."
          action="Connect a band"
          onAction={() => router.push("/profile")}
        />
      ) : null}

      {/* Sections, in the registry's own order, so adding a category is a
          registry change rather than a screen change. */}
      {vitals.length
        ? CATEGORY_ORDER.map((category) => {
            const inCategory = metricsIn(category).map((m) => byKey.get(m.key)!).filter(Boolean);
            if (!inCategory.length) return null;

            const present = inCategory.filter((v) => v.value != null);
            /* A category with nothing recorded gets no header — announcing an
               empty section is worse than saying nothing. */
            if (!present.length) return null;

            return (
              <View key={category} style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{CATEGORY_LABEL[category]}</Text>
                  {category === "labs" && (
                    <Pressable onPress={() => router.push("/care")}>
                      <Text style={styles.sectionAction}>View results</Text>
                    </Pressable>
                  )}
                </View>

                {rowsOf(present).map((row, r) => (
                  <View key={row[0].metric.key} style={styles.row}>
                    {row.map((mv, i) => (
                      <View key={mv.metric.key} style={{ flex: 1 }}>
                        <Reveal index={Math.min(r * 2 + i, 6)}>
                          <TapScale
                            onPress={() => openMetric(mv.metric)}
                            accessibilityLabel={`${mv.metric.label}, ${mv.display} ${mv.unit}`}
                          >
                            <MetricTile
                              mv={mv}
                              size={row.length === 1 ? "hero" : "tile"}
                              series={sparkFor(mv.metric)}
                              /* Vitals compares cards side by side, so every
                                 one states its range state — including
                                 "Normal". Home does not. */
                              alwaysStatus
                              extra={
                                mv.metric.key === "heartRate" ? (
                                  <HeartRateWindows vitals={vitals} latest={mv.value} />
                                ) : undefined
                              }
                            />
                          </TapScale>
                        </Reveal>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            );
          })
        : null}

      {/* One row for everything the registry knows and nothing is recording. */}
      {vitals.length ? (
        <View style={styles.section}>
          <NotRecording metrics={allMissing} onOpen={openMetric} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "center", minHeight: 40 },
  title: { fontSize: 22, ...font(600), color: semantic.textPrimary, letterSpacing: -0.02 * 22 },
  headerAction: {
    position: "absolute",
    right: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  section: { marginTop: spacing.sectionGap, gap: spacing.sm },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 15, ...font(600), color: semantic.textPrimary, letterSpacing: -0.01 * 15 },
  sectionAction: { fontSize: 12.5, ...font(600), color: semantic.brandDeep },

  row: { flexDirection: "row", gap: spacing.sm, alignItems: "stretch" },

  /* Heart-rate windows */
  windows: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
  window: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(196,224,233,0.7)",
  },
  windowLabel: { fontSize: 10.5, ...font(500), color: semantic.textMuted },
  windowValue: { fontSize: 15, ...font(700), color: semantic.textPrimary, marginTop: 2 },
  windowUnit: { fontSize: 10, ...font(500), color: semantic.textSecondary },

  /* Not recording */
  notRecordingHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  notRecordingTitle: { fontSize: 12.5, ...font(500), color: semantic.textSecondary },
  notRecordingNames: { fontSize: 11, ...font(400), color: semantic.textMuted, marginTop: 2 },
  notRecordingList: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  notRecordingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 10 },
  notRecordingLabel: { fontSize: 12.5, ...font(400), color: semantic.textSecondary },
  notRecordingMeta: { fontSize: 10.5, ...font(400), color: semantic.textMuted, marginTop: 1 },
  notRecordingNone: { fontSize: 11, ...font(400), color: semantic.textMuted },
});
