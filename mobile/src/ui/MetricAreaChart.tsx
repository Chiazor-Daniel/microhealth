import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { colors, semantic } from "@tokens";

/**
 * The vitals detail chart — an area with its frame.
 *
 * `Sparkline` is the whisper under a card; this is the same series at the size
 * where the numbers are read off it, so it carries what a bare sparkline
 * cannot: a value axis, time labels, and the dashed grid between them. Drawn by
 * hand for the same reason `Sparkline` is — native takes no charting
 * dependency, and the web's recharts curve is a single path anyway.
 *
 * Points are spaced end to end, exactly as `Sparkline` spaces them, so one set
 * of readings draws the same shape on the list screen and on the detail one.
 */
export function MetricAreaChart({
  data,
  xTicks,
  width,
  height,
  color = colors.green600,
  tickCount = 4,
  axisWidth = 44,
}: {
  /** Oldest first. */
  data: { label: string; value: number }[];
  /** Which labels deserve a tick. Thinning them is the caller's business. */
  xTicks: string[];
  width: number;
  height: number;
  color?: string;
  tickCount?: number;
  /** The gutter the value axis occupies, as on the web. */
  axisWidth?: number;
}) {
  if (data.length < 2 || width <= 0) return null;

  /* The web's own chart margins, with the strip its x-axis needs reserved
     along the bottom. */
  const padTop = 10;
  const padRight = 8;
  const axisHeight = 20;

  const left = axisWidth;
  const right = width - padRight;
  const top = padTop;
  const bottom = height - axisHeight;

  const values = data.map((d) => d.value);
  /* The web anchors this chart at `dataMin - 4` … `dataMax + 4` rather than at
     zero: the line is read against its own variation, which is why this is not
     the zero-anchored shape `Sparkline` defaults to. */
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  const span = max - min || 1;

  const xAt = (i: number) => left + ((right - left) * i) / (data.length - 1);
  const yAt = (v: number) => bottom - ((v - min) / span) * (bottom - top);

  const points = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value) }));
  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;

  const ticks = Array.from({ length: tickCount }, (_, i) => min + (span * i) / (tickCount - 1));

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="mhMetricAreaFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset={0} stopColor={color} stopOpacity={0.22} />
          <Stop offset={0.55} stopColor={color} stopOpacity={0.06} />
          <Stop offset={1} stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {ticks.map((t) => (
        <Line
          key={`grid-${t}`}
          x1={left}
          y1={yAt(t)}
          x2={right}
          y2={yAt(t)}
          stroke={colors.hairlineSoft}
          strokeWidth={1}
          strokeDasharray="3 6"
        />
      ))}

      {ticks.map((t) => (
        <SvgText
          key={`tick-${t}`}
          x={left - 6}
          y={yAt(t) + 3.5}
          fontSize={10}
          fill={semantic.textMuted}
          textAnchor="end"
        >
          {tickLabel(t)}
        </SvgText>
      ))}

      <Path d={area} fill="url(#mhMetricAreaFill)" />
      <Path d={line} stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={2.2} fill="#FFFFFF" stroke={color} strokeWidth={1.6} />
      ))}

      {xTicks.map((label) => {
        const i = data.findIndex((d) => d.label === label);
        if (i < 0) return null;
        return (
          <SvgText
            key={label}
            x={xAt(i)}
            y={height - 6}
            fontSize={10}
            fill={semantic.textMuted}
            /* The end labels are anchored inward so the first and last time on
               the axis stay inside the canvas instead of being clipped. */
            textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

/**
 * A tick as it is written: recharts rounds its own ticks to the precision the
 * domain needs, and an unrounded `dataMin - 4` prints as 36.599999999999994.
 */
function tickLabel(value: number) {
  return String(Number(value.toFixed(1)));
}

/**
 * A monotone cubic through the points — the curve recharts draws for
 * `type="monotone"`, and the same one `Sparkline` draws. Control points sit at
 * the horizontal midpoint of each segment, which is what keeps the line from
 * overshooting its own data.
 */
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}
