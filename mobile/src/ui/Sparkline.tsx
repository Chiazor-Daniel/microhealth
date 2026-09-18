import { useEffect } from "react";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { colors, motion } from "@tokens";

/* Reanimated can only drive a component that knows how to receive animated
   props, so the path is wrapped once here rather than per render. */
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Long enough to cover any path this app draws. The draw-in works by hiding
 * the line behind a dash gap and sliding the gap away; the exact length only
 * has to exceed the path, not match it.
 */
const DRAW_LENGTH = 1200;

/**
 * Vertical breathing room inside the plot. The line is scaled into this band,
 * so a caller drawing value labels alongside can line them up with it.
 */
export const SPARK_PAD = { top: 6, bottom: 6 } as const;

/**
 * The value range a series is drawn across.
 *
 * Exported so a caller can label the chart with the same numbers it is drawn
 * to — a label that disagrees with the line is worse than no label.
 */
export function sparkDomain(data: number[]): [number, number] {
  if (!data.length) return [0, 1];
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  /* A perfectly flat series would collapse to a zero-height band and divide by
     zero; open it up by a unit either side so the line sits in the middle. */
  return lo === hi ? [lo - 1, hi + 1] : [lo, hi];
}

/**
 * The whisper of mint under a metric.
 *
 * Web draws this with recharts; native draws the same path by hand, which
 * keeps the app free of a charting dependency and matches the web curve
 * exactly. Values are spaced evenly, the way recharts' default category axis
 * spaces them.
 *
 * The line is scaled to the series' own min and max. Anchoring at zero is the
 * more conventional choice but the wrong one for a vital sign: a resting heart
 * rate sitting at 72 ± 3 bpm draws as a dead flat line against a 0–100 axis,
 * and the whole point of the chart is to show that it *is* moving.
 */
export function Sparkline({
  data,
  width,
  height = 72,
  color = colors.green600,
  fill = true,
  dot = true,
  strokeWidth = 2.2,
  domain,
}: {
  data: number[];
  width: number;
  height?: number;
  color?: string;
  /** The soft gradient wash beneath the line. Off for a bare trend line. */
  fill?: boolean;
  /** A dot on every reading. Off for a dense series, which would read as beads. */
  dot?: boolean;
  strokeWidth?: number;
  /** Overrides the auto-scaled range. Pass `sparkDomain(data)` to be explicit. */
  domain?: [number, number];
}) {
  if (data.length < 2 || width <= 0) return null;

  const padTop = SPARK_PAD.top;
  const padX = 4;
  const innerW = width - padX * 2;
  const innerH = height - SPARK_PAD.top - SPARK_PAD.bottom;

  const [min, max] = domain ?? sparkDomain(data);
  /* A flat series would divide by zero; give it the middle of the band. */
  const span = max - min || 1;

  const points = data.map((v, i) => ({
    x: padX + (innerW * i) / (data.length - 1),
    y: padTop + innerH - ((v - min) / span) * innerH,
  }));

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <SparkSvg
      line={line}
      area={area}
      points={points}
      width={width}
      height={height}
      color={color}
      fill={fill}
      dot={dot}
      strokeWidth={strokeWidth}
    />
  );
}

/**
 * The drawing itself, split out so the animation hooks are not called
 * conditionally alongside the early return above.
 */
function SparkSvg({
  line,
  area,
  points,
  width,
  height,
  color,
  fill,
  dot,
  strokeWidth,
}: {
  line: string;
  area: string;
  points: { x: number; y: number }[];
  width: number;
  height: number;
  color: string;
  fill: boolean;
  dot: boolean;
  strokeWidth: number;
}) {
  /* The line draws itself on, then the wash beneath it fades up. Drawing and
     filling together reads as a wipe; staggered, it reads as a chart being
     plotted. */
  const draw = useSharedValue(0);
  const wash = useSharedValue(0);

  useEffect(() => {
    draw.value = withTiming(1, { duration: 900, easing: Easing.bezier(...motion.easing.standard) });
    wash.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [draw, wash, line]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: DRAW_LENGTH * (1 - draw.value),
  }));

  const areaProps = useAnimatedProps(() => ({ opacity: wash.value }));

  return (
    <Svg width={width} height={height}>
      {fill ? (
        <>
          <Defs>
            <LinearGradient id="mhSparkFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset={0} stopColor={color} stopOpacity={0.3} />
              <Stop offset={0.7} stopColor={color} stopOpacity={0.07} />
              <Stop offset={1} stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <AnimatedPath d={area} fill="url(#mhSparkFill)" animatedProps={areaProps} />
        </>
      ) : null}

      <AnimatedPath
        d={line}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={DRAW_LENGTH}
        animatedProps={lineProps}
      />

      {dot
        ? points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={2.2} fill="#FFFFFF" stroke={color} strokeWidth={1.7} />
          ))
        : null}
    </Svg>
  );
}

/**
 * A monotone cubic through the points — the same curve recharts draws for
 * `type="monotone"`. Control points sit at the horizontal midpoint of each
 * segment, which is what keeps the line from overshooting its own data.
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
