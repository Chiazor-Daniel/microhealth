import { Heart } from "lucide-react";
import { patientTheme } from "../theme";

interface HealthStatusCardProps {
  status: "stable" | "watch" | "attention" | "urgent";
  label: string;
  updatedAt?: string;
}

const config = {
  stable: { color: patientTheme.colors.success, bg: patientTheme.colors.primaryPale, text: "Your health looks stable" },
  watch: { color: patientTheme.colors.warning, bg: "#FFFBEB", text: "Something worth watching" },
  attention: { color: "#EA580C", bg: "#FFF7ED", text: "Needs your attention" },
  urgent: { color: patientTheme.colors.error, bg: "#FEF2F2", text: "Please address promptly" },
};

export function HealthStatusCard({ status, label, updatedAt }: HealthStatusCardProps) {
  const c = config[status];
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{
        background: c.bg,
        border: `1px solid ${c.color}20`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${c.color}15` }}
      >
        <Heart size={18} style={{ color: c.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: c.color }}>{c.text}</p>
        <p className="text-xs" style={{ color: patientTheme.colors.textMuted }}>
          {label} · {updatedAt || "Updated just now"}
        </p>
      </div>
    </div>
  );
}
