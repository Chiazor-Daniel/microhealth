/**
 * The MicroHealth mark — a medical cross with rounded arms.
 *
 * Drawn as two overlapping rounded rects so the arm ends and the inner
 * corners share one radius, which is what the brand mark does. Uses
 * `currentColor` so it takes the tint of whatever container it sits in.
 */
export function BrandMark({ size = 20, className }: { size?: number; className?: string }) {
  const arm = size * 0.2; // arm thickness
  const long = size;
  const short = long;
  const start = (long - arm) / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${long} ${short}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x={start} y={0} width={arm} height={long} rx={arm / 2} />
      <rect x={0} y={start} width={long} height={arm} rx={arm / 2} />
    </svg>
  );
}
