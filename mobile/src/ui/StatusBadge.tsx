import { Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, semantic } from "@tokens";
import { pill, pillTone, statusText } from "./styles";

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

type Tone = keyof typeof pillTone;

const map: Record<string, { tone: Tone; label: string; pill?: boolean }> = {
  active: { tone: "green", label: "Active" },
  connected: { tone: "green", label: "Connected" },
  confirmed: { tone: "green", label: "Confirmed" },
  completed: { tone: "green", label: "Completed" },
  paid: { tone: "green", label: "Paid" },
  normal: { tone: "green", label: "Normal" },
  low: { tone: "amber", label: "Low" },
  high: { tone: "rose", label: "High" },
  /* Attention isn't high or low yet — the amber rung between them. */
  attention: { tone: "amber", label: "Watch" },
  // The one state the design system draws as a capsule.
  inrange: { tone: "green", label: "In range", pill: true },
  pending: { tone: "amber", label: "Pending" },
  cancelled: { tone: "rose", label: "Cancelled" },
  expired: { tone: "rose", label: "Expired" },
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
    return <Text style={[statusText, { color: pillTone[c.tone].fg }]}>{c.label}</Text>;
  }

  const t = pillTone[c.tone];
  return (
    <LinearGradient
      colors={[t.bg[0], t.bg[1]]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[pill, { borderColor: t.borderColor, paddingHorizontal: 10, paddingVertical: 4 }]}
    >
      <Text style={[statusText, { fontSize: 11, color: t.fg }]}>{c.label}</Text>
    </LinearGradient>
  );
}

/** The tone a status resolves to, for callers that tint something else by it. */
export function statusTone(status: string) {
  const key = (status || "").toLowerCase().replace(/[\s_-]/g, "");
  return (map[key]?.tone ?? "slate") as Tone;
}
