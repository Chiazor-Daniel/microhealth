// MicroHealth Patient Experience — Design Tokens
// Matches the approved mockup: cool slate neutrals + vibrant green primary, Inter type,
// flat white surfaces, 16px card radius, minimal shadows.
// These tokens are scoped to the patient redesign and do not affect the admin theme.

export const patientTheme = {
  colors: {
    primaryGreen: "#16A34A",
    primaryDark: "#15803D",
    primaryDeep: "#14532D",
    primarySoft: "#DCFCE7",
    primaryPale: "#F0FDF4",

    background: "#F8FAFB",
    surface: "#FFFFFF",
    surfaceSecondary: "#F1F5F9",
    border: "#E5E7EB",
    borderLight: "#F3F4F6",

    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    textMuted: "#94A3B8",

    success: "#16A34A",
    successSoft: "#DCFCE7",
    warning: "#F59E0B",
    warningSoft: "#FEF3C7",
    error: "#EF4444",
    errorSoft: "#FEE2E2",
    info: "#3B82F6",
    infoSoft: "#DBEAFE",
    aiAccent: "#16A34A",
  },

  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    h1: { size: 24, weight: 600, lineHeight: 1.25 },
    h2: { size: 18, weight: 600, lineHeight: 1.3 },
    h3: { size: 16, weight: 600, lineHeight: 1.35 },
    body: { size: 14, weight: 400, lineHeight: 1.5 },
    secondary: { size: 13, weight: 400, lineHeight: 1.45 },
    caption: { size: 12, weight: 500, lineHeight: 1.4 },
    vitalNumber: { size: 24, weight: 700, lineHeight: 1.1 },
    heroNumber: { size: 32, weight: 700, lineHeight: 1.1 },
  },

  spacing: {
    pageX: 20,
    pageY: 16,
    cardPadding: 16,
    sectionGap: 24,
    itemGap: 12,
  },

  radius: {
    card: 16,
    button: 12,
    control: 12,
    pill: 9999,
  },

  shadows: {
    soft: "0 1px 2px rgba(0, 0, 0, 0.05)",
    medium: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    strong: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
    inset: "inset 0 1px 0 rgba(255,255,255,0.6)",
  },

  motion: {
    spring: { type: "spring", stiffness: 300, damping: 28 },
    gentle: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    quick: { duration: 0.15, ease: "easeOut" },
  },
} as const;

export type PatientTheme = typeof patientTheme;

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
