import { type ReactNode } from "react";
import { motion } from "motion/react";
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from "recharts";
import { patientTheme } from "../theme";
import { GlyphIcon } from "../icons";
import type { MetricValue } from "../../../metrics/readings";

/**
 * The metric tile — one card, one anatomy, three sizes.
 *
 * Home and Vitals used to draw the same card three different ways: a hero on
 * Home, a live tile beside it, a mini in the Today row, and a fourth variant
 * on Vitals. They drifted, and the drift was visible — a status chip that sat
 * in the header on one screen and in its own row on another meant Home's cards
 * grew taller the moment a reading needed a "Watch", and the grid stopped
 * lining up.
 *
 * So there is one anatomy, always in this order:
 *
 *     [icon] label
 *     value unit ................... [status]
 *     parts
 *     chart / extra
 *
 * Two rules make it hold:
 *
 * **The label gets the whole header.** The status used to sit there, and in a
 * half-width tile that left "Blood Pres…" fighting a chip for the same line —
 * a label truncated to the point of not naming the metric is worse than no
 * label. The status moved down to the value row, where there is room for both.
 *
 * **Nothing appears at a size too small to carry it.** Parts and status are
 * dropped at `mini`, where a three-up tile is ~150px wide; a night's four
 * stages stacked one per line stretched that tile to three times its
 * neighbours and dragged the whole row with it.
 *
 * **Every tile is `h-full`.** Grid items stretch, so a short card beside a tall
 * one fills its row rather than floating in the middle of it.
 */

export type TileSize = "hero" | "tile" | "mini";

/** Compact is a shorthand: no disc, no parts, no status — value and name only. */
const SPEC: Record<
  TileSize,
  { pad: number; icon: number; disc: number; label: number; value: number; unit: number; spark: number; gap: number; chip: number }
> = {
  /* The lead card of a section — full width, room for a chart and its parts. */
  hero: { pad: 16, icon: 20, disc: 44, label: 13, value: 34, unit: 12.5, spark: 46, gap: 12, chip: 11 },
  /* The standard card: two to a row. */
  tile: { pad: 13, icon: 16, disc: 34, label: 11.5, value: 22, unit: 11, spark: 32, gap: 9, chip: 10 },
  /* Today's rollups — three to a row, so only the essentials survive. */
  mini: { pad: 12, icon: 17, disc: 0, label: 10.5, value: 19, unit: 10, spark: 0, gap: 8, chip: 0 },
};

/**
 * The reading's own sparkline — a single luminous line with a whisper of fill.
 *
 * Scaled to the series' own range rather than anchored at zero: a vital that
 * holds steady inside a narrow band still has a shape, and a zero-anchored
 * axis flattens it into a straight line that says nothing.
 */
