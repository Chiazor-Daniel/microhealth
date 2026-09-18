import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { WatchIcon, ChevronRightIcon, GlyphIcon } from "../icons";
import { usePatientData } from "../../hooks/usePatientData";
import { useAuth } from "../../hooks/useAuth";
import { useWearable } from "../hooks/useWearable";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { patientTheme } from "../theme";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { MetricTile } from "../components/MetricTile";
import { buildSeries } from "../lib/timeSeries";
import { CATEGORY_ORDER, CATEGORY_LABEL, metricsIn, type Metric } from "../../../metrics/registry";
import { resolveAll, type MetricValue } from "../../../metrics/readings";

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
    <div className="grid grid-cols-3 gap-2 mt-3">
      {windows.map((w) => (
        <div
          key={w.label}
          className="rounded-2xl px-2.5 py-2"
          style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(196,224,233,0.7)" }}
        >
          <p className="text-[10.5px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
            {w.label}
          </p>
          <p
            className="text-[15px] font-bold mt-0.5"
            style={{ color: patientTheme.colors.textPrimary, fontVariantNumeric: "tabular-nums" }}
          >
            {w.value ?? "—"}
            <span className="text-[10px] font-medium ml-0.5" style={{ color: patientTheme.colors.textSecondary }}>
              bpm
            </span>
          </p>
        </div>
      ))}
    </div>
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
function NotRecording({ metrics, onClick }: { metrics: Metric[]; onClick: (m: Metric) => void }) {
  const [open, setOpen] = useState(false);
  if (!metrics.length) return null;

  return (
    <div className="mh-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="text-[12.5px] font-medium block" style={{ color: patientTheme.colors.textSecondary }}>
            {metrics.length} more {metrics.length === 1 ? "measure" : "measures"} not recording yet
          </span>
          {/* The names, so the breadth is visible without expanding. Truncated
              to one line because this is a hint, not an inventory. */}
          <span
            className="text-[11px] block truncate mt-0.5"
            style={{ color: patientTheme.colors.textMuted }}
          >
            {metrics.map((m) => m.label).join(" · ")}
          </span>
        </span>
        <span
          className="flex-shrink-0 mt-1"
          style={{
            color: patientTheme.colors.textMuted,
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 0.16s ease",
          }}
        >
          <ChevronRightIcon size={16} />
        </span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${patientTheme.colors.hairlineSoft}` }}>
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => onClick(m)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
              style={{ borderTop: `1px solid ${patientTheme.colors.hairlineSoft}` }}
            >
              <span className="mh-icon w-8 h-8" style={{ color: patientTheme.colors.textMuted }}>
                <GlyphIcon name={m.icon} size={15} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="text-[12.5px] block truncate" style={{ color: patientTheme.colors.textSecondary }}>
                  {m.label}
                </span>
                <span className="text-[10.5px] block" style={{ color: patientTheme.colors.textMuted }}>
                  {CATEGORY_LABEL[m.category]} · {m.cadence === "interval" ? "on demand" : m.cadence}
                </span>
              </span>
              <span className="text-[11px] flex-shrink-0" style={{ color: patientTheme.colors.textMuted }}>
                No readings
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Vitals() {
  const { user } = useAuth();
  const { vitals: existingVitals, metricRecords, loading, error, refresh } = usePatientData();
  const { latest: wearableLatest } = useWearable(user?.profile?.id, true);
  const navigate = useNavigate();
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
    if (!metric.read) return [];
    return buildSeries(vitals, tab, (v) => metric.read!(v)).map((p) => p.value as number);
  };

  /* Everything the registry defines that has nothing to show yet, gathered
     across every category so it can be one row at the foot of the screen. */
  const allMissing = useMemo(() => allValues.filter((v) => v.value == null).map((v) => v.metric), [allValues]);

  const openMetric = (metric: Metric) => {
    if (metric.category === "labs") navigate("/patient/care/labs");
    else navigate(`/patient/vitals/${metric.key}`);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header — the title is the axis of the screen, so it centres */}
      <div className="relative flex items-center justify-center">
        <h1
          className="text-[22px] font-semibold"
          style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}
        >
          Vitals
        </h1>
        <span
          className="absolute right-0 flex items-center justify-center w-10 h-10"
          style={{ color: patientTheme.colors.textSecondary }}
          title="MicroHealth Band"
        >
          <WatchIcon size={20} />
        </span>
      </div>

      <SegmentedTabs options={tabs as unknown as { value: TabValue; label: string }[]} value={tab} onChange={setTab} />

      {/* Sections, in the registry's own order, so adding a category is a
          registry change rather than a screen change. */}
      {CATEGORY_ORDER.map((category) => {
        const inCategory = metricsIn(category).map((m) => byKey.get(m.key)!).filter(Boolean);
        if (!inCategory.length) return null;

        const present = inCategory.filter((v) => v.value != null);
        /* A category with nothing recorded gets no header — announcing an
           empty section is worse than saying nothing. It is collected into
           the single "not recording" block below instead. */
        if (!present.length) return null;

        /* The first metric of a section carries it, so it gets the full width.
           After that the cards pair up — and if what remains is an odd number,
           the last one takes the full width too, rather than leaving a hole
           beside it. */
        const rest = present.length - 1;
        const spansFull = (i: number) => i === 0 || (rest % 2 === 1 && i === present.length - 1);

        return (
          <section key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
                {CATEGORY_LABEL[category]}
              </h2>
              {category === "labs" && (
                <button
                  onClick={() => navigate("/patient/care/labs")}
                  className="text-[12.5px] font-semibold"
                  style={{ color: patientTheme.colors.brandDeep }}
                >
                  View results
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 items-stretch">
              {present.map((mv, i) => (
                <div key={mv.metric.key} className={spansFull(i) ? "col-span-2" : ""}>
                  <MetricTile
                    mv={mv}
                    size={spansFull(i) ? "hero" : "tile"}
                    series={sparkFor(mv.metric)}
                    /* Vitals compares cards side by side, so every one states
                       its range state — including "Normal". Home does not. */
                    alwaysStatus
                    extra={
                      mv.metric.key === "heartRate" ? (
                        <HeartRateWindows vitals={vitals} latest={mv.value} />
                      ) : undefined
                    }
                    onClick={() => openMetric(mv.metric)}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* One row for everything the registry knows and nothing is recording. */}
      <NotRecording metrics={allMissing} onClick={openMetric} />
    </motion.div>
  );
}
