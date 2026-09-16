import { patientTheme } from "../theme";

interface StatusBadgeProps {
  status: string;
}

type Tone = "green" | "amber" | "rose" | "slate";

const map: Record<string, { tone: Tone; label: string }> = {
  active: { tone: "green", label: "Active" },
  connected: { tone: "green", label: "Connected" },
  confirmed: { tone: "green", label: "Confirmed" },
  completed: { tone: "green", label: "Completed" },
  paid: { tone: "green", label: "Paid" },
  normal: { tone: "green", label: "Normal" },
  inrange: { tone: "green", label: "In range" },
  pending: { tone: "amber", label: "Pending" },
  cancelled: { tone: "rose", label: "Cancelled" },
  expired: { tone: "rose", label: "Expired" },
};

const toneClass: Record<Tone, string> = {
  green: "",
  amber: "mh-pill-amber",
  rose: "mh-pill-rose",
  slate: "mh-pill-slate",
};

/** Soft physical pill — embedded into the surface, never a harsh badge. */
export function StatusBadge({ status }: StatusBadgeProps) {
  const key = (status || "").toLowerCase().replace(/[\s_-]/g, "");
  const c = map[key] || { tone: "slate" as Tone, label: status };
  return (
    <span
      className={`mh-pill ${toneClass[c.tone]} px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap`}
      style={c.tone === "slate" ? { color: patientTheme.colors.textSecondary } : undefined}
    >
      {c.label}
    </span>
  );
}
