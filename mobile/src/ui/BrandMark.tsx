import Svg, { Rect } from "react-native-svg";

/**
 * The MicroHealth mark — a medical cross with rounded arms.
 *
 * Two overlapping rounded rects, so the arm ends and the inner corners share
 * one radius, which is what the brand mark does. Takes its colour from `color`
 * so it fits whatever container it sits in.
 */
export function BrandMark({ size = 20, color = "#FFFFFF" }: { size?: number; color?: string }) {
  const arm = size * 0.2;
  const start = (size - arm) / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={start} y={0} width={arm} height={size} rx={arm / 2} fill={color} />
      <Rect x={0} y={start} width={size} height={arm} rx={arm / 2} fill={color} />
    </Svg>
  );
}
