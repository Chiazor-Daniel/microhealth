import { useMemo, useState, type ReactElement } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, metricTint, semantic, spacing } from "@tokens";
import { linearGradient, text, font } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";
import { usePatientData } from "@app/hooks/usePatientData";
import { useWearable } from "@app/patient/hooks/useWearable";
import { axisLabel, buildSeries, distinctTicks } from "@app/patient/lib/timeSeries";
import { metricOf } from "@metrics/registry";

import { Screen } from "@/ui/Screen";
import { ErrorState } from "@/ui/ErrorState";
import { SegmentedTabs } from "@/ui/SegmentedTabs";
import { MetricAreaChart } from "@/ui/MetricAreaChart";
import { card, cardFeature, iconTile, iconTileBorder, pill, pillTone, tabular } from "@/ui/styles";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  DropletIcon,
  GlyphIcon,
  HeartIcon,
  MinusIcon,
  MoreIcon,
  OxygenIcon,
  ThermometerIcon,
  type GlyphProps,
} from "@/icons";

const RANGES = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "3 Months" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];

const PERIOD_LABEL: Record<string, string> = {
  day: "Compared to earlier today",
  week: "Compared to last week",
  month: "Compared to last month",
  quarter: "Compared to last quarter",
};

/**
 * Per-metric definition: label, unit, the healthy band, and the value reader.
 * `baseline` drives both the "In range" judgement and how the range card is
 * written out.
 */
const METRICS: Record<
  string,
  {
    label: string;
    unit: string;
    Icon: (p: GlyphProps) => ReactElement;
    baseline: [number, number];
    read: (v: any) => number | null;
  }
> = {
  heartRate: {
    label: "Heart Rate",
    unit: "BPM",
    Icon: HeartIcon,
    baseline: [64, 78],
    read: (v) => v?.heartRate ?? null,
  },
  bloodPressure: {
    label: "Blood Pressure",
    unit: "mmHg",
    Icon: DropletIcon,
    baseline: [90, 120],
    read: (v) => v?.bloodPressureSystolic ?? v?.systolic ?? null,
  },
  spo2: {
    label: "Blood Oxygen",
    unit: "%",
    Icon: OxygenIcon,
    baseline: [95, 100],
    read: (v) => v?.spo2 ?? null,
  },
  temperature: {
    label: "Temperature",
    unit: "°C",
    Icon: ThermometerIcon,
    baseline: [36.1, 37.2],
    read: (v) => v?.temperature ?? null,
  },
};

/** Metric key → the tile token and border tone its icon container takes. */
const METRIC_TILE: Record<string, { gradient: any; tone: string }> = {
  heartRate: { gradient: "tileRose", tone: "rose" },
  bloodPressure: { gradient: "tile", tone: "green" },
  spo2: { gradient: "tileTeal", tone: "teal" },
  temperature: { gradient: "tileAmber", tone: "amber" },
};

/* The web writes this timestamp with `toLocaleString("en-US", …)`; Hermes ships
   Intl, so the same options produce the same string. */
