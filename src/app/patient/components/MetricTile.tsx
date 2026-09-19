import { useEffect, useState, type ReactNode } from "react";
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

/**
 * Below this width, half-width tiles run out of room for a full metric name.
 *
 * At 320px a two-up tile leaves about 66px for its label, and a name like
 * "Triglycerides" cannot wrap — it is one word — so it would be clipped
 * mid-word. The registry already carries a short name for exactly this, and
 * a small screen is where it earns its place.
 *
 * 375 — an iPhone SE — is the smallest phone worth designing for and sits
 * comfortably above this; only genuinely tiny viewports take the short name.
 */
const NARROW = 360;

function useNarrow() {
  const [narrow, setNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth < NARROW : false
  );
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < NARROW);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return narrow;
}

/** Compact is a shorthand: no disc, no parts, no status — value and name only. */
const SPEC: Record<
  TileSize,
  { pad: number; icon: number; disc: number; label: number; value: number; unit: number; spark: number; gap: number; chip: number; headGap: number }
> = {
  /* The lead card of a section — full width, room for a chart and its parts. */
  hero: { pad: 16, icon: 20, disc: 44, label: 13, value: 34, unit: 12.5, spark: 46, gap: 12, chip: 11, headGap: 8 },
  /* The standard card: two to a row. */
  tile: { pad: 13, icon: 16, disc: 34, label: 11.5, value: 22, unit: 11, spark: 32, gap: 9, chip: 10, headGap: 8 },
  /* Today's rollups — three to a row, so only the essentials survive. */
  mini: { pad: 12, icon: 17, disc: 0, label: 10.5, value: 19, unit: 10, spark: 0, gap: 8, chip: 0, headGap: 8 },
};

/**
 * The header on a genuinely small screen.
 *
 * A three-up row at 320px leaves a mini tile ~33px for its label after the
 * glyph and the gap, and "Energy" needs 35 — it clipped by two pixels, with no
 * ellipsis and no second line, because it is a single word.
 *
 * The label cannot give here. `Energy` is already the registry's `short` for a
 * metric whose full name is longer, so there is no shorter word to fall back
 * to, and a metric name that stops mid-word ("Energ") fails the one job this
 * row has. The glyph can give: it is decoration at this size — the label is
 * what names the tile — and a 14px mark still reads where 17px did. Closing
 * the gap costs nothing either; 8px was tuned for a 34px disc that `mini`
 * does not have.
 *
 * So the six reclaimed pixels come out of the icon, not the word.
 */
const MINI_NARROW = { icon: 14, headGap: 5 } as const;

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
  const narrow = useNarrow();
  const s = size === "mini" && narrow ? { ...SPEC.mini, ...MINI_NARROW } : SPEC[size];
  const { metric } = mv;
  const compact = size === "mini";
  /* The hero always has room for the full name; a cramped tile does not. */
  const label = (compact || (narrow && size === "tile")) && metric.short ? metric.short : metric.label;
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
      <div className="flex items-center" style={{ gap: s.headGap }}>
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
        {/* Two lines, not one. A truncated label stops naming the metric —
            "Blood O…" is worse than a label that takes a second line, and on a
            narrow phone the half-width tiles cannot fit "Blood Oxygen" on one
            line at any size. It only wraps when it has to: at a normal phone
            width every label still sits on a single line. */}
        <p
          className="font-medium leading-tight min-w-0"
          style={{
            fontSize: s.label,
            color: patientTheme.colors.textPrimary,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {label}
        </p>
      </div>

      {/* Value, with the status at the far end of the same line.
          The row wraps: a narrow tile cannot hold "122/75" + "mmHg" +
          "Elevated" on one line, and without wrapping they simply overprinted
          each other. The status keeps `ml-auto` so it stays right-aligned
          whether it lands beside the value or below it. */}
      <div
        className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5"
        style={{ marginTop: s.gap }}
      >
        {/* The number never breaks — "116/74" is one token. The unit does,
            dropping to a second line when the tile is too narrow for both.
            Keeping the group itself `nowrap` pushed "mmHg" off the edge
            instead, and it was clipped rather than moved. */}
        <span className="flex flex-wrap items-baseline gap-x-1.5 min-w-0">
          <span
            className="whitespace-nowrap"
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
