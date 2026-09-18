import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, gradients, metricTint, radii, semantic, spacing } from "@tokens";
import { linearGradient, text, font } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";
import { usePatientData } from "@app/hooks/usePatientData";
import { useInsights } from "@app/patient/hooks/useInsights";
import { useWearable } from "@app/patient/hooks/useWearable";
import { dashboardService } from "@app/services/dashboard.service";
import { buildSeries } from "@app/patient/lib/timeSeries";

import { Screen } from "@/ui/Screen";
import { Reveal, TapScale } from "@/ui/motion";
import { StatusBadge } from "@/ui/StatusBadge";
import { Sparkline, sparkDomain, SPARK_PAD } from "@/ui/Sparkline";
import { BrandMark } from "@/ui/BrandMark";
import { Avatar } from "@/ui/Avatar";
import { EmptyState } from "@/ui/EmptyState";
import { useBandConnected } from "@/lib/band";
import { FluidText } from "@/ui/FluidText";
import { card, iconGreen, iconTile, iconTileBorder, tabular } from "@/ui/styles";
import { formatClock, formatShortDate, greeting, relativeTime } from "@/ui/dates";
import {
  CalendarIcon,
  DropletIcon,
  HeartIcon,
  OxygenIcon,
  SparkIcon,
  SpeakerIcon,
  TrendIcon,
} from "@/icons";

/* Width of the hero chart's value gutter, and the padding the chart leaves at
   its top and bottom. The labels are offset by these so they sit against the
   points they name. */
const AXIS_W = 26;