function Spark({ data, height }: { data: number[]; height: number }) {
  if (height <= 0 || data.length < 2) return null;
  const points = data.map((v, i) => ({ i, v }));
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const id = `mhSpark${height}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 5, right: 2, left: 2, bottom: 5 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={patientTheme.colors.brand} stopOpacity={0.26} />
            <stop offset="60%" stopColor={patientTheme.colors.brand} stopOpacity={0.07} />
            <stop offset="100%" stopColor={patientTheme.colors.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={lo === hi ? [lo - 1, hi + 1] : [lo, hi]} />
        <Tooltip
          cursor={false}
          contentStyle={{
            background: "rgba(255,255,255,0.97)",
            border: "1px solid rgba(226,232,238,0.95)",
            borderRadius: 12,
            fontSize: 11,
            padding: "5px 9px",
            boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 8px 20px -8px rgba(16,24,40,0.16)",
          }}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={patientTheme.colors.brand}
          strokeWidth={2}
          strokeLinecap="round"
          fill={`url(#${id})`}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
          className="mh-chart-line"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** A sub-reading, tinted by how it compares to its own band. */
function PartTag({ part }: { part: MetricValue["parts"][number] }) {
  const colour =
    part.status === "normal"
      ? patientTheme.colors.textSecondary
      : part.status === "attention"
        ? "#B45309"
        : patientTheme.colors.error;
  return (
    <span
      className="text-[10.5px] font-medium whitespace-nowrap"
      style={{ color: patientTheme.colors.textMuted, fontVariantNumeric: "tabular-nums" }}
    >
      {part.label}{" "}
      <span style={{ color: colour }}>{part.display}</span>
    </span>
  );
}

/**
 * The range state, in the metric's own words.
 *
 * Deliberately *not* `StatusBadge`. That component keys off a fixed vocabulary
 * of status strings and renders "Normal" for anything in range — which is
 * right for an appointment but wrong for a metric whose range is a target.
 * Steps in range are not "Normal", they are "Goal met", and only the registry
 * knows that. So the wording comes from `mv.statusText` (which resolves
 * through the metric's own `labels`) and only the colour is decided here.
 */
function RangeState({ status, label, size }: { status: MetricValue["status"]; label: string; size: number }) {
  const colour =
    status === "normal"
      ? patientTheme.colors.signalDeep
      : status === "attention"
        ? "#B45309"
        : patientTheme.colors.error;
  return (
    <span
      className="font-semibold whitespace-nowrap flex-shrink-0"
      style={{ fontSize: size, color: colour, letterSpacing: "-0.005em" }}
    >
      {label}
    </span>
  );
}

export function MetricTile({
  mv,
  size = "tile",
  series,
  extra,
  alwaysStatus = false,
  onClick,
}: {
  mv: MetricValue;
  size?: TileSize;
  /** Values for the sparkline. Omitted or too short, and no chart is drawn. */
  series?: number[];
  /** Rendered in place of the chart — the heart-rate windows, for instance. */
  extra?: ReactNode;
  /** Draw the status even when it is normal. Vitals does; Home does not. */
  alwaysStatus?: boolean;
  onClick?: () => void;
}) {
  const s = SPEC[size];
  const { metric } = mv;
  const compact = size === "mini";
  const showStatus = !compact && (alwaysStatus || mv.status !== "normal");
  const hasChart = !extra && !!series && series.length > 1 && s.spark > 0;
  const hasParts = !compact && mv.parts.length > 0 && mv.parts.some((p) => p.value != null);

  return (
    <motion.button
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className="mh-card w-full h-full flex flex-col text-left"
      style={{ padding: s.pad }}
      aria-label={`${metric.label}, ${mv.display} ${mv.unit}, ${mv.statusText}`}
    >
      {/* Header — the label owns this line, so it always names the metric. */}
      <div className="flex items-center gap-2">
        {s.disc > 0 ? (
          <div
            className="mh-icon flex-shrink-0"
            style={{ width: s.disc, height: s.disc, color: patientTheme.colors.brandDeep, background: patientTheme.gradients.tile }}
          >
            <GlyphIcon name={metric.icon} size={s.icon} />
          </div>
        ) : (
          <span className="flex-shrink-0" style={{ color: patientTheme.colors.brandDeep }}>
            <GlyphIcon name={metric.icon} size={s.icon} />
          </span>
        )}
        <p
          className="font-medium leading-tight truncate min-w-0"
          style={{ fontSize: s.label, color: patientTheme.colors.textPrimary }}
        >
          {compact ? (metric.short || metric.label) : metric.label}
        </p>
      </div>

      {/* Value, with the status at the far end of the same line. */}
      <div
        className="flex items-baseline justify-between gap-2 whitespace-nowrap"
        style={{ marginTop: s.gap }}
      >
        <span className="flex items-baseline gap-1.5 min-w-0">
          <span
            style={{
              fontSize: s.value,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              color: patientTheme.colors.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {mv.display}
          </span>
          {mv.unit && (
            <span className="font-medium" style={{ fontSize: s.unit, color: patientTheme.colors.textSecondary }}>
              {mv.unit}
            </span>
          )}
        </span>
        {showStatus && <RangeState status={mv.status} label={mv.statusText} size={s.chip} />}
      </div>

      {hasParts && (
        <div className={`flex flex-wrap gap-x-3 gap-y-1 ${size === "mini" ? "mt-1" : "mt-2"}`}>
          {mv.parts.filter((p) => p.value != null).map((p) => (
            <PartTag key={p.key} part={p} />
          ))}
        </div>
      )}

      {extra}

      {hasChart && (
        <div className="mt-1 -mx-1">
          <Spark data={series!} height={s.spark} />
        </div>
      )}
    </motion.button>
  );
}
