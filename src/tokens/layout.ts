/**
 * Type, spacing, radius and motion tokens — framework-agnostic.
 *
 * Sizes are unitless numbers (logical pixels), which is what React Native's
 * StyleSheet wants. The web layer appends "px" where a CSS length is needed.
 */

export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  /**
   * React Native resolves a custom font by *family*, not by weight — there is
   * no font-weight axis to pick a face from. So each weight is registered as
   * its own family (see the `useFonts` call in mobile/app/_layout.tsx) and a
   * weight is selected by naming the family. The web build ignores this and
   * uses `fontFamily` + `fontWeight` as usual.
   *
   * Getting this wrong is invisible in code but glaring on screen: text falls
   * back to the system face, which is a different width, so every screen
   * renders at the right size and the wrong shape.
   */
  familiesRN: {
    400: "Inter_400Regular",
    500: "Inter_500Medium",
    600: "Inter_600SemiBold",
    700: "Inter_700Bold",
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  /* Weight and size carry hierarchy — not everything is bold. */
  scale: {
    pageTitle: { size: 23, weight: 700, lineHeight: 29, tracking: -0.02 },
    sectionTitle: { size: 16, weight: 600, lineHeight: 21, tracking: -0.01 },
    h3: { size: 15, weight: 600, lineHeight: 20, tracking: -0.01 },
    body: { size: 14, weight: 400, lineHeight: 22, tracking: 0 },
    secondary: { size: 13, weight: 400, lineHeight: 20, tracking: 0 },
    caption: { size: 12, weight: 500, lineHeight: 17, tracking: 0 },
    cardLabel: { size: 13, weight: 500, lineHeight: 17, tracking: 0 },
    metric: { size: 26, weight: 700, lineHeight: 27, tracking: -0.03 },
    metricLarge: { size: 32, weight: 700, lineHeight: 34, tracking: -0.03 },
    heroNumber: { size: 34, weight: 700, lineHeight: 35, tracking: -0.03 },
  },
} as const;

/** Strict 4 / 8 / 12 / 16 / 24 / 32. Sections breathe at 24. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  /**
   * The step between the blocks of a screen.
   *
   * 20 is the rhythm the web build lands on (`space-y-5`), and it sits between
   * `md` and `lg` — so it is a token rather than something a screen rounds to
   * one side or the other. Native screens use it for the same gap; without it
   * every screen's content drifts upward by a few pixels a block.
   */
  blockGap: 20,
  /** Layout rhythm. Screens pad 20 on every side of the content column. */
  pageX: 20,
  pageY: 20,
  cardPadding: 18,
  sectionGap: 24,
  itemGap: 12,
  /** Clearance for the floating nav, above the safe area. */
  navClearance: 104,
} as const;

export const radii = {
  small: 16,
  card: 20,
  feature: 24,
  control: 14,
  pill: 999,
} as const;

export const motion = {
  /** Durations in ms — RN Animated and CSS both take these. */
  duration: { quick: 120, base: 220, slow: 320 },
  easing: {
    /** cubic-bezier(0.16, 1, 0.3, 1) — the app's standard ease-out. */
    standard: [0.16, 1, 0.3, 1] as const,
  },
} as const;
