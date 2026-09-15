// MicroHealth Patient Experience — Calm Glass Design Tokens
// These tokens are scoped to the patient redesign and do not affect the admin theme.

export const patientTheme = {
  colors: {
    primaryGreen: "#16A34A",
    primaryDark: "#15803D",
    primarySoft: "#DCFCE7",
    primaryPale: "#F0FDF4",

    background: "#F6FAF7",
    surface: "#FFFFFF",
    glassSurface: "rgba(255,255,255,0.72)",
    border: "rgba(16,24,40,0.08)",

    textPrimary: "#102118",
    textSecondary: "#627168",
    textMuted: "#8B968F",

    success: "#16A34A",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    aiAccent: "#7DBA8A",
  },

  typography: {
    fontFamily: "'Work Sans', system-ui, sans-serif",
    h1: { size: 30, weight: 700, lineHeight: 1.15 },
    h2: { size: 24, weight: 600, lineHeight: 1.2 },
    h3: { size: 18, weight: 600, lineHeight: 1.25 },
    body: { size: 15, weight: 400, lineHeight: 1.5 },
    secondary: { size: 13, weight: 400, lineHeight: 1.45 },
    caption: { size: 12, weight: 500, lineHeight: 1.4 },
    vitalNumber: { size: 36, weight: 700, lineHeight: 1.1 },
  },

  spacing: {
    pageX: 20,
    pageY: 16,
    cardPadding: 18,
    sectionGap: 20,
    itemGap: 12,
  },

  radius: {
    card: 24,
    button: 16,
    control: 12,
    pill: 9999,
  },

  shadows: {
    soft: "0 4px 16px rgba(16,24,40,0.06)",
    medium: "0 8px 28px rgba(16,24,40,0.08)",
    strong: "0 16px 40px rgba(16,24,40,0.10)",
    inset: "inset 0 1px 0 rgba(255,255,255,0.8)",
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
