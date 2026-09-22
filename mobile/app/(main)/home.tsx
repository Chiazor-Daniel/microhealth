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
import { vitalService } from "@app/services/vital.service";
import { buildSeries } from "@app/patient/lib/timeSeries";
import { resolveAll, toScoreReadings, recordsBefore, type MetricValue } from "@metrics/readings";
import { computeHealthScore } from "@metrics/healthScore";
import type { Metric } from "@metrics/registry";

import { Screen } from "@/ui/Screen";
import { Reveal, TapScale } from "@/ui/motion";
import { StatusBadge } from "@/ui/StatusBadge";
import { Sparkline, sparkDomain, SPARK_PAD } from "@/ui/Sparkline";
import { BrandMark } from "@/ui/BrandMark";
import { Avatar } from "@/ui/Avatar";
import { EmptyState } from "@/ui/EmptyState";
import { ErrorState } from "@/ui/ErrorState";
import { HeroSkeleton, TilePairSkeleton, RowSkeleton } from "@/ui/Skeleton";
import { OfflinePanel, StaleStrip } from "@/ui/OfflineNotice";
import { useIsOffline } from "@/lib/connectivity";
import { useBandConnected } from "@/lib/band";
import { FluidText } from "@/ui/FluidText";
import { MetricTile } from "@/ui/MetricTile";
import { ScoreRing, ScoreBandChip, ScoreDelta, scoreVerdict } from "@/ui/HealthScore";
import { card, iconGreen, iconTile, iconTileBorder, tabular, washCard } from "@/ui/styles";
import { formatClock, formatShortDate, greeting, relativeTime } from "@/ui/dates";
import {
  CalendarIcon,
  ChevronRightIcon,
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
  const { vitals: existingVitals, appointments, metricRecords, loading: dataLoading, error: dataError, refresh } = usePatientData();
  const offline = useIsOffline();
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

  const hasReadings = sourceVitals.length > 0;

  /* Every metric the registry defines, resolved against the packet and the
     patient's episodic records — the same call the Vitals screen makes, so the
     two can never disagree about what the current heart rate is. */
  const allValues = useMemo(() => resolveAll(latest, metricRecords), [latest, metricRecords]);
  const byKey = useMemo(() => new Map(allValues.map((v) => [v.metric.key, v])), [allValues]);

  const score = useMemo(() => computeHealthScore(toScoreReadings(allValues)), [allValues]);

  /* Yesterday's packet, fetched on its own. The reading list is capped at 30
     rows and the band ticks every few seconds, so it is only ever minutes
     deep — a day-over-day comparison cannot be made from it. */
  const [priorPacket, setPriorPacket] = useState<any>(null);
  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    vitalService
      .getSnapshotBefore(patientId)
      .then((row) => { if (!cancelled) setPriorPacket(row); })
      /* A missing delta is not worth an error state — the card renders
         perfectly well without it, and it simply does not appear. */
      .catch(() => {});
    return () => { cancelled = true; };
  }, [patientId]);

  const scoreDelta = useMemo(() => {
    if (!priorPacket || score.score == null) return null;
    const priorScore = computeHealthScore(
      toScoreReadings(resolveAll(priorPacket, recordsBefore(metricRecords)))
    );
    if (priorScore.score == null) return null;
    return score.score - priorScore.score;
  }, [priorPacket, metricRecords, score]);

  const heartRate = byKey.get("heartRate");
  /* Blood pressure, oxygen and respiration — what the band is reading right
     now, beside the heart rate. */
  const live = ["bloodPressure", "spo2", "respiratoryRate"]
    .map((k) => byKey.get(k))
    .filter((v): v is MetricValue => !!v && v.value != null);
  /* The day's rollups, which accumulate rather than being sampled. */
  const today = ["steps", "calories", "sleep"]
    .map((k) => byKey.get(k))
    .filter((v): v is MetricValue => !!v && v.value != null);

  /** The day's series for any metric the registry can read out of the packet. */
  const sparkFor = (metric: Metric) => {
    if (!metric.read) return undefined;
    return buildSeries(sourceVitals, "day", (v) => metric.read!(v)).map((p) => p.value as number);
  };

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
      tone: TimelineTone;
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
        tone: v.heartRate > 100 || v.heartRate < 55 ? "rose" : "signal",
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
        tone: "brand",
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
          tone: "amber",
          kind: "agent",
        });
      }
    }

    return entries.sort((a, b) => b.at - a.at).slice(0, 5);
  }, [sourceVitals, appointments, topInsight]);

  if (dataLoading && !sourceVitals.length) {
    return (
      <Screen>
        <View style={{ gap: spacing.sm }}>
          <HeroSkeleton />
          <TilePairSkeleton />
          <RowSkeleton rows={2} />
        </View>
      </Screen>
    );
  }


  return (
    <Screen>
      {/* Stale data stays on screen; the strip says why it isn't fresh. */}
      {dataError && hasReadings ? <StaleStrip onRetry={refresh} /> : null}
      {/* Greeting — the state of things is the second line, in green */}
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greeting()}, {user?.firstName || "there"}
          </Text>
          {hasReadings ? (
            <View style={styles.updatedRow}>
              <View
                style={[styles.dot, { backgroundColor: wearableConnected ? semantic.signal : semantic.textMuted }]}
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
          would be here and how to fill it, rather than a row of em dashes.
          A failed load is not an empty account: offline gets the slate panel,
          other failures the red state. */}
      {dataError && !hasReadings ? (
        offline ? (
          <OfflinePanel onRetry={refresh} />
        ) : (
          <ErrorState message={dataError} onRetry={refresh} />
        )
      ) : !hasReadings ? (
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

      {/* The one number that answers "am I okay". The ring shows where you
          are, the delta shows whether that is better or worse — see
          HealthScore.tsx for why the ring only works with both. */}
      <Reveal index={1}>
        <TapScale
          onPress={() => router.push("/vitals")}
          accessibilityLabel={`Health score ${score.score ?? "unavailable"} out of 100`}
          style={styles.block}
        >
          <View style={[card, { padding: spacing.md }]}>
            <View style={styles.scoreHead}>
              <Text style={styles.scoreTitle}>Health Score</Text>
              <ScoreBandChip band={score.band} />
            </View>

            <View style={styles.scoreRow}>
              <ScoreRing result={score} size={104} />
              <View style={styles.scoreText}>
                <ScoreDelta delta={scoreDelta} />
                <Text style={styles.scoreLine}>{scoreVerdict(score, scoreDelta).line}</Text>
                <Text style={styles.scoreSub}>{scoreVerdict(score, scoreDelta).sub}</Text>
              </View>
            </View>
          </View>
        </TapScale>
      </Reveal>

      {/* Heart rate — the headline live reading */}
      {heartRate ? (
        <Reveal index={1}>
          <View style={styles.block}>
            <MetricTile
              mv={heartRate}
              size="hero"
              series={sparkFor(heartRate.metric)}
              onPress={() => router.push("/vitals/heartRate")}
            />
          </View>
        </Reveal>
      ) : null}

      {/* The rest of what is live right now. An odd count would leave the last
          tile with a gap beside it, so it takes the full width instead. */}
      {live.length ? (
        <Reveal index={2}>
          <View style={styles.liveGrid}>
            {live.map((mv, i) => (
              <View
                key={mv.metric.key}
                style={[
                  styles.liveCell,
                  live.length % 2 === 1 && i === live.length - 1 ? styles.liveCellFull : null,
                ]}
              >
                <MetricTile
                  mv={mv}
                  size="tile"
                  series={sparkFor(mv.metric)}
                  onPress={() => router.push(`/vitals/${mv.metric.key}`)}
                />
              </View>
            ))}
          </View>
        </Reveal>
      ) : null}

      {/* Today's rollups. Deliberately a separate row from the live strip: a
          step count accumulates across a day while a heart rate is sampled
          right now, and showing them as the same kind of tile invites reading
          them as the same kind of fact. */}
      {today.length ? (
        <Reveal index={3}>
          <View style={{ marginTop: spacing.blockGap }}>
            <View style={styles.sectionHeader}>
              <Text style={text.sectionTitle}>Today</Text>
            </View>
            <View style={styles.todayRow}>
              {today.map((mv) => (
                <View key={mv.metric.key} style={{ flex: 1 }}>
                  <MetricTile
                    mv={mv}
                    size="mini"
                    onPress={() => router.push(`/vitals/${mv.metric.key}`)}
                  />
                </View>
              ))}
            </View>
          </View>
        </Reveal>
      ) : null}

      {/* Your Health Agent — what the agent noticed, and the two ways to reply */}
      <Reveal index={3}>
      <LinearGradient {...linearGradient("mint")} style={[washCard, styles.agent]}>
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
            <LinearGradient
              colors={["#EAF3F7", "#DCEAF1"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
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

/**
 * What a timeline row's colour is saying.
 *
 * The tile and the glyph must agree, and the colour must mean something:
 *
 *   brand   an appointment is *structure* — it answers "what is this", so it
 *           wears the brand teal like every other piece of chrome.
 *   signal  a reading that sits in range. That IS a verdict, so it is leaf.
 *   rose    a reading outside range.
 *   amber   the agent, which is neither.
 *
 * This used to pick the tile from `kind` and the colour from a separate field,
 * which put a leaf-green calendar on a teal tile and a leaf-green heart on a
 * rose one — every icon on the timeline rendered green regardless of its
 * container, reading as leftover from the old single-green palette.
 */
const TIMELINE_TONE = {
  brand: { fg: semantic.brandDeep, tile: "tile", border: "brand" },
  signal: { fg: semantic.signalDeep, tile: "tileLeaf", border: "leaf" },
  rose: { fg: colors.rose, tile: "tileRose", border: "rose" },
  amber: { fg: colors.amber, tile: "tileAmber", border: "amber" },
} as const;

type TimelineTone = keyof typeof TIMELINE_TONE;

function TimelineIcon({ kind, tone }: { kind: "reading" | "agent" | "appointment"; tone: TimelineTone }) {
  const t = TIMELINE_TONE[tone];
  return (
    <LinearGradient
      {...linearGradient(t.tile as keyof typeof gradients)}
      style={[iconTile, { width: 36, height: 36, borderColor: iconTileBorder[t.border] }]}
    >
      {kind === "appointment" ? (
        <CalendarIcon size={19} color={t.fg} />
      ) : kind === "agent" ? (
        <SparkIcon size={19} color={t.fg} />
      ) : (
        <HeartIcon size={19} color={t.fg} />
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
    /* Web draws this as `linear-gradient(180deg, #EAF3F7, #DCEAF1)`. It was a
       flat `#EAF8EF` — the old mint, left behind when the palette moved to
       teal, and sitting on an otherwise-teal card it read as a stray green. */
    borderWidth: 1,
    borderColor: "rgba(196,224,233,0.8)",
    overflow: "hidden",
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
  /* ---- Health score ---- */
  scoreHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  scoreText: { flex: 1, minWidth: 0 },
  scoreLine: { fontSize: 13.5, ...font(600), color: semantic.textPrimary, marginTop: spacing.xs, lineHeight: 19 },
  scoreSub: { fontSize: 12.5, ...font(400), color: semantic.textSecondary, marginTop: 3, lineHeight: 18 },
  scoreTitle: { fontSize: 13.5, ...font(600), color: semantic.textPrimary },
  scoreValue: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 },
  scoreNumber: { fontSize: 46, ...font(700), lineHeight: 48, letterSpacing: -0.045 * 46, color: semantic.textPrimary },
  scoreOutOf: { fontSize: 12, ...font(500), color: semantic.textMuted },
  scoreBody: { fontSize: 12.5, ...font(400), color: semantic.textSecondary, lineHeight: 18, marginTop: spacing.sm },
  scoreFoot: { fontSize: 10.5, ...font(400), color: semantic.textMuted, marginTop: 6 },

  /* ---- The live strip, two to a row ---- */
  liveGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.blockGap },
  liveCell: { width: "48%", flexGrow: 1 },
  /* An odd count would leave the last tile with a gap beside it, so it takes
     the full width instead. */
  liveCellFull: { width: "100%" },

  /* ---- Today's rollups, three to a row ---- */
  todayRow: { flexDirection: "row", gap: spacing.xs, alignItems: "stretch" },


});
