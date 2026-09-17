import { patientTheme, statusColor } from "../theme";
import { BrandMark } from "./BrandMark";

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

/**
 * What the agent has to say.
 *
 * This is the agent speaking in its own voice, so it carries the agent's mark
 * rather than a per-type icon — the category is already legible from the
 * words, and a grid of differently-tinted tiles made every insight look like
 * a different kind of object. The action is a full-width control.
 */
export function InsightCard({ priority, title, message, time, actions, onClick }: InsightCardProps) {
  const accent = statusColor(priority);
  const flagged = priority === "attention" || priority === "urgent";

  return (
    <div
      onClick={onClick}
      className="mh-card"
      style={{ padding: 16, cursor: onClick ? "pointer" : undefined, background: patientTheme.gradients.mint }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              color: "#FFFFFF",
              background: flagged
                ? `linear-gradient(165deg, #F87171 0%, ${patientTheme.colors.error} 100%)`
                : "linear-gradient(165deg, #29B85C 0%, #16A34A 45%, #15803D 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 10px -3px rgba(22,101,52,0.35)",
            }}
          >
            <BrandMark size={15} />
          </span>
          <p
            className="text-[14.5px] font-semibold leading-snug truncate"
            style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}
          >
            {title}
          </p>
        </div>
        {time && (
          <span className="text-[11px] whitespace-nowrap flex-shrink-0" style={{ color: patientTheme.colors.textMuted }}>
            {time}
          </span>
        )}
      </div>

      <p className="text-[13px] leading-relaxed mt-3" style={{ color: patientTheme.colors.textPrimary }}>
        {message}
      </p>

      {flagged && (
        <p className="text-[12px] font-semibold mt-2" style={{ color: accent }}>
          {priority === "urgent" ? "Needs attention now" : "Worth watching"}
        </p>
      )}

      {actions && actions.length > 0 && (
        <div className="flex gap-2.5 mt-4">
          {actions.map((a, i) => (
            <button
              key={a.label}
              onClick={(e) => { e.stopPropagation(); a.onClick(); }}
              className={`${i === 0 ? "mh-btn-primary" : "mh-btn-secondary"} flex-1 py-2.5 text-[13px] font-semibold`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
