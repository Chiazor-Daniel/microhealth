/**
 * Elevation and gradient tokens — framework-agnostic.
 *
 * These are the two places where web and native genuinely diverge, so they're
 * expressed as structured data and each platform renders it its own way:
 *   - elevation: web builds a box-shadow string; RN uses shadow* + elevation.
 *   - gradients: web builds a linear-gradient string; RN feeds
 *     expo-linear-gradient with colour stops and a direction vector.
 *
 * Gradients are named for their *role* (`brandCard`, `wash`) rather than their
 * hue, so the palette can move without the names going stale. The pre-teal
 * names are kept as aliases at the bottom of the table.
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

/** A feature card carries a coloured ground shadow rather than a grey one. */
export const coloredElevation = {
  brandCard: {
    layers: [
      { dx: 0, dy: 2, blur: 6, spread: 0, color: "rgba(16,24,40,0.06)" },
      { dx: 0, dy: 16, blur: 32, spread: -12, color: "rgba(8,84,108,0.34)" },
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

/* ------------------------------------------------------------------ */
/* The gradients themselves                                            */
/* ------------------------------------------------------------------ */

/**
 * Page atmosphere: effectively white.
 *
 * This used to carry visible mint bloom, which is what made the whole product
 * read as green — a tinted page also fights every tinted card placed on it.
 * The ground is now neutral and the colour lives in the content. The blooms
 * survive at a fraction of their old alpha so the page still has a direction
 * of light rather than being a flat fill, but at a glance it is white.
 */
const atmosphere: GradientToken = {
  colors: ["#FCFDFE", "#FAFBFC", "#F8FAFB"],
  angleCSS: "180deg",
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/** Raised white card: lit at the top, settling slightly at the base. */
const card: GradientToken = {
  colors: ["#FFFFFF", "#FFFFFF", "#FCFDFE"],
  locations: [0, 0.62, 1],
  angleCSS: "180deg",
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/** Brand hero / feature card. Deep teal — the largest expression of the brand. */
const brandCard: GradientToken = {
  colors: ["#1A8A9E", "#005F73", "#08546C", "#05414F"],
  locations: [0, 0.32, 0.72, 1],
  angleCSS: "158deg",
  start: { x: 0.15, y: 0 },
  end: { x: 0.85, y: 1 },
};

/** Primary pill button. */
const brandButton: GradientToken = {
  colors: ["#0A7085", "#005F73", "#08546C"],
  locations: [0, 0.55, 1],
  angleCSS: "180deg",
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/**
 * Pale teal wash — feature panels that sit on the page without shouting.
 *
 * This is the old `mint`, pulled most of the way to white. It still reads as a
 * tinted panel against the neutral page, but it no longer competes with the
 * brand card for attention.
 */
const wash: GradientToken = {
  colors: ["#E8F2F6", "#EFF7FA", "#F6FBFC"],
  locations: [0, 0.55, 1],
  angleCSS: "165deg",
  start: { x: 0.2, y: 0 },
  end: { x: 0.8, y: 1 },
};

/** Dimensional icon containers, per category. */
const tile: GradientToken = { colors: ["#F4FAFC", "#E9F4F8", "#DFEFF4"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } };
const tileRose: GradientToken = { colors: ["#FFF5F7", "#FFE7EC", "#FFDCE3"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } };
const tileAmber: GradientToken = { colors: ["#FFFBF0", "#FEF3C7", "#FDE9B0"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } };
const tileBlue: GradientToken = { colors: ["#F4F8FF", "#E3EEFE", "#D8E8FD"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } };
const tileTeal: GradientToken = { colors: ["#F0FCFA", "#D9F7F1", "#CCF3EA"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } };
const tileSlate: GradientToken = { colors: ["#FAFCFD", "#F0F4F8", "#E9EFF4"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } };
const tileLeaf: GradientToken = { colors: ["#F5FCF3", "#E7F7E2", "#DAF2D4"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } };
const tileViolet: GradientToken = { colors: ["#F8F5FF", "#EDE9FE", "#E4DDFC"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } };
const tileIndigo: GradientToken = { colors: ["#F4F6FF", "#E0E7FF", "#D5DEFD"], locations: [0, 0.55, 1], angleCSS: "160deg", start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 } };

/** Solid brand control — nav AI button, agent mark. */
const brandSolid: GradientToken = {
  colors: ["#1E8CA0", "#005F73", "#08546C"],
  locations: [0, 0.45, 1],
  angleCSS: "165deg",
  start: { x: 0.2, y: 0 },
  end: { x: 0.8, y: 1 },
};

/** The selected capsule in a segmented switch. Sits a shade above brandSolid. */
const brandTab: GradientToken = {
  colors: ["#0A7085", "#005F73", "#044A5C"],
  locations: [0, 0.6, 1],
  angleCSS: "180deg",
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/**
 * The health-score ring — the one place the leaf accent is allowed to be large.
 *
 * Signal, not structure: it is the only gradient in the system built from the
 * accent ramp, which is what keeps it reading as "your health" rather than
 * "the product".
 */
const scoreRing: GradientToken = {
  colors: ["#6EC763", "#4CAF50", "#53A627"],
  locations: [0, 0.5, 1],
  angleCSS: "150deg",
  start: { x: 0.15, y: 0 },
  end: { x: 0.85, y: 1 },
};

/** Raise-from-white for secondary buttons and inputs. */
const surfaceRaise: GradientToken = {
  colors: ["#FFFFFF", "#FAFBFC"],
  angleCSS: "180deg",
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/**
 * The floating nav bar's surface — near-opaque white so content scrolling
 * beneath it stays hidden, with a touch of lift at the top edge.
 */
const navBar: GradientToken = {
  colors: ["rgba(255,255,255,0.99)", "rgba(250,251,252,0.97)"],
  angleCSS: "180deg",
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const gradients = {
  atmosphere,
  card,
  brandCard,
  brandButton,
  brandSolid,
  brandTab,
  wash,
  scoreRing,
  tile,
  tileRose,
  tileAmber,
  tileBlue,
  tileTeal,
  tileSlate,
  tileLeaf,
  tileViolet,
  tileIndigo,
  surfaceRaise,
  navBar,

  /* ---- @deprecated Pre-teal names. Same objects, new roles. ---- */
  /** @deprecated Use `brandCard`. */
  greenCard: brandCard,
  /** @deprecated Use `brandButton`. */
  buttonPrimary: brandButton,
  /** @deprecated Use `brandSolid`. */
  iconGreen: brandSolid,
  /** @deprecated Use `brandTab`. */
  tabActive: brandTab,
  /** @deprecated Use `wash`. */
  mint: wash,
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

/**
 * Native: a gradient token as the start/end pair `expo-linear-gradient` wants.
 *
 * Derived from `angleCSS` rather than read from the stored `start`/`end`, so
 * the two platforms cannot disagree. A CSS angle points the gradient line N°
 * clockwise from "toward the top", giving the direction (sin N, −cos N); the
 * points are then placed on that line across the unit square.
 *
 * The stored vectors were hand-eyeballed and every diagonal one was 12–16° off
 * its own declared angle — invisible in isolation, but it meant a card that
 * leaned one way on web leaned another on native.
 */
export function gradientVector(g: GradientToken): { start: { x: number; y: number }; end: { x: number; y: number } } {
  if (!g.angleCSS) return { start: g.start, end: g.end };

  const rad = (parseFloat(g.angleCSS) * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);

  /* Half the line's length across a unit square, scaled to stay inside it —
     the dominant axis always spans the full 0–1 range. */
  const half = 0.5 / Math.max(Math.abs(dx), Math.abs(dy));

  return {
    start: { x: 0.5 - dx * half, y: 0.5 - dy * half },
    end: { x: 0.5 + dx * half, y: 0.5 + dy * half },
  };
}
