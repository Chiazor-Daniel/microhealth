// MicroHealth Patient Experience — web theme.
//
// Values come from src/tokens (shared with the React Native build) and are
// rendered into web shapes here: CSS length strings and box-shadow /
// linear-gradient text. Editing a token updates web and native together.

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
    /* ---- Green ramp ---- */
    green50: t.green50,
    green100: t.green100,
    green200: t.green200,
    green300: t.green300,
    green400: t.green400,
    green500: t.green500,
    green600: t.green600,
    green700: t.green700,
    green800: t.green800,
    green900: t.green900,

    /* ---- Mint atmosphere ---- */
    mint: t.mint,
    mintDeep: t.mintDeep,
    mintPale: t.mintPale,

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

    primaryGreen: t.green600,
    primaryDark: t.green700,
    primaryDeep: t.green900,
    primarySoft: t.green100,
    primaryPale: t.green50,
    aiAccent: t.green600,

    /* ---- Status ---- */
    success: t.success,
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
    onGreen: t.onGreen,
    onGreenMuted: t.onGreenMuted,
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
    gel: "inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 12px -2px rgba(22,163,74,0.38)",
    inset: "inset 0 1px 0 rgba(255,255,255,0.6)",
    greenCard: elevationToCSS(coloredElevation.greenCard),
  },

  /* Gradients rendered from the shared stop data. */
  gradients: {
    atmosphere: gradientToCSS(gradientTokens.atmosphere),
    card: gradientToCSS(gradientTokens.card),
    greenCard: gradientToCSS(gradientTokens.greenCard),
    greenCardSoft: gradientToCSS(gradientTokens.greenCard),
    buttonPrimary: gradientToCSS(gradientTokens.buttonPrimary),
    mint: gradientToCSS(gradientTokens.mint),
    tile: gradientToCSS(gradientTokens.tile),
    tileRose: gradientToCSS(gradientTokens.tileRose),
    tileAmber: gradientToCSS(gradientTokens.tileAmber),
    tileBlue: gradientToCSS(gradientTokens.tileBlue),
    tileTeal: gradientToCSS(gradientTokens.tileTeal),
    tileSlate: gradientToCSS(gradientTokens.tileSlate),
    iconGreen: gradientToCSS(gradientTokens.iconGreen),
    surfaceRaise: gradientToCSS(gradientTokens.surfaceRaise),
    nav: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(250,253,251,0.97) 100%)",
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
