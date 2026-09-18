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
  gradientVector,
  type ElevationLevel,
  type ShadowLayer,
  type GradientToken,
  type GradientName,
} from "./surfaces";

import { colors } from "./colors";
import { gradients } from "./surfaces";

/**
 * Per-metric tint for a dimensional icon container.
 *
 * Keyed by metric id and deliberately loose (`Record<string, …>`) rather than a
 * closed union: the metric list is owned by `src/metrics/registry.ts`, and a
 * metric added there must not fail to compile here. An unknown key falls back
 * to the brand tile, so a new metric is never invisible — just unattributed
 * until someone gives it a colour.
 *
 * The palette is chosen so that no two metrics a patient sees side by side
 * share a tint, and so that none of them read as brand chrome: brand teal is
 * for structure, these are for category.
 */
export const metricTints: Record<string, { fg: string; tile: string }> = {
  /* Cardiac and blood — the reds and the deep teal. */
  heartRate: { fg: colors.rose, tile: gradients.tileRose.colors[1] },
  ecg: { fg: colors.rose, tile: gradients.tileRose.colors[1] },
  bloodPressure: { fg: colors.teal700, tile: gradients.tile.colors[1] },

  /* Oxygen and respiration — the cyans. */
  spo2: { fg: colors.teal, tile: gradients.tileTeal.colors[1] },
  respiratoryRate: { fg: colors.teal, tile: gradients.tileTeal.colors[1] },
  hypoxia: { fg: colors.blue, tile: gradients.tileBlue.colors[1] },
  apnea: { fg: colors.indigo, tile: gradients.tileIndigo.colors[1] },

  /* Sleep — the indigos, the only metrics that happen at night. */
  sleep: { fg: colors.indigo, tile: gradients.tileIndigo.colors[1] },

  /* Activity — the leaf. These are the metrics you *do*. */
  steps: { fg: colors.leaf700, tile: gradients.tileLeaf.colors[1] },
  distance: { fg: colors.leaf700, tile: gradients.tileLeaf.colors[1] },
  calories: { fg: colors.amber, tile: gradients.tileAmber.colors[1] },
  met: { fg: colors.leaf700, tile: gradients.tileLeaf.colors[1] },

  /* Body — the blues and slates. */
  temperature: { fg: colors.amber, tile: gradients.tileAmber.colors[1] },
  weight: { fg: colors.slate, tile: gradients.tileSlate.colors[1] },
  bodyComposition: { fg: colors.blue, tile: gradients.tileBlue.colors[1] },
  bloodGlucose: { fg: colors.amber, tile: gradients.tileAmber.colors[1] },

  /* Wellbeing — the violets, which is what keeps them from reading as alerts. */
  hrv: { fg: colors.violet, tile: gradients.tileViolet.colors[1] },
  stress: { fg: colors.violet, tile: gradients.tileViolet.colors[1] },
  fatigue: { fg: colors.violet, tile: gradients.tileViolet.colors[1] },
  emotion: { fg: colors.violet, tile: gradients.tileViolet.colors[1] },
  gsr: { fg: colors.teal, tile: gradients.tileTeal.colors[1] },

  /* Labs — drawn from the panel's own palette, not the vitals one. */
  uricAcid: { fg: colors.slate, tile: gradients.tileSlate.colors[1] },
  cholesterol: { fg: colors.amber, tile: gradients.tileAmber.colors[1] },
  triglycerides: { fg: colors.amber, tile: gradients.tileAmber.colors[1] },
  hdl: { fg: colors.leaf700, tile: gradients.tileLeaf.colors[1] },
  ldl: { fg: colors.rose, tile: gradients.tileRose.colors[1] },
};

export function metricTint(metric: string): { fg: string; tile: string } {
  return (
    metricTints[metric] ?? {
      fg: colors.teal700,
      tile: gradients.tile.colors[1],
    }
  );
}
