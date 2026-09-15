import { Sparkles, TrendingUp, Clock, AlertCircle, Heart, Activity } from "lucide-react";
import { patientTheme, statusColor } from "../theme";

export interface InsightCardProps {
  priority: "info" | "watch" | "attention" | "urgent";
  title: string;
  message: string;
  type?: "trend" | "medication" | "appointment" | "lab" | "recovery" | "wearable" | "system";
  actions?: { label: string; onClick: () => void }[];
  onClick?: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  trend: <TrendingUp size={16} />,
  medication: <Clock size={16} />,
  appointment: <Clock size={16} />,
  lab: <Activity size={16} />,
  recovery: <Heart size={16} />,
  wearable: <AlertCircle size={16} />,
  system: <Sparkles size={16} />,
};

export function InsightCard({ priority, title, message, type = "system", actions, onClick }: InsightCardProps) {
  const color = statusColor(priority);
  return (
    <div
      onClick={onClick}
      className="p-4"
      style={{
        background:
          priority === "info"
            ? `${patientTheme.colors.primaryPale}80`
            : `${color}10`,
        borderRadius: patientTheme.radius.card,
        border: `1px solid ${color}18`,
        boxShadow: patientTheme.shadows.soft,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, color }}
        >
          {typeIcons[type] || <Sparkles size={16} />}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{title}</span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: patientTheme.colors.textPrimary }}>{message}</p>
      {actions && actions.length > 0 && (
        <div className="flex gap-2 mt-3">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={(e) => { e.stopPropagation(); a.onClick(); }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: patientTheme.colors.surface,
                color: patientTheme.colors.primaryGreen,
                border: `1px solid ${patientTheme.colors.border}`,
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
