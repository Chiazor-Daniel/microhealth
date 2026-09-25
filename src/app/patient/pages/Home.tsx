import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { useInsights } from "../hooks/useInsights";
import { dashboardService } from "../../services/dashboard.service";
import { vitalService } from "../../services/vital.service";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { Avatar } from "../components/Avatar";
import { FluidText } from "../components/FluidText";
import { patientTheme } from "../theme";
import { StatusBadge } from "../components/StatusBadge";
import { useWearable } from "../hooks/useWearable";
import { BrandMark } from "../components/BrandMark";
import { ScoreRing, ScoreBandChip, ScoreDelta, scoreVerdict } from "../components/HealthScore";
import { MetricTile } from "../components/MetricTile";
import { GlyphIcon, HeartIcon, CalendarIcon, SparkIcon, SpeakerIcon, TrendIcon, ChevronRightIcon } from "../icons";
import { resolveAll, toScoreReadings, recordsBefore, currentVitals, type MetricValue } from "../../../metrics/readings";
import { computeHealthScore } from "../../../metrics/healthScore";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { buildSeries } from "../lib/timeSeries";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function relativeTime(iso?: string) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function clockTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * The value range a series is drawn across.
 *
 * Scaled to the series' own min and max rather than anchored at zero. Zero is
 * the conventional choice and the wrong one for a vital sign: a resting heart
 * rate sitting at 72 ± 3 bpm draws as a dead flat line against a 0–100 axis,
 * and the whole point of the chart is to show that it *is* moving.
 */
function sparkDomain(data: number[]): [number, number] {
  if (!data.length) return [0, 1];
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  return lo === hi ? [lo - 1, hi + 1] : [lo, hi];
}

/** Width of the chart's value gutter. */
const HERO_AXIS_W = 26;

/**
 * The whisper of teal under the hero line — no axes, no chrome.
 *
 * No dots: with a reading every few seconds the points crowd into a string of
 * beads and the line stops reading as a line.
 */
