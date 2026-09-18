import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, metricTint, semantic, spacing } from "@tokens";
import { linearGradient, text, font } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";
import { usePatientData } from "@app/hooks/usePatientData";
import { useWearable } from "@app/patient/hooks/useWearable";
import { buildSeries } from "@app/patient/lib/timeSeries";

import { Screen } from "@/ui/Screen";
import { Reveal, TapScale } from "@/ui/motion";
import { ErrorState } from "@/ui/ErrorState";
import { SegmentedTabs } from "@/ui/SegmentedTabs";
import { StatusBadge } from "@/ui/StatusBadge";
import { Sparkline } from "@/ui/Sparkline";
import { EmptyState } from "@/ui/EmptyState";
import { useBandConnected } from "@/lib/band";
import { FluidText } from "@/ui/FluidText";
import { card, iconTile, iconTileBorder, tabular } from "@/ui/styles";
import { ChevronRightIcon, DropletIcon, HeartIcon, OxygenIcon, ThermometerIcon, WatchIcon } from "@/icons";

const tabs = [
  { value: "today", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "3 Months" },
] as const;

type TabValue = (typeof tabs)[number]["value"];

/** The healthy band for each metric, and how it is written out. */
const RANGES: Record<string, { lo: number; hi: number; label: string }> = {
  heartRate: { lo: 60, hi: 100, label: "60 – 100 bpm" },
  bloodPressure: { lo: 90, hi: 120, label: "90/60 – 120/80 mmHg" },
  spo2: { lo: 95, hi: 100, label: "95 – 100 %" },
  temperature: { lo: 36.1, hi: 37.2, label: "36.1 – 37.2 °C" },
};

function interpretValue(metric: string, value: number) {
  switch (metric) {
    case "heartRate":
      if (value < 55) return { status: "low", text: "Low" };
      if (value > 100) return { status: "high", text: "High" };
      if (value > 85) return { status: "attention", text: "Elevated" };
      return { status: "normal", text: "Normal" };
    case "bloodPressure":
      if (value > 140) return { status: "high", text: "High" };
      if (value > 125) return { status: "attention", text: "Elevated" };
      return { status: "normal", text: "Normal" };
    case "spo2":
      if (value < 95) return { status: "low", text: "Low" };
      return { status: "normal", text: "Normal" };
    case "temperature":
      if (value > 37.6) return { status: "high", text: "Fever" };
      if (value > 37.2) return { status: "attention", text: "Elevated" };
      return { status: "normal", text: "Normal" };
    default:
      return { status: "normal", text: "Normal" };
  }
}

/** Metric key → the tile token and border tone its icon container takes. */
const METRIC_TILE: Record<string, { gradient: any; tone: string }> = {
  heartRate: { gradient: "tileRose", tone: "rose" },
  bloodPressure: { gradient: "tile", tone: "green" },
  spo2: { gradient: "tileTeal", tone: "teal" },
  temperature: { gradient: "tileAmber", tone: "amber" },
};

