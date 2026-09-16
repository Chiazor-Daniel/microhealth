/**
 * MicroHealth colour tokens — framework-agnostic.
 *
 * Plain hex/rgba strings only: no CSS variables, no DOM assumptions, so the
 * same values drive the web app and a React Native / Expo build.
 */

export const colors = {
  /* ---- Green ramp: rich, natural emerald. Never neon. ---- */
  green50: "#F0FDF4",
  green100: "#DCFCE7",
  green200: "#BBF7D0",
  green300: "#86EFAC",
  green400: "#4ADE80",
  green500: "#22C55E",
  green600: "#16A34A", // primary action
  green700: "#15803D", // deep — active states, text on mint
  green800: "#166534",
  green900: "#14532D",

  /* ---- Mint atmosphere ---- */
  mint: "#EAF7EE",
  mintDeep: "#DCF0E3",
  mintPale: "#F3FAF5",

  /* ---- Ink: navy / blue-gray. Never pure black. ---- */
  ink: "#0F172A",
  inkSecondary: "#64748B",
  inkMuted: "#94A3B8",

  /* ---- Surfaces ---- */
  background: "#F7FAF8",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceSecondary: "#F4F7F9",
  hairline: "#E8EEF2",
  hairlineSoft: "#F1F5F7",
  scrim: "rgba(15, 23, 42, 0.32)",

  /* ---- Status ---- */
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  error: "#EF4444",
  errorSoft: "#FEE2E2",
  info: "#3B82F6",
  infoSoft: "#DBEAFE",

  /* ---- Tints for dimensional icon containers ---- */
  rose: "#E11D48",
  roseSoft: "#FFE4E9",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  blue: "#2563EB",
  blueSoft: "#DBEAFE",
  teal: "#0D9488",
  tealSoft: "#CCFBF1",

  /* ---- Text on coloured surfaces ---- */
  onGreen: "#FFFFFF",
  onGreenMuted: "rgba(255, 255, 255, 0.80)",
} as const;

export type ColorToken = keyof typeof colors;

/** Semantic roles — what a component should reach for first. */
export const semantic = {
  textPrimary: colors.ink,
  textSecondary: colors.inkSecondary,
  textMuted: colors.inkMuted,
  pageBackground: colors.background,
  cardSurface: colors.surface,
  border: colors.hairline,
  borderSoft: colors.hairlineSoft,
  accent: colors.green600,
  accentDeep: colors.green700,
} as const;
