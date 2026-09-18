import type { CSSProperties, ReactNode } from "react";
import { useFluidText } from "../lib/useFluidText";

/**
 * Text whose numbers travel to a new value rather than snapping to it.
 *
 * See `useFluidText` for why this is worth doing; this is just the web binding.
 */
export function FluidText({
  value,
  style,
  duration,
  className,
}: {
  value: string;
  style?: CSSProperties;
  duration?: number;
  className?: string;
}): ReactNode {
  const display = useFluidText(value, duration);
  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}
