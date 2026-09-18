/**
 * React Native rendering of the patient experience's surfaces.
 *
 * The web equivalent is `src/app/patient/patient.css`. The two files are meant
 * to be read side by side: every class in that stylesheet has a counterpart
 * here, built from the same tokens, so a card looks the same on both platforms.
 *
 * Where RN cannot express a CSS effect the difference is noted at the style.
 */

import { StyleSheet, Platform, type ViewStyle } from "react-native";
import { colors, spacing, radii, semantic, gradients, elevation, coloredElevation } from "@tokens";
import { shadow } from "@rn/theme";

/* ------------------------------------------------------------------ */
/* Page background                                                     */
/* ------------------------------------------------------------------ */

/**
 * `.mh-atmosphere` — the page is effectively white, with a barely-there teal
 * cast so it still has a direction of light rather than being a flat fill.
 *
 * It used to carry visible mint bloom, which is what made the product read as
 * green: a tinted page also fights every tinted card placed on it, so the
 * ground is now neutral and the colour lives in the content. CSS does it with
 * three radial gradients stacked on a linear one; RN has no radial background,
 * so `Atmosphere.tsx` paints them with an SVG layer instead. These are just
 * the base colour and the radial stops.
 */
export const atmosphere = {
  base: ["#FCFDFE", "#FAFBFC", "#F8FAFB"] as const,
  /** [colour, cx, cy, rx% , ry% , fade-at] as CSS writes them. */
  blooms: [
    { color: "rgba(214,236,242,0.16)", cx: "15%", cy: "-10%", rx: 1.2, ry: 0.8, to: 0.55 },
    { color: "rgba(226,232,240,0.14)", cx: "95%", cy: "5%", rx: 1.0, ry: 0.7, to: 0.55 },
    { color: "rgba(219,234,240,0.12)", cx: "50%", cy: "108%", rx: 0.9, ry: 0.6, to: 0.6 },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/** `.mh-card` — the raised white surface everything sits on. */
export const card: ViewStyle = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: "rgba(226,236,231,0.9)",
  borderRadius: radii.card,
  ...shadow(elevation.e2),
};

/** `.mh-card-feature` — the larger radius, a touch more lift. */
export const cardFeature: ViewStyle = {
  ...card,
  borderRadius: radii.feature,
  ...shadow(elevation.e3),
};

/** `.mh-card-small` — list rows and compact tiles. */
export const cardSmall: ViewStyle = {
  ...card,
  borderRadius: radii.small,
  ...shadow(elevation.e1),
};

/**
 * `.mh-wash-card` / the hero's `background: gradients.wash`.
 *
 * The palest tinted ground: it still reads as a tinted panel against the
 * neutral page without competing with the brand card. On web this is a CSS
 * gradient; here the card is a plain view and the caller wraps it in
 * `<LinearGradient {...linearGradient("wash")}>`. These are the properties that
 * go on the gradient element itself.
 *
 * Was `mintCard`; the old name is kept as an alias below.
 */
export const washCard: ViewStyle = {
  borderWidth: 1,
  borderColor: "rgba(196,224,233,0.75)",
  borderRadius: radii.feature,
  overflow: "hidden",
  ...shadow(elevation.e2),
};

/** @deprecated Use `washCard`. */
export const mintCard: ViewStyle = washCard;

/** `.mh-brand-card` — compose with `<LinearGradient {...linearGradient("brandCard")}>`. */
export const brandCard: ViewStyle = {
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.14)",
  borderRadius: radii.feature,
  overflow: "hidden",
  ...shadow(coloredElevation.brandCard),
};

/** @deprecated Use `brandCard`. */
export const greenCard: ViewStyle = brandCard;

/* ------------------------------------------------------------------ */
/* Dimensional icon containers                                         */
/* ------------------------------------------------------------------ */

/**
 * `.mh-icon` — the frosted-medical-plastic disc behind a metric glyph.
 * Compose with `<LinearGradient {...linearGradient(tileName)}>`; pass the
 * metric's `fg` colour to the glyph.
 */
export const iconTile: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: "rgba(196,224,233,0.9)",
  ...shadow(elevation.e1),
};

/** Border colours per category — the rest of the tile comes from its gradient. */
export const iconTileBorder: Record<string, string> = {
  brand: "rgba(196,224,233,0.9)",
  /** @deprecated Use `brand`. */
  green: "rgba(196,224,233,0.9)",
  leaf: "rgba(195,233,189,0.9)",
  rose: "rgba(253,205,216,0.9)",
  amber: "rgba(252,230,168,0.9)",
  blue: "rgba(196,219,252,0.9)",
  teal: "rgba(178,235,224,0.9)",
  violet: "rgba(216,205,250,0.9)",
  indigo: "rgba(199,210,254,0.9)",
  slate: "rgba(220,230,238,0.9)",
};

