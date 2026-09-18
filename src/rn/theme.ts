/**
 * React Native / Expo theme.
 *
 * Consumes the shared tokens in src/tokens and renders them into shapes RN
 * understands. Nothing here redefines a value — if you need to change how the
 * app looks, change the token, not this file.
 *
 * Usage:
 *   import { theme, text, shadow } from "../rn/theme";
 *   <View style={theme.card} />
 *   <Text style={text.sectionTitle} />
 *
 * Gradients need <LinearGradient> from expo-linear-gradient, since RN has no
 * native gradient primitive:
 *   <LinearGradient {...linearGradient("greenCard")} style={theme.heroCard} />
 */

import { StyleSheet, Platform, type ViewStyle, type TextStyle } from "react-native";
import {
  colors,
  semantic,
  typography,
  spacing,
  radii,
  elevation,
  gradients,
  metricTint,
  gradientVector,
  type ElevationLevel,
  type GradientName,
} from "../tokens";

/* ------------------------------------------------------------------ */
/* Elevation                                                           */
/* ------------------------------------------------------------------ */

/**
 * One elevation level as an RN shadow.
 *
 * A platform can only paint one shadow per view, so a level's layered shadows
 * have to collapse into a single approximation. We take the *last* layer: a
 * level is authored innermost-first, so the last one is the wide, soft shadow
 * that carries the visible lift. The tight contact shadow above it is a
 * refinement nobody misses on its own.
 *
 * iOS takes shadow* props; Android takes a single elevation value, so the two
 * platforms get their own approximation of the same lift.
 */
export function shadow(level: ElevationLevel): ViewStyle {
  const dominant = level.layers[level.layers.length - 1];
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: dominant.color,
      shadowOffset: { width: dominant.dx, height: dominant.dy },
      shadowOpacity: 1,
      shadowRadius: dominant.blur / 2,
    },
    android: { elevation: level.androidElevation },
    default: {},
  })!;
}

/** A gradient token as props for <LinearGradient>. */
export function linearGradient(name: GradientName) {
  const g = gradients[name];
  if (!g) throw new Error(`Unknown gradient token: "${name}"`);
  const { start, end } = gradientVector(g);
  return {
    colors: [...g.colors] as [string, string, ...string[]],
    ...(g.locations ? { locations: [...g.locations] as [number, number, ...number[]] } : {}),
    start,
    end,
  };
}

/* ------------------------------------------------------------------ */
/* Component styles                                                    */
/* ------------------------------------------------------------------ */

export const theme = StyleSheet.create({
  /* ---- Level 1: page ---- */
  screen: {
    flex: 1,
    backgroundColor: semantic.pageBackground,
  },

  /* ---- Level 2: elevated cards ---- */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    ...shadow(elevation.e2),
  },
  cardFeature: {
    backgroundColor: colors.surface,
    borderRadius: radii.feature,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    ...shadow(elevation.e3),
  },
  cardSmall: {
    backgroundColor: colors.surface,
    borderRadius: radii.small,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    ...shadow(elevation.e1),
  },

  /** Green hero — compose with <LinearGradient {...linearGradient("greenCard")}>. */
  heroCard: {
    borderRadius: radii.feature,
    overflow: "hidden",
    ...shadow(elevation.e3),
  },

  /* ---- Level 3: dimensional icon containers ---- */
  icon: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#C6E9D3",
    backgroundColor: gradients.tile.colors[1],
    ...shadow(elevation.e1),
  },
  iconLarge: { width: 44, height: 44 },
  iconMedium: { width: 40, height: 40 },
  iconSmall: { width: 36, height: 36 },
  /** Solid green control (nav AI button). Compose with iconGreen gradient. */
  iconSolidGreen: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    ...shadow(elevation.e3),
  },

  /* ---- Pills ---- */
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#BEE7CD",
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillAmber: { borderColor: "#FAE3A0", backgroundColor: colors.warningSoft },
  pillRose: { borderColor: "#FDCDD8", backgroundColor: colors.roseSoft },
  pillSlate: { borderColor: "#DEE8F0", backgroundColor: colors.surfaceSecondary },

  /* ---- Buttons ---- */
  buttonBase: {
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  /** Primary: compose with <LinearGradient {...linearGradient("buttonPrimary")}>. */
  buttonPrimaryWrap: {
    borderRadius: radii.pill,
    overflow: "hidden",
    ...shadow(elevation.e2),
  },
  buttonSecondary: {
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(134,202,158,0.65)",
    ...shadow(elevation.e1),
  },
  buttonIcon: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow(elevation.e1),
  },

  /* ---- Inputs and controls ---- */
  field: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: "#E0E6EC",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  track: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: "#EDF3EF",
    borderWidth: 1,
    borderColor: "#DCE9E2",
  },
  trackThumb: {
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    ...shadow(elevation.e1),
  },

  /* ---- Floating navigation ---- */
  navBar: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingBottom: 6,
    ...shadow(elevation.e3),
  },
  /* A selected destination is carried by colour alone — tint the icon and the
     label with `semantic.accentDeep`. There is deliberately no background
     capsule; adding one unbalances the bar against the raised AI control. */

  /* ---- Avatars ---- */
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.green50,
    borderWidth: 1,
    borderColor: "#C6E9D3",
    ...shadow(elevation.e1),
  },

  /* ---- List rows ---- */
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairlineSoft,
  },

  /* ---- Layout ---- */
  screenPadding: { paddingHorizontal: spacing.pageX },
  sectionGap: { marginTop: spacing.sectionGap },
  /** Bottom inset for screen content so the floating nav never covers it. */
  contentBottom: { paddingBottom: spacing.navClearance },
});