/** The healthy band for each metric on this screen. */
const BANDS: Record<string, [number, number]> = {
  heartRate: [60, 100],
  bloodPressure: [90, 120],
  spo2: [95, 100],
};

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { vitals: existingVitals, appointments, loading: dataLoading } = usePatientData();
  const patientId = user?.profile?.id;
  /* The feed stands in for a band, so it only runs when there is one — see
     useBandConnected. Without this a brand-new account is handed invented
     readings and never sees the empty state. */
  const bandConnected = useBandConnected(patientId, existingVitals.length > 0);
  const { latest: wearableLatest, connected: wearableConnected } = useWearable(patientId, bandConnected);
  const { insights } = useInsights();
  const { width } = useWindowDimensions();

  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    dashboardService
      .getPatientDashboard()
      .then((d) => {
        if (!cancelled) setDashboard(d);
      })
      /* The dashboard is a convenience — Home renders fine from patient data
         alone, so a failure here quietly falls back rather than erroring. */
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceVitals = useMemo(
    () =>
      wearableLatest
        ? [{ id: "wearable-latest", ...wearableLatest, recordedAt: wearableLatest.timestamp } as any, ...existingVitals]
        : existingVitals,
    [wearableLatest, existingVitals],
  );

  const latest: any = sourceVitals[0];
  const heartRate = latest?.heartRate ?? null;
  const bpSys = latest?.systolic ?? latest?.bloodPressureSystolic ?? null;
  const bpDia = latest?.diastolic ?? latest?.bloodPressureDiastolic ?? null;
  const spo2 = latest?.spo2 ?? null;

  const status: "stable" | "watch" | "attention" = useMemo(() => {
    if (!latest) return "stable";
    if ((bpSys && bpSys > 140) || (spo2 && spo2 < 95) || (heartRate && (heartRate > 100 || heartRate < 55))) return "attention";
    if ((bpSys && bpSys > 125) || (heartRate && heartRate > 85)) return "watch";
    return "stable";
  }, [latest, bpSys, spo2, heartRate]);

  const hasReadings = sourceVitals.length > 0;

  /* With no readings at all there is no status to report, and claiming "looks
     stable today" to someone who has never taken a reading is worse than
     saying nothing. */
  const statusSubtext = !hasReadings
    ? "Let's get you set up"
    : status === "stable"
      ? "Your health looks stable today"
      : status === "watch"
        ? "Some vitals are trending up"
        : "A few vitals need attention";

  const hrInRange = heartRate != null && heartRate >= BANDS.heartRate[0] && heartRate <= BANDS.heartRate[1];

  /* The hero series keeps its timestamps — the chart is read as "over the day",
     so it needs to say which day-part it is showing. */
  const heroPoints = useMemo(
    () => buildSeries(sourceVitals, "day", (v: any) => v.heartRate, 24),
    [sourceVitals],
  );
  const heroSeries = useMemo(() => heroPoints.map((p) => p.value), [heroPoints]);
  const heroDomain = useMemo(() => sparkDomain(heroSeries), [heroSeries]);

  const topInsight = insights[0];
  const nextAppt = dashboard?.nextAppointment || appointments[0];
  const updatedAt = wearableLatest?.timestamp ?? latest?.recordedAt;

  /** Today, in order: what the body did, what the agent noticed, what is booked. */
  const timeline = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const isToday = (ms: number) => ms >= startOfDay.getTime();
    const seen = new Set<string>();

    const entries: {
      at: number;
      label: string;
      value: string;
      tone: string;
      kind: "reading" | "agent" | "appointment";
    }[] = [];

    for (const v of sourceVitals as any[]) {
      const ms = v.recordedAt ? new Date(v.recordedAt).getTime() : 0;
      if (!isToday(ms)) continue;
      const label = v.id === "wearable-latest" ? "Current reading" : "Heart rate";
      if (seen.has(label)) continue;
      seen.add(label);
      entries.push({
        at: ms,
        label,
        value: v.heartRate != null ? `${v.heartRate} BPM` : "—",
        tone: v.heartRate > 100 || v.heartRate < 55 ? colors.error : colors.success,
        kind: "reading",
      });
      if (entries.filter((e) => e.kind === "reading").length >= 3) break;
    }

    for (const a of appointments ?? []) {
      /* A date-only value parses as midnight, which would sort the day's
         appointment above readings taken in the evening. Anchor it to its
         scheduled time when there is one. */
      const day = a.scheduledDate ? new Date(a.scheduledDate) : null;
      if (!day || !isToday(day.getTime())) continue;
      const [h, m] = (a.scheduledTime ?? "").split(":").map(Number);
      if (!Number.isNaN(h)) day.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0);
      entries.push({
        at: day.getTime(),
        label: "Appointment",
        value: `${a.department || "General Practice"}${a.scheduledTime ? ` • ${a.scheduledTime.slice(0, 5)}` : ""}`,
        tone: colors.success,
        kind: "appointment",
      });
    }

    if (topInsight?.createdAt) {
      const ms = new Date(topInsight.createdAt).getTime();
      if (isToday(ms)) {
        entries.push({
          at: ms,
          label: "Health Agent",
          value: "Checked in on your trends",
          tone: colors.warning,
          kind: "agent",
        });
      }
    }

    return entries.sort((a, b) => b.at - a.at).slice(0, 5);
  }, [sourceVitals, appointments, topInsight]);

  if (dataLoading && !sourceVitals.length) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green600} />
        </View>
      </Screen>
    );
  }

  const heroWidth = width - spacing.pageX * 2 - 32;

  return (
    <Screen>
      {/* Greeting — the state of things is the second line, in green */}
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greeting()}, {user?.firstName || "there"}
          </Text>
          <Text style={styles.statusLine}>{statusSubtext}</Text>
          {hasReadings ? (
            <View style={styles.updatedRow}>
              <View
                style={[styles.dot, { backgroundColor: wearableConnected ? colors.green600 : semantic.textMuted }]}
              />
              <Text style={text.caption}>Last updated {relativeTime(updatedAt)}</Text>
            </View>
          ) : (
            <Text style={[text.caption, { marginTop: 6 }]}>Your readings will show up here</Text>
          )}
        </View>
        <Pressable onPress={() => router.push("/profile")} accessibilityLabel="Your profile">
          <Avatar seed={user?.profile?.id ?? user?.email} name={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`} size={46} />
        </Pressable>
      </View>

      {/* A brand-new account has nothing to chart, so the screen says what
          would be here and how to fill it, rather than a row of em dashes. */}
      {!hasReadings ? (
        <Reveal index={1}>
          <EmptyState
            icon={<HeartIcon size={22} color={semantic.accentDeep} />}
            title="No readings yet"
            body="Once your band is connected your heart rate, blood pressure and oxygen appear here on their own. Until then, the Health Agent can answer anything."
            action="Connect a band"
            onAction={() => router.push("/profile")}
          />
        </Reveal>
      ) : null}

      {/* Heart rate — the headline reading, on its own mint surface */}
      {heartRate !== null ? (
        <Reveal index={1}>
        <TapScale
          onPress={() => router.push("/vitals/heartRate")}
          accessibilityLabel={`Heart rate, ${heartRate} BPM, ${hrInRange ? "in range" : "out of range"}`}
          style={styles.block}
        >
          <LinearGradient
            {...linearGradient("mint")}
            style={[card, { padding: spacing.md, borderRadius: radii.card }]}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroLeft}>
                {/* On the hero the mark inverts: a solid green disc carrying a
                    white heart, rather than a tinted tile like the small cards. */}
                <LinearGradient {...linearGradient("iconGreen")} style={[iconGreen, { width: 40, height: 40 }]}>
                  <HeartIcon size={20} color={colors.onGreen} />
                </LinearGradient>
                <Text style={styles.heroLabel}>Heart Rate</Text>
              </View>
              <StatusBadge status={hrInRange ? "inrange" : "high"} variant="pill" />
            </View>

            <View style={styles.heroValueRow}>
              <FluidText value={String(heartRate)} style={[styles.heroValue, tabular]} />
              <Text style={styles.heroUnit}>BPM</Text>
            </View>
            <Text style={styles.heroRange}>
              Normal range: {BANDS.heartRate[0]} – {BANDS.heartRate[1]}
            </Text>
            {/* The chart is scaled to its own min and max and labelled with
                both, so the wave is readable as a number and not just a shape.
                Without the labels an auto-scaled line exaggerates a three-beat
                wobble into a mountain range. */}
            <View style={styles.chartRow}>
              <View style={styles.chartAxis}>
                <Text style={styles.axisLabel}>{heroDomain[1]}</Text>
                <Text style={styles.axisLabel}>{heroDomain[0]}</Text>
              </View>
              <Sparkline data={heroSeries} width={heroWidth + 8 - AXIS_W} domain={heroDomain} dot={false} />
            </View>
            {heroPoints.length > 1 ? (
              <View style={[styles.timeRow, { marginLeft: AXIS_W }]}>
                <Text style={styles.axisLabel}>{formatClock(new Date(heroPoints[0].at).toISOString())}</Text>
                <Text style={styles.axisLabel}>
                  {formatClock(new Date(heroPoints[heroPoints.length - 1].at).toISOString())}
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        </TapScale>
        </Reveal>
      ) : null}

      {/* Blood pressure and oxygen — a pair */}
      <Reveal index={2}>
      <View style={styles.pair}>
        {bpSys !== null ? (
          <MetricCard
            label="Blood Pressure"
            value={`${bpSys}/${bpDia ?? "—"}`}
            unit="mmHg"
            status={bpSys > 140 || (bpDia ?? 0) > 90 ? "high" : bpSys > 125 ? "attention" : "normal"}
            metric="bloodPressure"
            icon={<DropletIcon size={19} color={metricTint("bloodPressure").fg} />}
            onPress={() => router.push("/vitals/bloodPressure")}
          />
        ) : null}
        {spo2 !== null ? (
          <MetricCard
            label="Blood Oxygen"
            value={String(spo2)}
            unit="%"
            status={spo2 < 95 ? "low" : "normal"}
            metric="spo2"
            icon={<OxygenIcon size={19} color={metricTint("spo2").fg} />}
            onPress={() => router.push("/vitals/spo2")}
          />
        ) : null}
      </View>
      </Reveal>

      {/* Your Health Agent — what the agent noticed, and the two ways to reply */}
      <Reveal index={3}>
      <LinearGradient {...linearGradient("mint")} style={[card, styles.agent]}>
        <View style={styles.agentTop}>
          <View style={styles.agentTitleRow}>
            <LinearGradient {...linearGradient("iconGreen")} style={[iconGreen, { width: 38, height: 38 }]}>
              <BrandMark size={17} color={colors.onGreen} />
            </LinearGradient>
            <Text style={styles.agentTitle} numberOfLines={1}>
              Your Health Agent
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Read this aloud"
            style={styles.speaker}
          >
            <SpeakerIcon size={16} color={semantic.accentDeep} />
          </Pressable>
        </View>

        <Text style={styles.agentBody}>
          {topInsight?.message
            ? topInsight.message.split(/(?<=\.)\s/).slice(0, 2).join(" ")
            : "Your vitals look steady today. I'll keep watching your trends and let you know if anything changes."}
        </Text>

        <View style={styles.agentActions}>
          <Pressable onPress={() => router.push("/insights")} style={{ flex: 1 }}>
            <LinearGradient {...linearGradient("buttonPrimary")} style={[styles.agentPrimary]}>
              <TrendIcon size={16} color={colors.onGreen} />
              <Text style={styles.agentPrimaryLabel}>View trend</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => router.push("/ai")} style={styles.agentSecondary}>
            <Text style={styles.agentSecondaryLabel}>Ask me</Text>
          </Pressable>
        </View>
      </LinearGradient>
      </Reveal>

      {/* Today's timeline */}
      {timeline.length > 0 ? (
        <Reveal index={4}>
        <View style={{ marginTop: spacing.blockGap }}>
          <View style={styles.sectionHeader}>
            <Text style={text.sectionTitle}>Today's Timeline</Text>
            <Pressable onPress={() => router.push("/vitals")}>
              <Text style={styles.link}>View all</Text>
            </Pressable>
          </View>
          <View style={[card, { overflow: "hidden" }]}>
            {timeline.map((e, i) => (
              <View
                key={`${e.at}-${i}`}
                style={[styles.timelineRow, i > 0 ? styles.timelineDivider : null]}
              >
                <TimelineIcon kind={e.kind} tone={e.tone} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineLabel} numberOfLines={1}>
                    {e.label}
                  </Text>
                  <Text style={styles.timelineValue} numberOfLines={1}>
                    {e.value}
                  </Text>
                </View>
                <Text style={styles.timelineTime}>{formatClock(new Date(e.at).toISOString())}</Text>
              </View>
            ))}
          </View>
        </View>
        </Reveal>
      ) : null}

      {/* Whatever is booked next, so it is never a surprise */}
      {nextAppt ? (
        <Reveal index={5}>
        <View style={{ marginTop: spacing.blockGap }}>
          <Text style={[text.sectionTitle, { marginBottom: spacing.sm }]}>Next Appointment</Text>
          <Pressable onPress={() => router.push("/care?tab=appointments")}>
            <View style={[card, styles.apptRow]}>
              <CategoryTile size={40} gradient="tile" color={semantic.accentDeep}>
                <CalendarIcon size={19} color={semantic.accentDeep} />
              </CategoryTile>
              <View style={{ flex: 1 }}>
                <Text style={styles.apptTitle} numberOfLines={1}>
                  {nextAppt.doctor?.user
                    ? `Dr. ${nextAppt.doctor.user.firstName} ${nextAppt.doctor.user.lastName}`
                    : nextAppt.department || "General Practice"}
                </Text>
                <Text style={styles.apptMeta}>
                  {formatShortDate(nextAppt.scheduledDate)}
                  {nextAppt.scheduledTime ? ` • ${nextAppt.scheduledTime.slice(0, 5)}` : ""}
                </Text>
              </View>
              <StatusBadge status={nextAppt.status} />
            </View>
          </Pressable>
        </View>
        </Reveal>
      ) : null}
    </Screen>
  );
}

/** A compact metric card — icon inline-left, the number as the anchor. */
function MetricCard({
  label,
  value,
  unit,
  status,
  metric,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  unit: string;
  status: string;
  metric: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const tint = metricTint(metric);
  return (
    <TapScale onPress={onPress} style={{ flex: 1 }} accessibilityLabel={`${label}, ${value} ${unit}, ${status}`}>
      <View style={[card, { padding: 14 }]}>
        <View style={styles.metricTop}>
          <LinearGradient
            {...linearGradient(tileGradientName(metric))}
            style={[iconTile, { width: 36, height: 36, borderColor: iconTileBorder[tileToneName(metric)] }]}
          >
            {icon}
          </LinearGradient>
          <Text style={styles.metricLabel} numberOfLines={2}>
            {label}
          </Text>
        </View>
        <View style={styles.metricValueRow}>
          <FluidText value={String(value)} style={[styles.metricValue, tabular]} />
          <Text style={styles.metricUnit}>{unit}</Text>
        </View>
        <View style={{ marginTop: 6 }}>
          <StatusBadge status={status} />
        </View>
      </View>
    </TapScale>
  );
}

function CategoryTile({
  size,
  gradient,
  color,
  children,
}: {
  size: number;
  gradient: keyof typeof gradients;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <LinearGradient {...linearGradient(gradient)} style={[iconTile, { width: size, height: size }]}>
      {children}
    </LinearGradient>
  );
}

function TimelineIcon({ kind, tone }: { kind: "reading" | "agent" | "appointment"; tone: string }) {
  const gradient = kind === "appointment" ? "tile" : kind === "agent" ? "tileAmber" : "tileRose";
  return (
    <LinearGradient {...linearGradient(gradient as keyof typeof gradients)} style={[iconTile, { width: 36, height: 36 }]}>
      {kind === "appointment" ? (
        <CalendarIcon size={19} color={tone} />
      ) : kind === "agent" ? (
        <SparkIcon size={19} color={tone} />
      ) : (
        <HeartIcon size={19} color={tone} />
      )}
    </LinearGradient>
  );
}

/** Home's metric keys map onto the design system's tile tokens. */
function tileGradientName(metric: string): keyof typeof gradients {
  switch (metric) {
    case "heartRate":
      return "tileRose";
    case "spo2":
      return "tileTeal";
    case "temperature":
      return "tileAmber";
    default:
      return "tile";
  }
}

function tileToneName(metric: string) {
  switch (metric) {
    case "heartRate":
      return "rose";
    case "spo2":
      return "teal";
    case "temperature":
      return "amber";
    default:
      return "green";
  }
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center" },
  block: { marginTop: spacing.blockGap },

  greetingRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  greeting: { ...text.pageTitle, fontSize: 22, letterSpacing: -0.02 * 22 },
  statusLine: { ...text.h3, ...font(600), color: semantic.accentDeep, marginTop: 4 },
  updatedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 999 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green50,
    borderWidth: 1,
    borderColor: "rgba(196,224,233,0.9)",
  },
  avatarText: { fontSize: 15, ...font(600), color: semantic.accentDeep },

  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.xs },
  heroLeft: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  heroLabel: { ...text.cardLabel, color: semantic.textPrimary },
  heroValueRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: spacing.xs },
  heroValue: { fontSize: 40, ...font(700), lineHeight: 42, letterSpacing: -0.04 * 40, color: semantic.textPrimary },
  heroUnit: { ...text.cardLabel, color: semantic.textSecondary },
  heroRange: { ...text.caption, color: semantic.textSecondary, marginTop: 6 },
  chartRow: { flexDirection: "row", alignItems: "center", marginTop: 4, marginLeft: -4 },
  /* The value axis is a fixed gutter so the chart width can be computed rather
     than measured — the card is the same width on every render. */
  chartAxis: { width: AXIS_W, height: 72, justifyContent: "space-between", paddingVertical: SPARK_PAD.top },
  axisLabel: { fontSize: 10, lineHeight: 14, color: semantic.textMuted, ...font(500) },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },

  pair: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.blockGap },
  metricTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  metricLabel: { ...text.caption, color: semantic.textPrimary, flex: 1 },
  metricValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 10 },
  metricValue: { fontSize: 28, ...font(700), lineHeight: 30, letterSpacing: -0.035 * 28, color: semantic.textPrimary },
  metricUnit: { ...text.caption, color: semantic.textSecondary },

  agent: { padding: spacing.md, marginTop: spacing.blockGap },
  agentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.xs },
  agentTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  agentTitle: { ...text.h3, ...font(600), color: semantic.textPrimary },
  speaker: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8EF",
    borderWidth: 1,
    borderColor: "rgba(196,224,233,0.8)",
  },
  agentBody: { ...text.secondary, color: semantic.textPrimary, lineHeight: 21, marginTop: spacing.sm },
  agentActions: { flexDirection: "row", gap: 10, marginTop: spacing.md },
  agentPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  agentPrimaryLabel: { ...text.cardLabel, ...font(600), color: colors.onGreen },
  agentSecondary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(133,192,206,0.65)",
  },
  agentSecondaryLabel: { ...text.cardLabel, ...font(600), color: semantic.accentDeep },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  link: { ...text.caption, ...font(600), color: semantic.accentDeep },

  timelineRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 12 },
  timelineDivider: { borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  timelineLabel: { ...text.cardLabel, ...font(600), color: semantic.textPrimary },
  timelineValue: { ...text.caption, color: semantic.textSecondary },
  timelineTime: { fontSize: 11.5, color: semantic.textMuted },

  apptRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  apptTitle: { ...text.body, ...font(600), color: semantic.textPrimary },
  apptMeta: { ...text.caption, color: semantic.textSecondary, marginTop: 2 },
});