function HeroSpark({ data, domain }: { data: number[]; domain: [number, number] }) {
  if (data.length < 2) return <div style={{ height: 72 }} />;
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={72}>
      <AreaChart data={points} margin={{ top: 6, right: 4, left: 0, bottom: 6 }}>
        <defs>
          <linearGradient id="mhHeroGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={patientTheme.colors.brand} stopOpacity={0.30} />
            <stop offset="70%" stopColor={patientTheme.colors.brand} stopOpacity={0.07} />
            <stop offset="100%" stopColor={patientTheme.colors.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={domain} />
        <Area
          type="monotone"
          dataKey="v"
          stroke={patientTheme.colors.brand}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="url(#mhHeroGradient)"
          dot={false}
          activeDot={false}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
          className="mh-chart-line"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** A compact live tile — icon, label, the number as the anchor. */
function LiveTile({ mv, series, onClick }: { mv: MetricValue; series?: number[]; onClick: () => void }) {
  return <MetricTile mv={mv} size="tile" series={series} onClick={onClick} />;
}

/**
 * Today's rollups — steps, calories, the night's sleep.
 *
 * These are the numbers people actually check daily, and they are deliberately
 * *not* mixed in with the live strip above: a step count accumulates across a
 * day while a heart rate is sampled right now, and showing them as the same
 * kind of tile invites reading them as the same kind of fact.
 */
function TodayRow({ items, onOpen }: { items: MetricValue[]; onOpen: (mv: MetricValue) => void }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-[15px] font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
        Today
      </h2>
      <div className="grid grid-cols-3 gap-2.5 items-stretch">
        {items.map((mv) => (
          <MetricTile key={mv.metric.key} mv={mv} size="mini" onClick={() => onOpen(mv)} />
        ))}
      </div>
    </section>
  );
}

/**
 * What a timeline row's colour is saying.
 *
 * The tile and the icon must agree, and the colour must mean something:
 *
 *   brand   an appointment is *structure* — it answers "what is this", so it
 *           wears the brand teal like every other piece of chrome.
 *   signal  a reading that sits in range. That IS a verdict, so it is leaf.
 *   rose    a reading outside range.
 *   amber   the agent, which is neither.
 *
 * This used to be a colour per row plus a tile per kind, chosen separately —
 * which put a leaf-green calendar on a teal tile and a leaf-green heart on a
 * rose one. Every icon on the timeline rendered green regardless of its
 * container, which read as leftover from the old single-green palette.
 */
const TIMELINE_TONE = {
  brand: { fg: patientTheme.colors.brandDeep, tile: patientTheme.gradients.tile },
  signal: { fg: patientTheme.colors.signalDeep, tile: patientTheme.gradients.tileLeaf },
  rose: { fg: patientTheme.colors.rose, tile: patientTheme.gradients.tileRose },
  amber: { fg: patientTheme.colors.amber, tile: patientTheme.gradients.tileAmber },
} as const;

type TimelineTone = keyof typeof TIMELINE_TONE;

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vitals: existingVitals, appointments, metricRecords, loading: dataLoading, error: dataError } = usePatientData();
  const patientId = user?.profile?.id;
  const { latest: wearableLatest, connected: wearableConnected } = useWearable(patientId, true);
  const { insights } = useInsights();

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardService.getPatientDashboard()
      .then((d) => { if (!cancelled) setDashboard(d); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const sourceVitals = useMemo(
    () =>
      wearableLatest
        ? [{ id: "wearable-latest", ...wearableLatest, recordedAt: wearableLatest.timestamp } as any, ...existingVitals]
        : existingVitals,
    [wearableLatest, existingVitals]
  );

  const current: any = currentVitals(sourceVitals);
  const updatedAt = wearableLatest?.timestamp ?? current?.recordedAt;

  /* Every metric the registry knows, resolved — the same call the Vitals
     screen makes, so the two can never disagree about what the current heart
     rate is. */
  const values = useMemo(() => resolveAll(current, metricRecords), [current, metricRecords]);
  const byKey = useMemo(() => new Map(values.map((v) => [v.metric.key, v])), [values]);

  const score = useMemo(() => computeHealthScore(toScoreReadings(values)), [values]);

  /* Yesterday's packet, fetched on its own.
     The reading list is capped at 30 rows and the band ticks every few
     seconds, so it is only ever minutes deep — a day-over-day comparison
     cannot be made from it. One row is all a delta needs. */
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
  const live = ["spo2", "bloodPressure", "respiratoryRate"]
    .map((k) => byKey.get(k))
    .filter((v): v is MetricValue => !!v && v.value != null);

  const today = ["steps", "calories", "sleep"]
    .map((k) => byKey.get(k))
    .filter((v): v is MetricValue => !!v && v.value != null);

  const heroSeries = useMemo(
    () => buildSeries(sourceVitals, "day", (v: any) => v.heartRate, 24).map((p) => p.value as number),
    [sourceVitals]
  );
  const heroDomain = useMemo(() => sparkDomain(heroSeries), [heroSeries]);

  /** The day's series for any metric the registry can read out of the packet. */
  const sparkFor = (metric: MetricValue["metric"]) => {
    if (!metric.read) return undefined;
    return buildSeries(sourceVitals, "day", (v) => metric.read!(v)).map((p) => p.value as number);
  };

  const topInsight = insights[0];
  const nextAppt = dashboard?.nextAppointment || appointments[0];

  /**
   * Today, in order. The same three things the day is actually made of —
   * what the body did, what was taken, what is scheduled.
   */
  const timeline = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const isToday = (ms: number) => ms >= startOfDay.getTime();
    const seen = new Set<string>();

    const entries: { at: number; label: string; value: string; tone: TimelineTone; kind: "reading" | "agent" | "appointment" }[] = [];

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
        /* A reading's tone is a *status*, so it takes the signal colour. */
        tone: v.heartRate > 100 || v.heartRate < 55 ? "rose" : "signal",
        kind: "reading",
      });
      if (entries.filter((e) => e.kind === "reading").length >= 3) break;
    }

    for (const a of appointments ?? []) {
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
        entries.push({ at: ms, label: "Health Agent", value: "Checked in on your trends", tone: "amber", kind: "agent" });
      }
    }

    return entries.sort((a, b) => b.at - a.at).slice(0, 5);
  }, [sourceVitals, appointments, topInsight]);

  if (loading || dataLoading) return <Loading />;
  if (error || dataError) return <ErrorState message={error || dataError || "Failed to load"} />;

  return (
    <motion.div
      className="space-y-5"
    >
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[22px] font-semibold leading-tight" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
            {getGreeting()}, {user?.firstName || "there"}
          </p>
          <p className="text-[12px] mt-1.5 flex items-center gap-1.5" style={{ color: patientTheme.colors.textMuted }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                /* A pairing indicator is a *status*, so it takes the signal
                   colour, not the brand. */
                background: wearableConnected ? patientTheme.colors.signal : patientTheme.colors.textMuted,
                display: "inline-block",
              }}
            />
            Last updated {relativeTime(updatedAt)}
          </p>
        </div>
        <button onClick={() => navigate("/patient/profile")} aria-label="Your profile">
          <Avatar seed={user?.profile?.id ?? user?.email} name={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`} size={46} />
        </button>
      </div>

      {/* The one number that answers "am I okay". The ring shows where you
          are, the delta shows whether that is better or worse — see
          HealthScore.tsx for why the ring only works with both. */}
      <button
        onClick={() => navigate("/patient/vitals")}
        className="mh-card w-full text-left block"
        style={{ padding: 16 }}
        aria-label={`Health score ${score.score ?? "unavailable"} out of 100, ${score.band ?? "no data"}. ${scoreVerdict(score, scoreDelta).line}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13.5px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
            Health Score
          </p>
          <ScoreBandChip band={score.band} />
        </div>

        <div className="flex items-center gap-4 mt-3">
          <ScoreRing result={score} size={104} />
          <div className="min-w-0 flex-1">
            <ScoreDelta delta={scoreDelta} />
            <p className="text-[13.5px] font-semibold mt-2 leading-snug" style={{ color: patientTheme.colors.textPrimary }}>
              {scoreVerdict(score, scoreDelta).line}
            </p>
            <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: patientTheme.colors.textSecondary }}>
              {scoreVerdict(score, scoreDelta).sub}
            </p>
          </div>
        </div>
      </button>

      {/* Heart rate — the headline live reading */}
      {heartRate && heartRate.value != null && (
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate("/patient/vitals/heartRate")}
          className="mh-card w-full text-left block"
          style={{ padding: 16, background: patientTheme.gradients.wash }}
          aria-label={`Heart rate, ${heartRate.value} BPM, ${heartRate.statusText}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {/* The hero inverts the mark: a solid brand disc carrying a white
                  heart, rather than a tinted tile like the small cards. */}
              <span className="mh-icon-brand flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                <HeartIcon size={20} />
              </span>
              <p className="text-[13px] font-medium" style={{ color: patientTheme.colors.textPrimary }}>
                Heart Rate
              </p>
            </div>
            {heartRate.status !== "normal" && <StatusBadge status={heartRate.status} variant="pill" />}
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <FluidText
              value={String(heartRate.value)}
              style={{
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: patientTheme.colors.textPrimary,
                fontVariantNumeric: "tabular-nums",
              }}
            />
            <span className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>
              BPM
            </span>
          </div>
          <p className="text-[12px] mt-1.5 font-medium" style={{ color: patientTheme.colors.textSecondary }}>
            Normal range: {heartRate.metric.band.low} – {heartRate.metric.band.high}
          </p>
          <div className="mt-1 -mx-1 flex items-stretch gap-1">
            <div className="flex flex-col justify-between flex-shrink-0" style={{ width: HERO_AXIS_W, paddingTop: 6, paddingBottom: 6 }}>
              <span className="text-[10px] font-medium" style={{ color: patientTheme.colors.textMuted }}>{heroDomain[1]}</span>
              <span className="text-[10px] font-medium" style={{ color: patientTheme.colors.textMuted }}>{heroDomain[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <HeroSpark data={heroSeries} domain={heroDomain} />
            </div>
          </div>
        </motion.button>
      )}

      {/* The rest of what is live right now. An odd count would leave the last
          tile with a gap beside it, so it takes the full width instead. */}
      {live.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 items-stretch">
          {live.map((mv, i) => (
            <div
              key={mv.metric.key}
              className={live.length % 2 === 1 && i === live.length - 1 ? "col-span-2" : ""}
            >
              <LiveTile
                mv={mv}
                series={sparkFor(mv.metric)}
                onClick={() => navigate(`/patient/vitals/${mv.metric.key}`)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Today's rollups */}
      {today.length > 0 && (
        <TodayRow items={today} onOpen={(mv) => navigate(`/patient/vitals/${mv.metric.key}`)} />
      )}

      {/* Your Health Agent */}
      <section className="mh-card" style={{ padding: 16, background: patientTheme.gradients.wash }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="mh-icon-brand flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38 }}>
              <BrandMark size={17} />
            </span>
            <p className="text-[15px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
              Your Health Agent
            </p>
          </div>
          <button
            aria-label="Read this aloud"
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              color: patientTheme.colors.brandDeep,
              background: "linear-gradient(180deg, #EAF3F7 0%, #DCEAF1 100%)",
              border: "1px solid rgba(196, 224, 233, 0.8)",
            }}
          >
            <SpeakerIcon size={16} />
          </button>
        </div>

        <p className="text-[13px] leading-relaxed mt-3" style={{ color: patientTheme.colors.textPrimary }}>
          {topInsight?.message
            ? `${topInsight.message.split(/(?<=\.)\s/).slice(0, 2).join(" ")}`
            : "Your vitals look steady today. I'll keep watching your trends and let you know if anything changes."}
        </p>

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => navigate("/patient/insights")}
            className="mh-btn-primary flex-1 py-2.5 text-[13px] font-semibold flex items-center justify-center gap-1.5"
          >
            <TrendIcon size={16} />
            View trend
          </button>
          <button onClick={() => navigate("/patient/ai")} className="mh-btn-secondary flex-1 py-2.5 text-[13px] font-semibold">
            Ask me
          </button>
        </div>
      </section>

      {/* Today's timeline */}
      {timeline.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
              Today's Timeline
            </h2>
            <button onClick={() => navigate("/patient/vitals")} className="text-[13px] font-semibold" style={{ color: patientTheme.colors.brandDeep }}>
              View all
            </button>
          </div>
          <div className="mh-card overflow-hidden">
            {timeline.map((e, i) => (
              <div
                key={`${e.at}-${i}`}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${patientTheme.colors.hairlineSoft}` }}
              >
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: TIMELINE_TONE[e.tone].tile,
                    color: TIMELINE_TONE[e.tone].fg,
                  }}
                >
                  {e.kind === "appointment" ? <CalendarIcon size={19} /> : e.kind === "agent" ? <SparkIcon size={19} /> : <HeartIcon size={19} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>{e.label}</p>
                  <p className="text-[12px] truncate" style={{ color: patientTheme.colors.textSecondary }}>{e.value}</p>
                </div>
                <span className="text-[11.5px] flex-shrink-0" style={{ color: patientTheme.colors.textMuted }}>
                  {clockTime(e.at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Whatever is booked next, so it is never a surprise */}
      {nextAppt && (
        <section>
          <h2 className="text-[16px] font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
            Next Appointment
          </h2>
          <button onClick={() => navigate("/patient/care/appointments")} className="mh-card w-full text-left p-4 flex items-center gap-3">
            <span className="mh-icon w-10 h-10" style={{ color: patientTheme.colors.brandDeep, background: patientTheme.gradients.tile }}>
              <CalendarIcon size={19} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                {nextAppt.doctor?.user
                  ? `Dr. ${nextAppt.doctor.user.firstName} ${nextAppt.doctor.user.lastName}`
                  : nextAppt.department || "General Practice"}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
                {new Date(nextAppt.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                {nextAppt.scheduledTime ? ` • ${nextAppt.scheduledTime.slice(0, 5)}` : ""}
              </p>
            </div>
            <StatusBadge status={nextAppt.status} />
          </button>
        </section>
      )}
    </motion.div>
  );
}
