import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radii, semantic, spacing } from "@tokens";
import { font } from "@rn/theme";
import { vitalService } from "@app/services/vital.service";
import { api } from "@app/services/api";
import { resolveAll, toScoreReadings, currentVitals } from "@metrics/readings";
import { buildSeries } from "@app/patient/lib/timeSeries";
import { computeHealthScore } from "@metrics/healthScore";

import { Screen } from "@/ui/Screen";
import { Avatar } from "@/ui/Avatar";
import { ScoreRing, ScoreBandChip, scoreVerdict } from "@/ui/HealthScore";
import { Sparkline } from "@/ui/Sparkline";
import { card } from "@/ui/styles";
import { ChevronLeftIcon } from "@/icons";
import { ErrorState } from "@/ui/ErrorState";
import { HeroSkeleton, TilePairSkeleton } from "@/ui/Skeleton";

/**
 * One family member's vitals, full view.
 *
 * Reached from the household card's View Vitals. Reads ONLY the subject's
 * rows (the route is family-authorized server-side) and runs the same
 * registry pipeline as Home, so a member's numbers can never disagree
 * between screens.
 */
export default function MemberVitals() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vitals, setVitals] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([vitalService.getByPatient(id), vitalService.getMetricReadings(id)])
      .then(([v, r]) => {
        setVitals(v);
        setRecords(r);
        setError(null);
      })
      .catch((e: any) => setError(e?.message ?? "Couldn't load vitals."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get<any>(`/patients/${id}`)
      .then((p: any) => setName(p?.user ? `${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim() : null))
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <View style={{ gap: spacing.sm }}>
          <HeroSkeleton />
          <TilePairSkeleton />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => router.back()} />
      </Screen>
    );
  }

  if (!vitals.length) {
    return (
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={styles.back}>
            <ChevronLeftIcon size={22} color={semantic.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{display}</Text>
        </View>
        <View style={[card, styles.center]}>
          <Text style={styles.body}>No readings yet for {display}.</Text>
        </View>
      </Screen>
    );
  }

  const latest = currentVitals(vitals);
  const allValues = resolveAll(latest, records);
  const score = computeHealthScore(toScoreReadings(allValues));
  const display = name || "Family member";
  const firstName = display.split(" ")[0];
  const verdict = scoreVerdict(score, null, firstName);
  const hrMetric = allValues.find((v) => v.metric.key === "heartRate");
  const series = hrMetric?.metric.read
    ? buildSeries(vitals, "day", (v) => hrMetric.metric.read!(v))
        .map((p) => p.value as number)
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    : [];

  const tiles = [    { label: "Blood Pressure", value: latest?.bloodPressureSystolic != null ? `${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic ?? "—"}` : "—", unit: "mmHg" },
    { label: "Blood Oxygen", value: latest?.spo2 != null ? `${latest.spo2}` : "—", unit: "%" },
    { label: "Temperature", value: latest?.temperature != null ? `${latest.temperature}` : "—", unit: "°C" },
    { label: "Respiration", value: latest?.respiratoryRate != null ? `${latest.respiratoryRate}` : "—", unit: "br/min" },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={styles.back}>
          <ChevronLeftIcon size={22} color={semantic.textPrimary} />
        </Pressable>
        <Avatar seed={id} name={display} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{display}</Text>
          <Text style={styles.sub}>Family vitals</Text>
        </View>
      </View>

      <View style={[card, styles.scoreCard]}>
        <View style={styles.scoreRow}>
          <ScoreRing result={score} size={96} />
          <View style={{ flex: 1 }}>
            <ScoreBandChip band={score.band} />
            <Text style={styles.scoreLine}>{verdict.line}</Text>
            <Text style={styles.scoreNote}>{verdict.sub}</Text>
          </View>
        </View>
      </View>

      <View style={[card, styles.hero]}>
        <Text style={styles.heroLabel}>Heart Rate</Text>
        <Text style={styles.heroValue}>
          {latest?.heartRate ?? "—"} <Text style={styles.heroUnit}>bpm</Text>
        </Text>
        {series.length > 1 ? <Sparkline data={series} width={300} height={64} /> : null}
      </View>

      <View style={styles.grid}>
        {tiles.map((t) => (
          <View key={t.label} style={[card, styles.tile]}>
            <Text style={styles.tileLabel}>{t.label}</Text>
            <Text style={styles.tileValue}>
              {t.value} <Text style={styles.tileUnit}>{t.unit}</Text>
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, ...font(600), lineHeight: 24, color: semantic.textPrimary },
  sub: { fontSize: 12.5, lineHeight: 17, color: semantic.textSecondary },
  scoreCard: { marginTop: spacing.md, padding: spacing.md },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  scoreNote: { fontSize: 12.5, lineHeight: 18, color: semantic.textSecondary, marginTop: 6 },
  scoreLine: { fontSize: 14.5, ...font(600), lineHeight: 21, color: semantic.textPrimary, marginTop: 6 },
  hero: { marginTop: spacing.sm, padding: spacing.md },
  heroLabel: { fontSize: 13, ...font(500), color: semantic.textSecondary },
  heroValue: { fontSize: 34, ...font(700), color: semantic.textPrimary, marginVertical: 4 },
  heroUnit: { fontSize: 14, ...font(500), color: semantic.textSecondary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  tile: { width: "48%", flexGrow: 1, padding: spacing.md },
  tileLabel: { fontSize: 12.5, color: semantic.textSecondary },
  tileValue: { fontSize: 22, ...font(700), color: semantic.textPrimary, marginTop: 4 },
  tileUnit: { fontSize: 12, ...font(500), color: semantic.textSecondary },
  center: { marginTop: spacing.md, padding: spacing.lg, alignItems: "center" },
  body: { fontSize: 13.5, lineHeight: 19, color: semantic.textSecondary, textAlign: "center" },
});
