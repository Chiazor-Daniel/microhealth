/**
 * MicroHealth colour tokens — framework-agnostic.
 *
 * Plain hex/rgba strings only: no CSS variables, no DOM assumptions, so the
 * same values drive the web app and a React Native / Expo build.
 *
 * ## Two hues, two jobs
 *
 * The palette is built on a split that the earlier single green could not
 * express. One green was doing both jobs — it was the brand *and* it meant
 * "healthy" — so the product read as overwhelmingly green and neither meaning
 * landed. The two roles are now separate hues:
 *
 *   teal — structure and identity. Headings, the nav bar, primary actions,
 *          large visual elements, chart strokes. This is `brand`.
 *   leaf — signal. Success, the health-score ring, checkmarks, the in-range
 *          state, the leaf in the logo. This is `signal`.
 *
 * A rule of thumb when adding a colour: if it answers "what is this?" it is
 * teal; if it answers "how am I doing?" it is leaf.
 */

export const colors = {
  /* ---- Teal ramp: the brand. Muted, deep, clinical. Never neon. ---- */
  teal50: "#F0F7F9",
  teal100: "#DBEDF2",
  teal200: "#B6DAE3",
  teal300: "#85C0CE",
  teal400: "#4C9FB3",
  teal500: "#1E7F94",
  teal600: "#0A6B80",
  teal700: "#005F73", // brand primary — headings, nav, primary actions
  teal800: "#08546C", // brand deep — pressed states, text on pale teal
  teal900: "#05404F",
  teal950: "#032B35",

  /* ---- Leaf ramp: the accent. Vibrant, but only ever a signal. ---- */
  leaf50: "#F1FAEF",
  leaf100: "#E0F4DC",
  leaf200: "#C3E9BD",
  leaf300: "#97D98F",
  leaf400: "#6EC763",
  leaf500: "#4CAF50", // the bright accent — health-score ring, highlights
  leaf600: "#53A627", // the brand leaf — success, checkmarks
  leaf700: "#45841F", // success on a light ground, where contrast matters
  leaf800: "#386A1B",
  leaf900: "#2A4F14",

  /* ---- Pale washes: the tinted panel grounds. ---- */
  wash: "#F2F8FA",
  washDeep: "#E6F1F5",
  washPale: "#F8FCFD",

  /* ---- Ink: navy / blue-gray. Never pure black. ---- */
  ink: "#0F172A",
  inkSecondary: "#64748B",
  inkMuted: "#94A3B8",

  /* ---- Surfaces: cool neutrals, per the design system's own swatches.
     These were drifting green; a tinted *page* fights every tinted *card*
     sitting on it, so the ground is neutral and the colour lives in the
     content. ---- */
  background: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceSecondary: "#F3F4F6",
  hairline: "#E5E7EB",
  hairlineSoft: "#F1F3F5",
  hairlineCool: "#EEF1F4",
  scrim: "rgba(15, 23, 42, 0.32)",

  /* ---- Status. Success is leaf by definition; the rest are independent
     hues so a warning can never be mistaken for "on brand". ---- */
  success: "#53A627",
  successDeep: "#45841F",
  successSoft: "#E0F4DC",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  error: "#EF4444",
  errorSoft: "#FEE2E2",
  info: "#3B82F6",
  infoSoft: "#DBEAFE",

  /* ---- Tints for dimensional icon containers.
     Deliberately kept off the brand teal so a metric tile never reads as
     chrome. `teal` here is the lighter, cyan-er oxygen hue. ---- */
  rose: "#E11D48",
  roseSoft: "#FFE4E9",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  blue: "#2563EB",
  blueSoft: "#DBEAFE",
  teal: "#0D9488",
  tealSoft: "#CCFBF1",
  violet: "#7C3AED",
  violetSoft: "#EDE9FE",
  indigo: "#4F46E5",
  indigoSoft: "#E0E7FF",
  slate: "#475569",
  slateSoft: "#E9EFF4",

  /* ---- Text on coloured surfaces ---- */
  onBrand: "#FFFFFF",
  onBrandMuted: "rgba(255, 255, 255, 0.80)",

  /* ==================================================================
     @deprecated — the pre-teal `green*` ramp.
     ==================================================================
     One green used to serve both brand and success, which is exactly the
     ambiguity that made the product read as all-green. It is now split into
     `teal` (structure) and `leaf` (signal), and these keys alias `teal` so
     screens that have not been migrated yet keep rendering correctly rather
     than silently keeping the old hue.

     `green*` is *only* a brand alias — nothing here means "success" any more.
     That is `success` / `successSoft`, which are leaf.

     Delete this block once nothing references it. */
  green50: "#F0F7F9",
  green100: "#DBEDF2",
  green200: "#B6DAE3",
  green300: "#85C0CE",
  green400: "#4C9FB3",
  green500: "#1E7F94",
  green600: "#0A6B80",
  green700: "#005F73",
  green800: "#08546C",
  green900: "#05404F",

  /** @deprecated Renamed to `wash*` — same values. */
  mint: "#F2F8FA",
  mintDeep: "#E6F1F5",
  mintPale: "#F8FCFD",

  /** @deprecated Renamed to `onBrand*` — same values. */
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

  /* ---- Structure: identity, navigation, primary actions, headings ---- */
  brand: colors.teal700,
  brandDeep: colors.teal800,
  brandSoft: colors.teal100,
  brandPale: colors.teal50,

  /* ---- Signal: success, health score, checkmarks, in-range ---- */
  signal: colors.leaf600,
  signalBright: colors.leaf500,
  signalDeep: colors.leaf700,
  signalSoft: colors.leaf100,
  signalPale: colors.leaf50,

  /**
   * @deprecated Aliases kept while screens migrate — both now resolve to the
   * brand teal. Prefer `brand` / `brandDeep` so the role is explicit.
   */
  accent: colors.teal700,
  accentDeep: colors.teal800,
} as const;
