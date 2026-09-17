import { patientTheme } from "../theme";

interface StatusBadgeProps {
  status: string;
  /**
   * How the status is drawn.
   *
   * "text" (default) — plain tinted text, which is how the design system draws
   *   ordinary states (Normal, Confirmed, Pending). Reserving the capsule for
   *   the one state that genuinely needs to stand out keeps the screens calm.
   * "pill" — the soft capsule. Only the range state uses this.
   */
  variant?: "text" | "pill";
}

type Tone = "green" | "amber" | "rose" | "slate";

const map: Record<string, { tone: Tone; label: string; pill?: boolean }> = {
  active: { tone: "green", label: "Active" },
  connected: { tone: "green", label: "Connected" },
  confirmed: { tone: "green", label: "Confirmed" },
  completed: { tone: "green", label: "Completed" },
  paid: { tone: "green", label: "Paid" },
  normal: { tone: "green", label: "Normal" },
  low: { tone: "amber", label: "Low" },
  high: { tone: "rose", label: "High" },
  // The one state the design system draws as a capsule.
  inrange: { tone: "green", label: "In range", pill: true },
  pending: { tone: "amber", label: "Pending" },
  cancelled: { tone: "rose", label: "Cancelled" },
  expired: { tone: "rose", label: "Expired" },
};

const pillClass: Record<Tone, string> = {
  green: "",
  amber: "mh-pill-amber",
  rose: "mh-pill-rose",
  slate: "mh-pill-slate",
};

const textColor: Record<Tone, string> = {
  green: patientTheme.colors.primaryDark,
  amber: "#B45309",
  rose: "#BE123C",
  slate: patientTheme.colors.textSecondary,
};

/**
 * A status label. Plain tinted text by default; a capsule only where the
 * design system calls for one (the metric range state).
 */
export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const key = (status || "").toLowerCase().replace(/[\s_-]/g, "");
  const c = map[key] || { tone: "slate" as Tone, label: status };
  const asPill = variant === "pill" || (variant === undefined && c.pill);

  if (!asPill) {
    return (
      <span
        className="text-[12px] font-semibold whitespace-nowrap"
        style={{ color: textColor[c.tone], letterSpacing: "-0.005em" }}
      >
        {c.label}
      </span>
    );
  }

  return (
    <span
      className={`mh-pill ${pillClass[c.tone]} px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap`}
      style={c.tone === "slate" ? { color: patientTheme.colors.textSecondary } : undefined}
    >
      {c.label}
    </span>
  );
}
