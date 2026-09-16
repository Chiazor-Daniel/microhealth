import { type ReactNode } from "react";
import { patientTheme, metricTint, vitalStatusColor } from "../theme";

export interface VitalCardProps {
  label: string;
  value: string;
  unit?: string;
  status: "normal" | "low" | "high" | "attention";
  subtext?: string;
  /** Change indicator shown as a pill, e.g. "+2 this week" */
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  /** Metric key driving the icon container's tint (heartRate, spo2, …) */
  metric?: string;
  icon?: ReactNode;
  trend?: number[];
  large?: boolean;
  onClick?: () => void;
}

/**
 * Metric card.
 * Label + dimensional icon on top, the number as the visual anchor,
 * unit muted beside it, and a soft status pill underneath.
 */
export function VitalCard({
  label,
  value,
  unit,
  status,
  subtext,
  delta,
  deltaTone = "flat",
  metric,
  icon,
  large,
  onClick,
}: VitalCardProps) {
  const tint = metricTint(metric ?? "");
  const statusTone = vitalStatusColor(status);

  return (
    <div
      onClick={onClick}
      className="mh-card"
      style={{
        padding: large ? 20 : 15,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-1.5 mb-3">
        <p
          className="text-[12.5px] font-medium leading-tight"
          style={{ color: patientTheme.colors.textSecondary, paddingTop: 3 }}
        >
          {label}
        </p>
        {icon && (
          <div className={`mh-icon ${large ? "w-11 h-11" : "w-9 h-9"}`} style={{ color: tint.fg, background: tint.tile }}>
            {icon}
          </div>
        )}
      </div>

      {/* The number is the anchor; the unit stays quiet beside it */}
      <div className="flex items-baseline gap-1">
        <span
          style={{
            fontSize: large ? 32 : 26,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: patientTheme.colors.textPrimary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[13px] font-medium" style={{ color: patientTheme.colors.textMuted }}>
            {unit}
          </span>
        )}
      </div>

      {delta ? (
        /* A delta pill reports direction within range, not a fault —
           so it stays green unless the reading itself is out of range. */
        <span
          className={`mh-pill ${status !== "normal" ? "mh-pill-amber" : ""} mt-3 px-2.5 py-1 text-[11px] font-semibold`}
          style={status === "normal" ? { color: statusTone } : undefined}
        >
          {delta}
        </span>
      ) : (
        subtext && (
          <span
            className={`mh-pill ${status !== "normal" ? "mh-pill-amber" : ""} mt-3 px-2.5 py-1 text-[11px] font-semibold`}
            style={status === "normal" ? { color: statusTone } : undefined}
          >
            {subtext}
          </span>
        )
      )}
    </div>
  );
}