export default function Vitals() {
  const { user } = useAuth();
  const { vitals: existingVitals, loading, error, refresh } = usePatientData();
  const bandConnected = useBandConnected(user?.profile?.id, existingVitals.length > 0);
  const { latest: wearableLatest } = useWearable(user?.profile?.id, bandConnected);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<TabValue>("today");

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
        recordedAt: wearableLatest.timestamp,
      } as any);
    }
    return list;
  }, [existingVitals, wearableLatest]);

  const current: any = vitals[0];

  const metrics = useMemo(() => {
    const bpSys = current?.bloodPressureSystolic ?? current?.systolic ?? null;
    const bpDia = current?.bloodPressureDiastolic ?? current?.diastolic ?? null;
    return [
      { key: "heartRate", label: "Heart Rate", display: current?.heartRate ?? null, unit: "bpm", reading: current?.heartRate },
      {
        key: "bloodPressure",
        label: "Blood Pressure",
        display: bpSys == null ? null : bpDia == null ? bpSys : `${bpSys}/${bpDia}`,
        unit: "mmHg",
        reading: bpSys,
      },
      { key: "spo2", label: "Blood Oxygen", display: current?.spo2 ?? null, unit: "%", reading: current?.spo2 },
      { key: "temperature", label: "Temperature", display: current?.temperature ?? null, unit: "°C", reading: current?.temperature },
    ];
  }, [current]);

  const sparkFor = (key: string) =>
    buildSeries(vitals, tab, (v: any) => (key === "bloodPressure" ? (v.bloodPressureSystolic ?? v.systolic) : v[key])).map(
      (p) => p.value,
    );

  /* The chart spans the page width minus the page gutter, the card's own
     padding, the chevron column and the gap before it. */
  const sparkWidth = width - spacing.pageX * 2 - 32 - 17 - 4;

  if (loading && !vitals.length) {
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

      {/* Four cards of em dashes is what a new account would otherwise see,
          and it reads as broken rather than as empty. */}
      {!vitals.length ? (
        <EmptyState
          icon={<WatchIcon size={22} color={semantic.accentDeep} />}
          title="No vitals yet"
          body="Your band sends heart rate, blood pressure, oxygen and temperature here automatically. You can also add a reading by hand."
          action="Connect a band"
          onAction={() => router.push("/profile")}
        />
      ) : null}

      {/* Every metric gets its own full-width card and its own sparkline, so
          the screen can be read top to bottom without picking one first. */}
      {vitals.length ? (
      <View style={{ marginTop: spacing.blockGap, gap: spacing.sm }}>
        {metrics.map((m, i) => {
          const interp = interpretValue(m.key, Number(m.reading));
          const tint = metricTint(m.key);
          const range = RANGES[m.key];
          const series = sparkFor(m.key);
          const tile = METRIC_TILE[m.key];

          return (
            <Reveal key={m.key} index={i}>
            <TapScale
              onPress={() => router.push(`/vitals/${m.key}`)}
              accessibilityLabel={`${m.label}, ${m.display ?? "no reading"} ${m.unit}`}
            >
              <View style={[card, { padding: spacing.md }]}>
                <View style={styles.metricTop}>
                  <View style={styles.metricTitleRow}>
                    <LinearGradient
                      {...linearGradient(tile.gradient)}
                      style={[iconTile, { width: 44, height: 44, borderColor: iconTileBorder[tile.tone] }]}
                    >
                      <MetricIcon metric={m.key} color={tint.fg} />
                    </LinearGradient>
                    <Text style={styles.metricLabel}>{m.label}</Text>
                  </View>
                  {/* On this screen every metric states its status as a capsule —
                      there is room for it, and the cards are compared side by
                      side. Home's compact pair states it as plain text instead. */}
                  <StatusBadge status={m.key === "heartRate" ? "inrange" : interp.status} variant="pill" />
                </View>

                <View style={styles.metricValueRow}>
                  <FluidText value={m.display === null ? "—" : String(m.display)} style={[styles.metricValue, tabular]} />
                  <Text style={styles.metricUnit}>{m.unit}</Text>
                </View>

                <Text style={styles.metricRange}>Normal range: {range.label}</Text>

                {/* The card opens a detail screen, so it says so — the chevron
                    gets its own column rather than sitting on the last point. */}
                <View style={styles.sparkRow}>
                  <View style={{ flex: 1 }}>
                    <Sparkline data={series} width={sparkWidth} height={46} dot={false} />
                  </View>
                  <ChevronRightIcon size={17} color={semantic.textMuted} />
                </View>
              </View>
            </TapScale>
            </Reveal>
          );
        })}
      </View>
      ) : null}
    </Screen>
  );
}

function MetricIcon({ metric, color }: { metric: string; color: string }) {
  switch (metric) {
    case "heartRate":
      return <HeartIcon size={20} color={color} />;
    case "bloodPressure":
      return <DropletIcon size={20} color={color} />;
    case "spo2":
      return <OxygenIcon size={20} color={color} />;
    default:
      return <ThermometerIcon size={20} color={color} />;
  }
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center" },
  header: { alignItems: "center", justifyContent: "center" },
  /* The screen title is set at 22/600 rather than the theme's 23/700 — that is
     what the web build's heading uses, and the two must not drift. */
  title: { fontSize: 22, ...font(600), lineHeight: 33, letterSpacing: -0.02 * 22, color: semantic.textPrimary },
  headerAction: { position: "absolute", right: 0, width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  metricTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.xs },
  metricTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  metricLabel: { ...text.cardLabel, color: semantic.textPrimary },
  metricValueRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: spacing.sm },
  metricValue: { fontSize: 34, ...font(700), lineHeight: 36, letterSpacing: -0.035 * 34, color: semantic.textPrimary },
  metricUnit: { ...text.cardLabel, color: semantic.textSecondary },
  metricRange: { ...text.caption, color: semantic.textMuted, marginTop: 4 },
  sparkRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.xs },
});