/* ------------------------------------------------------------------ */
/* Text styles                                                         */
/* ------------------------------------------------------------------ */

/**
 * Pick the Inter face for a weight.
 *
 * React Native has no font-weight axis for a custom font — the face is chosen
 * by family name — so every piece of text has to name its weight's family
 * explicitly. Spread this into a style instead of writing `fontWeight`:
 *
 *   { fontSize: 14, ...font(600) }
 *
 * `fontWeight` comes along for React Native Web and for any system fallback,
 * which do honour it.
 */
export function font(weight: 400 | 500 | 600 | 700) {
  return {
    fontFamily: typography.familiesRN[weight],
    fontWeight: String(weight) as TextStyle["fontWeight"],
  };
}

/** Tracking is authored in em; RN wants points, so multiply by the size. */
function tracked(size: number, tracking: number) {
  return tracking === 0 ? undefined : { letterSpacing: tracking * size };
}

function textStyle(t: { size: number; weight: number; lineHeight: number; tracking: number }): TextStyle {
  return {
    ...font(t.weight as 400 | 500 | 600 | 700),
    fontSize: t.size,
    lineHeight: t.lineHeight,
    ...tracked(t.size, t.tracking),
  };
}

export const text = StyleSheet.create({
  pageTitle: { ...textStyle(typography.scale.pageTitle), color: semantic.textPrimary } as TextStyle,
  sectionTitle: { ...textStyle(typography.scale.sectionTitle), color: semantic.textPrimary } as TextStyle,
  h3: { ...textStyle(typography.scale.h3), color: semantic.textPrimary } as TextStyle,
  body: { ...textStyle(typography.scale.body), color: semantic.textPrimary } as TextStyle,
  secondary: { ...textStyle(typography.scale.secondary), color: semantic.textSecondary } as TextStyle,
  caption: { ...textStyle(typography.scale.caption), color: semantic.textMuted } as TextStyle,
  cardLabel: { ...textStyle(typography.scale.cardLabel), color: semantic.textSecondary } as TextStyle,
  metric: { ...textStyle(typography.scale.metric), color: semantic.textPrimary } as TextStyle,
  metricLarge: { ...textStyle(typography.scale.metricLarge), color: semantic.textPrimary } as TextStyle,
  heroNumber: { ...textStyle(typography.scale.heroNumber), color: semantic.textPrimary } as TextStyle,
  onGreen: { color: colors.onGreen },
});

/* Re-exports so screens can import everything from one place. */
export {
  colors,
  semantic,
  typography,
  spacing,
  radii,
  elevation,
  gradients,
  metricTint,
};

/** Convenience: the tint pair for a metric's icon container. */
export function tint(metric: string) {
  const t = metricTint(metric);
  return { color: t.fg, backgroundColor: t.tile };
}
