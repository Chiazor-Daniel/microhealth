// MicroHealth Patient Experience — web theme.
//
// Values come from src/tokens (shared with the React Native build) and are
// rendered into web shapes here: CSS length strings and box-shadow /
// linear-gradient text. Editing a token updates web and native together.
//
// Two hues, two jobs — see src/tokens/colors.ts for the full rationale.
//   brand  (teal) — structure. Headings, nav, primary actions, charts.
//   signal (leaf) — success, health score, in-range, checkmarks.
//
// Components should reach for `brand*` / `signal*` rather than a ramp step.
// The numbered ramps are for the cases where a specific lightness is the
// point (a hairline tint, a pressed state); the `green*` block at the bottom
// is deprecated and only exists for screens that haven't been migrated yet.

import {
  colors as t,
  semantic,
  typography as typeTokens,
  spacing as spacingTokens,
  radii as radiusTokens,
  elevation,
  coloredElevation,
  gradients as gradientTokens,
  elevationToCSS,
  gradientToCSS,
  metricTint,
} from "../../tokens";

export const patientTheme = {
  colors: {
    /* ---- Teal ramp: the brand ---- */
    teal50: t.teal50,
    teal100: t.teal100,
    teal200: t.teal200,
    teal300: t.teal300,
    teal400: t.teal400,
    teal500: t.teal500,
    teal600: t.teal600,
    teal700: t.teal700,
    teal800: t.teal800,
    teal900: t.teal900,

    /* ---- Leaf ramp: the accent ---- */
    leaf50: t.leaf50,
    leaf100: t.leaf100,
    leaf200: t.leaf200,
    leaf300: t.leaf300,
    leaf400: t.leaf400,
    leaf500: t.leaf500,
    leaf600: t.leaf600,
    leaf700: t.leaf700,
    leaf800: t.leaf800,
    leaf900: t.leaf900,

    /* ---- Semantic roles — prefer these over a ramp step ---- */
    brand: semantic.brand,
    brandDeep: semantic.brandDeep,
    brandSoft: semantic.brandSoft,
    brandPale: semantic.brandPale,

    signal: semantic.signal,
    signalBright: semantic.signalBright,
    signalDeep: semantic.signalDeep,
    signalSoft: semantic.signalSoft,
    signalPale: semantic.signalPale,

    /* ---- Pale teal washes: tinted panel grounds ---- */
    wash: t.wash,
    washDeep: t.washDeep,
    washPale: t.washPale,

    /* ---- Ink: navy / blue-gray. Never pure black. ---- */
    ink: t.ink,
    inkSecondary: t.inkSecondary,
    inkMuted: t.inkMuted,

    /* ---- Surfaces ---- */
    background: t.background,
    surface: t.surface,
    surfaceRaised: t.surfaceRaised,
    surfaceSecondary: t.surfaceSecondary,
    hairline: t.hairline,
    hairlineSoft: t.hairlineSoft,
    scrim: t.scrim,

    /* ---- Aliases kept for existing components ---- */
    border: semantic.border,
    borderLight: semantic.borderSoft,
    textPrimary: semantic.textPrimary,
    textSecondary: semantic.textSecondary,
    textMuted: semantic.textMuted,

    primaryGreen: semantic.brand,
    primaryDark: semantic.brandDeep,
    primaryDeep: t.teal900,
    primarySoft: semantic.brandSoft,
    primaryPale: semantic.brandPale,
    aiAccent: semantic.brand,

    /* ---- Status. Success is leaf by definition; the rest are independent
       hues so a warning can never be mistaken for "on brand". ---- */
    success: t.success,
    successDeep: t.successDeep,
    successSoft: t.successSoft,
    warning: t.warning,
    warningSoft: t.warningSoft,
    error: t.error,
    errorSoft: t.errorSoft,
    info: t.info,
    infoSoft: t.infoSoft,

    /* ---- Icon-container tints ---- */
    rose: t.rose,
    roseSoft: t.roseSoft,
    amber: t.amber,
    amberSoft: t.amberSoft,
    blue: t.blue,
    blueSoft: t.blueSoft,
    teal: t.teal,
    tealSoft: t.tealSoft,
    violet: t.violet,
    violetSoft: t.violetSoft,
    indigo: t.indigo,
    indigoSoft: t.indigoSoft,
    slate: t.slate,
    slateSoft: t.slateSoft,

    onBrand: t.onBrand,
    onBrandMuted: t.onBrandMuted,

    /* ================================================================
       @deprecated The pre-teal `green*` ramp and its aliases.
       ================================================================
       One green used to serve both brand and success, which is what made the
       product read as all-green. It is now split into `brand` (teal) and
       `signal` (leaf). These keys alias the brand teal so screens that have
       not been migrated keep rendering in the right hue rather than silently
       keeping the old one. Delete once nothing references them. */
    green50: t.teal50,
    green100: t.teal100,
    green200: t.teal200,
    green300: t.teal300,
    green400: t.teal400,
    green500: t.teal500,
    green600: t.teal600,
    green700: t.teal700,
    green800: t.teal800,
    green900: t.teal900,

    /** @deprecated Renamed to `wash*` — same values. */
    mint: t.wash,
    mintDeep: t.washDeep,
    mintPale: t.washPale,

    /** @deprecated Renamed to `onBrand*` — same values. */
    onGreen: t.onBrand,
    onGreenMuted: t.onBrandMuted,
  },

  /* Type scale as CSS-ready objects (px strings + numeric tracking). */
  typography: {
    fontFamily: typeTokens.fontFamily,
    pageTitle: { size: 23, weight: 700, lineHeight: 1.25, tracking: "-0.02em" },
    h1: { size: 23, weight: 700, lineHeight: 1.25, tracking: "-0.02em" },
    sectionTitle: { size: 16, weight: 650, lineHeight: 1.3, tracking: "-0.01em" },
    h2: { size: 16, weight: 650, lineHeight: 1.3, tracking: "-0.01em" },
    h3: { size: 15, weight: 600, lineHeight: 1.35, tracking: "-0.01em" },
    body: { size: 14, weight: 400, lineHeight: 1.55, tracking: "0" },
    secondary: { size: 13, weight: 400, lineHeight: 1.5, tracking: "0" },
    caption: { size: 12, weight: 500, lineHeight: 1.4, tracking: "0" },
    cardLabel: { size: 13, weight: 500, lineHeight: 1.3, tracking: "0" },
    metric: { size: 26, weight: 700, lineHeight: 1.05, tracking: "-0.03em" },
    metricLarge: { size: 32, weight: 700, lineHeight: 1.05, tracking: "-0.03em" },
    vitalNumber: { size: 26, weight: 700, lineHeight: 1.05, tracking: "-0.03em" },
    heroNumber: { size: 34, weight: 700, lineHeight: 1.02, tracking: "-0.03em" },
  },

  spacing: { ...spacingTokens },

  radius: {
    small: radiusTokens.small,
    card: radiusTokens.card,
    feature: radiusTokens.feature,
    control: radiusTokens.control,
    button: radiusTokens.pill,
    pill: radiusTokens.pill,
  },

  /* Elevation ladder, rendered to CSS from the shared shadow tokens. */
  shadows: {
    e1: elevationToCSS(elevation.e1),
    e2: elevationToCSS(elevation.e2),
    e3: elevationToCSS(elevation.e3),

    // Aliases kept for existing components
    soft: elevationToCSS(elevation.e1),
    medium: elevationToCSS(elevation.e2),
    strong: elevationToCSS(elevation.e3),

    emboss: "inset 0 1px 0 rgba(255,255,255,0.9)",
    gel: "inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 12px -2px rgba(0,95,115,0.38)",
    inset: "inset 0 1px 0 rgba(255,255,255,0.6)",
    brandCard: elevationToCSS(coloredElevation.brandCard),
    /** @deprecated Use `brandCard`. */
    greenCard: elevationToCSS(coloredElevation.brandCard),
  },

  /* Gradients rendered from the shared stop data. */
  gradients: {
    atmosphere: gradientToCSS(gradientTokens.atmosphere),
    card: gradientToCSS(gradientTokens.card),
    brandCard: gradientToCSS(gradientTokens.brandCard),
    brandButton: gradientToCSS(gradientTokens.brandButton),
    brandSolid: gradientToCSS(gradientTokens.brandSolid),
    brandTab: gradientToCSS(gradientTokens.brandTab),
    wash: gradientToCSS(gradientTokens.wash),
    scoreRing: gradientToCSS(gradientTokens.scoreRing),
    tile: gradientToCSS(gradientTokens.tile),
    tileRose: gradientToCSS(gradientTokens.tileRose),
    tileAmber: gradientToCSS(gradientTokens.tileAmber),
    tileBlue: gradientToCSS(gradientTokens.tileBlue),
    tileTeal: gradientToCSS(gradientTokens.tileTeal),
    tileSlate: gradientToCSS(gradientTokens.tileSlate),
    tileLeaf: gradientToCSS(gradientTokens.tileLeaf),
    tileViolet: gradientToCSS(gradientTokens.tileViolet),
    tileIndigo: gradientToCSS(gradientTokens.tileIndigo),
    surfaceRaise: gradientToCSS(gradientTokens.surfaceRaise),
    nav: gradientToCSS(gradientTokens.navBar),

    /** @deprecated Use `brandCard`. */
    greenCard: gradientToCSS(gradientTokens.brandCard),
    /** @deprecated Use `brandCard`. */
    greenCardSoft: gradientToCSS(gradientTokens.brandCard),
    /** @deprecated Use `brandButton`. */
    buttonPrimary: gradientToCSS(gradientTokens.brandButton),
    /** @deprecated Use `wash`. */
    mint: gradientToCSS(gradientTokens.wash),
    /** @deprecated Use `brandSolid`. */
    iconGreen: gradientToCSS(gradientTokens.brandSolid),
  },

  motion: {
    spring: { type: "spring", stiffness: 300, damping: 28 },
    gentle: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    quick: { duration: 0.16, ease: "easeOut" },
  },
} as const;

export type PatientTheme = typeof patientTheme;

export { metricTint };

// Status color helpers
export function statusColor(priority: "info" | "watch" | "attention" | "urgent") {
  switch (priority) {
    case "info":
      return patientTheme.colors.success;
    case "watch":
      return patientTheme.colors.warning;
    case "attention":
      return "#EA580C";
    case "urgent":
      return patientTheme.colors.error;
    default:
      return patientTheme.colors.textMuted;
  }
}

export function vitalStatusColor(status: "normal" | "low" | "high" | "attention") {
  switch (status) {
    case "normal":
      return patientTheme.colors.success;
    case "low":
      return patientTheme.colors.warning;
    case "high":
      return patientTheme.colors.error;
    case "attention":
      return "#EA580C";
    default:
      return patientTheme.colors.textMuted;
  }
}