const lastReadingAt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function VitalsDetail() {
  const { metric = "heartRate" } = useLocalSearchParams<{ metric?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { vitals: existingVitals, metricRecords, loading, error, refresh } = usePatientData();
  const { latest: wearableLatest } = useWearable(user?.profile?.id, true);
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<RangeValue>("day");

  /* The registry is the source of truth for what a metric *is* — its label,
     unit, healthy band, glyph and how to read it. The local table below is now
     only a fallback for a key the registry does not know.

     Without this, every card on Vitals opened Heart Rate: the screen keys off
     the URL, and a key it had no entry for fell back silently. */
  const registry = metricOf(metric);
  const fallback = METRICS[metric] ?? METRICS.heartRate;
  const def = registry
    ? {
        ...fallback,
        label: registry.label,
        unit: registry.unit,
        baseline: [registry.band.low, registry.band.high] as [number, number],
        read: registry.read ?? fallback.read,
        Icon: ({ size, color }: { size?: number; color?: string }) => (
          <GlyphIcon name={registry.icon} size={size} color={color} />
        ),
      }
    : fallback;

  /* Where this metric's readings actually live.
     The band reports several measures in one packet; everything episodic —
     a night of sleep, a day's steps, a lab draw — is its own record. Reading
     the second kind out of the packet would chart nothing. */
  const isRecord = registry?.source === "record";
  const recordSeries = useMemo(
    () =>
      metricRecords
        .filter((r) => r.metricKey === metric && r.value != null)
        .map((r) => ({ recordedAt: r.recordedAt, value: r.value as number }))
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [metricRecords, metric],
  );

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

  const series = useMemo(() => {
    /* An episodic metric is charted from its own records; a wide-packet one
       from the vitals history. The two are different stores and reading the
       wrong one charts nothing. */
    if (isRecord) {
      return buildSeries(recordSeries, range, (r) => r.value).map((p) => ({
        label: axisLabel(p.at, range),
        value: p.value,
      }));
    }
    return buildSeries(vitals, range, def.read).map((p) => ({
      label: axisLabel(p.at, range),
      value: p.value,
    }));
  }, [vitals, recordSeries, isRecord, range, def]);

  /* Distinct tick labels — a minute can hold several readings, and forcing a
     tick at each of them prints the same time more than once. */
  const xTicks = useMemo(() => distinctTicks(series.map((p) => p.label)), [series]);

  const current = isRecord
    ? (recordSeries.length ? recordSeries[recordSeries.length - 1].value : null)
    : def.read(vitals[0]);
  /* Movement across the window, not against the reading 3 seconds ago. */
  const windowStart = series.length > 1 ? series[0].value : null;
  const delta = current != null && windowStart != null ? Math.round((current - windowStart) * 10) / 10 : null;

  const inRange = current != null && current >= def.baseline[0] && current <= def.baseline[1];
  const tint = metricTint(metric);
  const tile = METRIC_TILE[metric] ?? METRIC_TILE.heartRate;

  /* A fall wears amber — the same high-amber the pills use — and anything else
     the signal green the rest of the app states a good reading in. Both are
     *statuses*, so neither takes the brand teal. */
  const deltaColor = delta != null && delta < 0 ? pillTone.amber.fg : semantic.signalDeep;
  const rangePill = inRange ? pillTone.green : pillTone.amber;

  /* The chart bleeds 4px past the card's padding on each side (`-mx-1`), so it
     spans the page width less the card's own gutter, plus that bleed. */
  const chartWidth = width - spacing.pageX * 2 - spacing.cardPadding * 2 + 8;

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={refresh} />
      </Screen>
    );
  }

  if (loading && !vitals.length) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green600} />
        </View>
      </Screen>
    );
  }

  const lastAt = vitals[0]?.recordedAt ? lastReadingAt.format(new Date(vitals[0].recordedAt)) : "—";

  return (
    <Screen>
      {/* Header — bare controls, the title is the axis of the screen */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push("/vitals")}
          accessibilityLabel="Back to vitals"
          style={styles.headerBack}
        >
          <ChevronLeftIcon size={22} color={semantic.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{def.label}</Text>
        <Pressable accessibilityLabel="More options" style={styles.headerMore}>
          <MoreIcon size={18} color={semantic.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.block}>
        <SegmentedTabs
          options={RANGES as unknown as { value: RangeValue; label: string }[]}
          value={range}
          onChange={setRange}
          fill
        />
      </View>

      {/* Hero readout */}
      <View style={[cardFeature, styles.hero]}>
        <View style={styles.heroTop}>
          <View style={styles.heroLeft}>
            <LinearGradient
              {...linearGradient(tile.gradient)}
              style={[iconTile, { width: 44, height: 44, borderColor: iconTileBorder[tile.tone] }]}
            >
              <def.Icon size={21} color={tint.fg} />
            </LinearGradient>
            <View>
              <View style={styles.valueRow}>
                <Text style={[text.heroNumber, tabular]}>{current == null ? "—" : current}</Text>
                <Text style={styles.unit}>{def.unit}</Text>
              </View>
              <Text style={styles.lastReading}>Last reading · {lastAt}</Text>
            </View>
          </View>
          {/* The web draws this state as a bare `mh-pill`: green while the
              reading sits in its band, amber once it does not. */}
          <LinearGradient
            colors={[rangePill.bg[0], rangePill.bg[1]]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[pill, { borderColor: rangePill.borderColor }]}
          >
            <Text style={[styles.pillLabel, { color: rangePill.fg }]}>
              {inRange ? "In range" : "Out of range"}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.chart}>
          {series.length > 1 ? (
            <MetricAreaChart data={series} xTicks={xTicks} width={chartWidth} height={192} />
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>Not enough readings in this range yet.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Your Range — the band the reading should sit in, and how the latest
          reading moved across the window. */}
      <View style={[card, styles.rangeCard]}>
        <Text style={styles.rangeLabel}>Your Range</Text>
        <Text style={styles.rangeValue}>
          {def.baseline[0]} – {def.baseline[1]} {def.unit}
        </Text>

        <View style={styles.deltaRow}>
          <LinearGradient
            {...linearGradient(delta != null && delta < 0 ? "tileAmber" : "tile")}
            style={[
              iconTile,
              styles.deltaTile,
              { borderColor: delta != null && delta < 0 ? iconTileBorder.amber : iconTileBorder.green },
            ]}
          >
            {delta == null || delta === 0 ? (
              <MinusIcon size={26} color={deltaColor} />
            ) : delta > 0 ? (
              <ArrowUpIcon size={26} color={deltaColor} />
            ) : (
              <ArrowDownIcon size={26} color={deltaColor} />
            )}
          </LinearGradient>
          <View style={styles.deltaBody}>
            <Text style={[styles.deltaValue, { color: deltaColor }]}>
              {delta == null || delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta} ${def.unit}`}
            </Text>
            <Text style={styles.deltaPeriod}>{PERIOD_LABEL[range]}</Text>
            <Text style={styles.deltaNote}>{inRange ? "(healthy variation)" : "(outside your usual range)"}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center" },

  header: { height: 36, alignItems: "center", justifyContent: "center" },
  /* The web pulls both controls a few pixels past the content edge; the header
     row itself is the full width of the column. */
  headerBack: {
    position: "absolute",
    left: -8,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerMore: {
    position: "absolute",
    right: -4,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, ...font(600), lineHeight: 25.5, letterSpacing: -0.02 * 17, color: semantic.textPrimary },

  block: { marginTop: spacing.blockGap },
  hero: { padding: spacing.cardPadding, marginTop: spacing.blockGap },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.xs },
  heroLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  unit: { fontSize: 13, ...font(500), lineHeight: 19.5, color: semantic.textMuted },
  lastReading: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textMuted, marginTop: 4 },
  pillLabel: { fontSize: 11, ...font(600), lineHeight: 16.5 },

  chart: { height: 192, marginTop: spacing.md, marginHorizontal: -4 },
  chartEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  chartEmptyText: { fontSize: 13, lineHeight: 19.5, color: semantic.textMuted },

  rangeCard: { padding: spacing.md, marginTop: spacing.blockGap },
  rangeLabel: { fontSize: 13, ...font(500), lineHeight: 19.5, color: semantic.textSecondary },
  rangeValue: {
    fontSize: 24,
    ...font(700),
    lineHeight: 36,
    letterSpacing: -0.02 * 24,
    color: semantic.textPrimary,
    marginTop: 4,
  },

  deltaRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: spacing.md },
  /* The web squares this tile off to an 18px radius rather than the circle the
     metric tiles wear, so the base is overridden rather than composed. */
  deltaTile: { width: 56, height: 56, borderRadius: 18 },
  deltaBody: { flex: 1 },
  deltaValue: { fontSize: 15, ...font(600), lineHeight: 22.5 },
  deltaPeriod: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textSecondary },
  deltaNote: { fontSize: 12, lineHeight: 18, color: semantic.textMuted, marginTop: 2 },
});
