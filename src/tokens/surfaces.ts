/**
 * Elevation and gradient tokens — framework-agnostic.
 *
 * These are the two places where web and native genuinely diverge, so they're
 * expressed as structured data and each platform renders it its own way:
 *   - elevation: web builds a box-shadow string; RN uses shadow* + elevation.
 *   - gradients: web builds a linear-gradient string; RN feeds
 *     expo-linear-gradient with colour stops and a direction vector.
 */

/** A single soft shadow layer. Colours are rgba so both platforms can use them. */
export interface ShadowLayer {
  dx: number;
  dy: number;
  blur: number;
  spread: number;
  color: string;
}

export interface ElevationLevel {
  /** Layered shadows, applied innermost-first. */
  layers: ShadowLayer[];
  /** Android's single-value approximation of the same lift. */
  androidElevation: number;
}

export const elevation: Record<"e1" | "e2" | "e3", ElevationLevel> = {
  e1: {
    layers: [
      { dx: 0, dy: 1, blur: 2, spread: 0, color: "rgba(16,24,40,0.04)" },
      { dx: 0, dy: 4, blur: 12, spread: -4, color: "rgba(16,24,40,0.06)" },
    ],
    androidElevation: 2,
  },
  e2: {
    layers: [
      { dx: 0, dy: 1, blur: 2, spread: 0, color: "rgba(16,24,40,0.04)" },
      { dx: 0, dy: 10, blur: 24, spread: -8, color: "rgba(16,24,40,0.10)" },
    ],
    androidElevation: 5,
  },
  e3: {
    layers: [
      { dx: 0, dy: 2, blur: 4, spread: 0, color: "rgba(16,24,40,0.05)" },
      { dx: 0, dy: 20, blur: 40, spread: -12, color: "rgba(16,24,40,0.14)" },
    ],
    androidElevation: 10,
  },
};

/** Green feature cards carry a coloured ground shadow rather than a grey one. */
export const coloredElevation = {
  greenCard: {
    layers: [
      { dx: 0, dy: 2, blur: 6, spread: 0, color: "rgba(16,24,40,0.06)" },
      { dx: 0, dy: 16, blur: 32, spread: -12, color: "rgba(22,101,52,0.35)" },
    ],
    androidElevation: 8,
  },
  navBar: {
    layers: [
      { dx: 0, dy: -1, blur: 3, spread: 0, color: "rgba(16,24,40,0.04)" },
      { dx: 0, dy: -14, blur: 34, spread: -12, color: "rgba(16,24,40,0.16)" },
    ],
    androidElevation: 12,
  },
} as const;

/** A lit top edge — drawn as an inset highlight on web, an overlay View on RN. */
export const surfaceHighlight = "rgba(255, 255, 255, 0.95)";

export interface GradientToken {
  /** Stops in order. For RN, feed straight into expo-linear-gradient. */
  colors: readonly string[];
  /** Optional stop offsets (0–1); defaults to even spacing. */
  locations?: readonly number[];
  /** CSS-only keywords, kept for textual reference. */
  angleCSS?: string;
  /** RN direction vector, matching the CSS angle above. */
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export const gradients = {
  /** Page atmosphere: near-white revealing pale mint. */
  atmosphere: {
    colors: ["#F8FBF9", "#F5F9F6", "#F2F8F4"],
    angleCSS: "180deg",
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  /** Raised white card: lit at the top, settling slightly at the base. */
  card: {
    colors: ["#FFFFFF", "#FFFFFF", "#FBFDFC"],
    locations: [0, 0.62, 1],
    angleCSS: "180deg",
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  /** Green hero / feature card. */
  greenCard: {
    colors: ["#1CAE51", "#16A34A", "#15803D", "#14703A"],
    locations: [0, 0.32, 0.72, 1],
    angleCSS: "158deg",
    start: { x: 0.15, y: 0 },
    end: { x: 0.85, y: 1 },
  },
  /** Primary pill button. */
  buttonPrimary: {
    colors: ["#1FB055", "#16A34A", "#158840"],
    locations: [0, 0.55, 1],
    angleCSS: "180deg",
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  /** Mint surface — feature panels. */
  mint: {
    colors: ["#C9F4D9", "#D8F7E2", "#E7FBEF"],
    locations: [0, 0.55, 1],
    angleCSS: "165deg",
    start: { x: 0.2, y: 0 },
    end: { x: 0.8, y: 1 },
  },
  /** Dimensional icon containers, per category. */
  tile: { colors: ["#F4FCF6", "#E8F8EE", "#DCF2E5"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } },
  tileRose: { colors: ["#FFF5F7", "#FFE7EC", "#FFDCE3"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } },
  tileAmber: { colors: ["#FFFBF0", "#FEF3C7", "#FDE9B0"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } },
  tileBlue: { colors: ["#F4F8FF", "#E3EEFE", "#D8E8FD"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } },
  tileTeal: { colors: ["#F0FCFA", "#D9F7F1", "#CCF3EA"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } },
  tileSlate: { colors: ["#FAFCFD", "#F0F4F8", "#E9EFF4"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } },
  /** Solid green dimensional control — nav AI button, agent mark. */
  iconGreen: {
    colors: ["#29B85C", "#16A34A", "#15803D"],
    locations: [0, 0.45, 1],
    angleCSS: "165deg",
    start: { x: 0.2, y: 0 },
    end: { x: 0.8, y: 1 },
  },
  /** Raise-from-white for secondary buttons and inputs. */
  surfaceRaise: {
    colors: ["#FFFFFF", "#FAFDFB"],
    angleCSS: "180deg",
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
} as const satisfies Record<string, GradientToken>;

export type GradientName = keyof typeof gradients;

/* ------------------------------------------------------------------ */
/* Platform renderers                                                  */
/* ------------------------------------------------------------------ */

/** Web: an elevation level as a CSS box-shadow string. */
export function elevationToCSS(level: ElevationLevel): string {
  return level.layers
    .map((l) => `${l.dx}px ${l.dy}px ${l.blur}px ${l.spread}px ${l.color}`)
    .join(", ");
}

/** Web: a gradient token as a CSS linear-gradient string. */
export function gradientToCSS(g: GradientToken): string {
  const stops = g.colors
    .map((c, i) => (g.locations ? `${c} ${Math.round(g.locations[i] * 100)}%` : c))
    .join(", ");
  return `linear-gradient(${g.angleCSS ?? "180deg"}, ${stops})`;
}
