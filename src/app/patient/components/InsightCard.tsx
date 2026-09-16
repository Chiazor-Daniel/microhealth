import { Sparkles, TrendingUp, Clock, AlertCircle, Heart, Activity, ChevronRight } from "lucide-react";
import { type ReactNode } from "react";
import { patientTheme, statusColor } from "../theme";

export interface InsightCardProps {
  priority: "info" | "watch" | "attention" | "urgent";
  title: string;
  message: string;
  time?: string;
  type?: "trend" | "medication" | "appointment" | "lab" | "recovery" | "wearable" | "system";
  actions?: { label: string; onClick: () => void }[];
  onClick?: () => void;
  chevron?: boolean;
}

const typeIcons: Record<string, ReactNode> = {
  trend: <TrendingUp size={18} />,
  medication: <Clock size={18} />,
  appointment: <Clock size={18} />,
  lab: <Activity size={18} />,
  recovery: <Heart size={18} />,
  wearable: <AlertCircle size={18} />,
  system: <Sparkles size={18} />,
};

export function InsightCard({ priority, title, message, time, type = "system", actions, onClick, chevron }: InsightCardProps) {
  const color = statusColor(priority);
  const softBg =
    priority === "info" ? patientTheme.colors.successSoft
    : priority === "watch" ? patientTheme.colors.warningSoft
    : priority === "attention" ? "#FFEDD5"
    : patientTheme.colors.errorSoft;

  return (
    <div
      onClick={onClick}
      style={{
        background: patientTheme.colors.surface,
        borderRadius: patientTheme.radius.card,
        border: `1px solid ${patientTheme.colors.border}`,
        boxShadow: patientTheme.shadows.soft,
        padding: 14,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: softBg, color }}
        >
          {typeIcons[type] || <Sparkles size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
              {title}
            </p>
            {time && (
              <span className="text-[11px] whitespace-nowrap" style={{ color: patientTheme.colors.textMuted }}>
                {time}
              </span>
            )}
          </div>
          <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
            {message}
          </p>
          {actions && actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {actions.map((a) => (
                <button
                  key={a.label}
                  onClick={(e) => { e.stopPropagation(); a.onClick(); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: patientTheme.colors.primaryPale,
                    color: patientTheme.colors.primaryGreen,
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {chevron && onClick && (
          <ChevronRight size={16} className="flex-shrink-0 mt-1" style={{ color: patientTheme.colors.textMuted }} />
        )}
      </div>
    </div>
  );
}
