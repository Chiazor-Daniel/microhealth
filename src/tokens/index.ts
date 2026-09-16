/**
 * MicroHealth design tokens.
 *
 * The single source of truth for the product's visual language, shared by the
 * web app and the React Native / Expo build so the two can't drift.
 *
 * Rules for this layer:
 *   - no CSS, no DOM, no framework imports
 *   - numbers are unitless logical pixels
 *   - colours are plain strings
 *
 * Platform-specific recipes live beside it: `src/rn/theme.ts` for native.
 */

export { colors, semantic, type ColorToken } from "./colors";
export {
  typography,
  spacing,
  radii,
  motion,
} from "./layout";
export {
  elevation,
  coloredElevation,
  gradients,
  surfaceHighlight,
  elevationToCSS,
  gradientToCSS,
  type ElevationLevel,
  type ShadowLayer,
  type GradientToken,
  type GradientName,
} from "./surfaces";

import { colors } from "./colors";
import { gradients } from "./surfaces";

/**
 * Per-metric tint for a dimensional icon container.
 * Shared so a metric looks identical on every platform and screen.
 */
export type MetricKey = "heartRate" | "bloodPressure" | "spo2" | "temperature";

export const metricTints: Record<MetricKey, { fg: string; tile: string }> = {
  heartRate: { fg: colors.rose, tile: gradients.tileRose.colors[1] },
  bloodPressure: { fg: colors.blue, tile: gradients.tileBlue.colors[1] },
  spo2: { fg: colors.teal, tile: gradients.tileTeal.colors[1] },
  temperature: { fg: colors.amber, tile: gradients.tileAmber.colors[1] },
};

export function metricTint(metric: string): { fg: string; tile: string } {
  return (
    metricTints[metric as MetricKey] ?? {
      fg: colors.green700,
      tile: gradients.tile.colors[1],
    }
  );
}
