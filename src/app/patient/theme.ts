// MicroHealth Patient Experience — Design Tokens
//
// The visual language: SOFT + TACTILE + DIMENSIONAL + MINT + PREMIUM HEALTHCARE.
// Physically believable depth, extremely soft shadows, a pale mint atmosphere,
// restrained emerald green, navy ink (never pure black). Scoped to the patient
// redesign — does not affect the admin theme.

export const patientTheme = {
  colors: {
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

    // Aliases kept for existing components
    border: "#E8EEF2",
    borderLight: "#F1F5F7",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    textMuted: "#94A3B8",

    primaryGreen: "#16A34A",
    primaryDark: "#15803D",
    primaryDeep: "#14532D",
    primarySoft: "#DCFCE7",
    primaryPale: "#F0FDF4",
    aiAccent: "#16A34A",

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
  },

  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    /* Weight and size carry the hierarchy — not everything is bold. */
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
    heroNumber: { size: 32, weight: 700, lineHeight: 1.05, tracking: "-0.03em" },
  },

  /* Strict 4 / 8 / 12 / 16 / 24 / 32 scale. Sections breathe at 24. */
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    pageX: 20,
    pageY: 16,
    cardPadding: 18,
    sectionGap: 24,
    itemGap: 12,
  },

  radius: {
    small: 16,
    card: 20,
    feature: 24,
    control: 14,
    button: 999,
    pill: 9999,
  },

  /* Elevation ladder. Every step is extremely soft and spread —
     ambient shadow for contact, secondary for lift, never dark or sharp. */
  shadows: {
    e1: "0 1px 2px rgba(16,24,40,0.04), 0 4px 12px -4px rgba(16,24,40,0.06)",
    e2: "0 1px 2px rgba(16,24,40,0.04), 0 10px 24px -8px rgba(16,24,40,0.10)",
    e3: "0 2px 4px rgba(16,24,40,0.05), 0 20px 40px -12px rgba(16,24,40,0.14)",

    // Aliases kept for existing components
    soft: "0 1px 2px rgba(16,24,40,0.04), 0 4px 12px -4px rgba(16,24,40,0.06)",
    medium: "0 1px 2px rgba(16,24,40,0.04), 0 10px 24px -8px rgba(16,24,40,0.10)",
    strong: "0 2px 4px rgba(16,24,40,0.05), 0 20px 40px -12px rgba(16,24,40,0.14)",

    /** Lit top edge of a raised surface. */
    emboss: "inset 0 1px 0 rgba(255,255,255,0.9)",
    /** Gel key — colored ground shadow + lit top. */
    gel: "inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 12px -2px rgba(22,163,74,0.38)",
    inset: "inset 0 1px 0 rgba(255,255,255,0.6)",

    /* Green feature cards */
    greenCard: "0 2px 6px rgba(16,24,40,0.06), 0 16px 32px -12px rgba(22,101,52,0.35)",
  },

  /* Named gradients — the atmosphere and lit surfaces */
  gradients: {
    /* Page atmosphere: near-white revealing pale mint */
    atmosphere:
      "radial-gradient(120% 80% at 15% -10%, rgba(214,244,224,0.55) 0%, rgba(214,244,224,0) 55%)," +
      "radial-gradient(100% 70% at 95% 5%, rgba(219,234,254,0.35) 0%, rgba(219,234,254,0) 55%)," +
      "radial-gradient(90% 60% at 50% 108%, rgba(203,239,217,0.42) 0%, rgba(203,239,217,0) 60%)," +
      "linear-gradient(180deg, #F8FBF9 0%, #F5F9F6 55%, #F2F8F4 100%)",

    /* Raised white card: lit at the top, settling slightly at the base */
    card: "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 62%, #FBFDFC 100%)",

    /* Green hero / feature card */
    greenCard: "linear-gradient(158deg, #1CAE51 0%, #16A34A 32%, #15803D 72%, #14703A 100%)",
    greenCardSoft: "linear-gradient(158deg, #22C55E 0%, #16A34A 55%, #15803D 100%)",

    /* Primary pill button */
    buttonPrimary: "linear-gradient(180deg, #1FB055 0%, #16A34A 55%, #158840 100%)",

    /* Mint surface — feature cards, welcome panels */
    mint: "linear-gradient(165deg, #F0FBF3 0%, #E6F6EC 60%, #DFF2E6 100%)",

    /* Dimensional icon container */
    tile: "linear-gradient(160deg, #F4FCF6 0%, #E8F8EE 55%, #DCF2E5 100%)",
    tileRose: "linear-gradient(160deg, #FFF5F7 0%, #FFE7EC 55%, #FFDCE3 100%)",
    tileAmber: "linear-gradient(160deg, #FFFBF0 0%, #FEF3C7 55%, #FDE9B0 100%)",
    tileBlue: "linear-gradient(160deg, #F4F8FF 0%, #E3EEFE 55%, #D8E8FD 100%)",
    tileTeal: "linear-gradient(160deg, #F0FCFA 0%, #D9F7F1 55%, #CCF3EA 100%)",
    tileSlate: "linear-gradient(160deg, #FAFCFD 0%, #F0F4F8 55%, #E9EFF4 100%)",

    /* Floating navigation surface */
    nav: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(252,254,253,0.96) 100%)",
  },

  motion: {
    spring: { type: "spring", stiffness: 300, damping: 28 },
    gentle: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    quick: { duration: 0.16, ease: "easeOut" },
  },
} as const;

export type PatientTheme = typeof patientTheme;

/** Per-category tint for dimensional icon containers. */
export function metricTint(metric: string): { fg: string; tile: string } {
  const c = patientTheme.colors;
  const g = patientTheme.gradients;
  switch (metric) {
    case "heartRate":
      return { fg: c.rose, tile: g.tileRose };
    case "bloodPressure":
      return { fg: c.blue, tile: g.tileBlue };
    case "spo2":
      return { fg: c.teal, tile: g.tileTeal };
    case "temperature":
      return { fg: c.amber, tile: g.tileAmber };
    default:
      return { fg: c.primaryDark, tile: g.tile };
  }
}

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
