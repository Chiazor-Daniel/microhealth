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
  trend: <TrendingUp size={17} />,
  medication: <Clock size={17} />,
  appointment: <Clock size={17} />,
  lab: <Activity size={17} />,
  recovery: <Heart size={17} />,
  wearable: <AlertCircle size={17} />,
  system: <Sparkles size={17} />,
};

/** Tint for the dimensional icon container, by insight type. */
function tileFor(type: string, priority: string) {
  if (priority === "urgent") return "mh-icon-rose";
  if (priority === "watch" || priority === "attention") return "mh-icon-amber";
  switch (type) {
    case "lab":
      return "mh-icon-blue";
    case "recovery":
      return "mh-icon-rose";
    case "medication":
      return "mh-icon-teal";
    default:
      return "";
  }
}

/**
 * Medical intelligence card — an elevated white surface with a
 * dimensional icon container. Not a chat bubble.
 */
export function InsightCard({ priority, title, message, time, type = "system", actions, onClick, chevron }: InsightCardProps) {
  const color = statusColor(priority);

  return (
    <div
      onClick={onClick}
      className="mh-card"
      style={{ padding: 16, cursor: onClick ? "pointer" : undefined }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mh-icon ${tileFor(type, priority)}`}
          style={{ width: 40, height: 40, color: priority === "info" ? patientTheme.colors.primaryDark : undefined }}
        >
          {typeIcons[type] || <Sparkles size={17} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p
              className="text-[14.5px] font-semibold leading-snug"
              style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}
            >
              {title}
            </p>
            {time && (
              <span className="text-[11px] whitespace-nowrap mt-0.5" style={{ color: patientTheme.colors.textMuted }}>
                {time}
              </span>
            )}
          </div>

          <p className="text-[13px] leading-relaxed mt-1" style={{ color: patientTheme.colors.textSecondary }}>
            {message}
          </p>

          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((a) => (
                <button
                  key={a.label}
                  onClick={(e) => { e.stopPropagation(); a.onClick(); }}
                  className="mh-btn-secondary px-3.5 py-1.5 text-[12.5px] font-semibold"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {chevron && onClick && !actions?.length && (
          <ChevronRight size={16} className="flex-shrink-0 mt-1.5" style={{ color: patientTheme.colors.textMuted }} />
        )}
      </div>
    </div>
  );
}
