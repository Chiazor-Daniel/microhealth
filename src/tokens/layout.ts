/**
 * Type, spacing, radius and motion tokens — framework-agnostic.
 *
 * Sizes are unitless numbers (logical pixels), which is what React Native's
 * StyleSheet wants. The web layer appends "px" where a CSS length is needed.
 */

export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  /** RN: pass a font family name registered with expo-font instead. */
  fontFamilyRN: "Inter",
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
  /** Layout rhythm */
  pageX: 20,
  pageY: 16,
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