/**
 * `.mh-icon-brand` — the solid brand control (nav AI button, hero marks).
 * Compose with `<LinearGradient {...linearGradient("brandSolid")}>`.
 *
 * The web version also carries inset highlights down each edge; RN cannot
 * inset-shadow, so the gel comes from the gradient's own stops and the lit
 * border alone. At 40px nobody reads the difference.
 */
export const iconBrand: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.28)",
  ...shadow(coloredElevation.navBar),
};

/** @deprecated Use `iconBrand`. */
export const iconGreen: ViewStyle = iconBrand;

/* ------------------------------------------------------------------ */
/* Pills, tracks, buttons                                              */
/* ------------------------------------------------------------------ */

/** `.mh-pill` — compose with `<LinearGradient {...linearGradient(...)}>` when tinted.
 *  The default pill is the *success* pill, so it is leaf. */
export const pill: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: "rgba(195,233,189,0.85)",
  paddingHorizontal: 10,
  paddingVertical: 4,
};

export const pillTone = {
  leaf: { borderColor: "rgba(195,233,189,0.85)", bg: ["#F5FCF3", "#E7F7E2"] as const, fg: colors.leaf700 },
  /** @deprecated Use `leaf`. */
  green: { borderColor: "rgba(195,233,189,0.85)", bg: ["#F5FCF3", "#E7F7E2"] as const, fg: colors.leaf700 },
  amber: { borderColor: "rgba(250,227,160,0.85)", bg: ["#FFFCF3", "#FEF3C7"] as const, fg: "#B45309" },
  rose: { borderColor: "rgba(253,205,216,0.85)", bg: ["#FFF7F9", "#FFE4E9"] as const, fg: "#BE123C" },
  slate: { borderColor: "rgba(222,232,240,0.9)", bg: ["#FBFCFE", "#F0F4F8"] as const, fg: semantic.textSecondary },
} as const;

/** Plain tinted status text — the default way a state is drawn. */
export const statusText = {
  fontSize: 12,
  fontWeight: "600" as const,
  letterSpacing: -0.005 * 12,
};

/** `.mh-track` — the recessed rail behind a segmented switch. Compose with a tile gradient. */
export const track: ViewStyle = {
  flexDirection: "row",
  gap: 4,
  padding: 4,
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: "rgba(224,230,236,0.95)",
};

/** `.mh-tab-active` — compose with `<LinearGradient {...linearGradient("brandTab")}>`. */
export const tabActive: ViewStyle = {
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: "rgba(5,65,79,0.55)",
  overflow: "hidden",
};

/** `.mh-btn-primary` — compose with `brandButton`. */
export const buttonPrimary: ViewStyle = {
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: "rgba(5,65,79,0.85)",
  overflow: "hidden",
  ...shadow(elevation.e2),
};

/** `.mh-btn-secondary` — the raised white pill. */
export const buttonSecondary: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  borderRadius: radii.pill,
  borderWidth: 1,
  borderColor: "rgba(133,192,206,0.65)",
  backgroundColor: colors.surface,
  ...shadow(elevation.e1),
};

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

/** `.mh-nav` — the floating bar. Compose with `<LinearGradient {...linearGradient("navBar")}>`. */
export const navBar: ViewStyle = {
  borderWidth: 1,
  borderBottomWidth: 0,
  borderColor: "rgba(228,233,238,0.9)",
  borderTopLeftRadius: 26,
  borderTopRightRadius: 26,
  paddingTop: 10,
  ...shadow(coloredElevation.navBar),
};

/**
 * `.mh-nav-ai-halo` — the pale teal glow that seats the raised AI control.
 * Rendered as an SVG radial in `BottomNavigation`; these are its bounds.
 *
 * No `top` offset: the glow is anchored to the top of the nav's container,
 * which reserves the room the raised control needs (see NAV_RAISE there)
 * rather than drawing outside the bar, where Android would clip it.
 */
export const navHalo = { width: 96, height: 66 } as const;

/* ------------------------------------------------------------------ */
/* Small shared bits                                                   */
/* ------------------------------------------------------------------ */

export const hairline = { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineSoft } as const;

export const screenPadding = { paddingHorizontal: spacing.pageX } as const;

/** Clearance so the floating nav never covers the last row of content. */
export const navClearance = { paddingBottom: spacing.navClearance } as const;

/**
 * `fontVariantNumeric: "tabular-nums"` on web. RN supports the same property
 * on iOS and on Android from API 26; below that the digits simply stay
 * proportional, which is a cosmetic loss, not a broken layout.
 */
export const tabular = Platform.select<{ fontVariant: ("tabular-nums")[] }>({
  default: { fontVariant: ["tabular-nums"] },
});

export { gradients };
