import { type ReactNode } from "react";
import { patientTheme, vitalStatusColor } from "../theme";

export interface VitalCardProps {
  label: string;
  value: string;
  unit?: string;
  status: "normal" | "low" | "high" | "attention";
  subtext?: string;
  /** Change indicator shown as a pill, e.g. "+2 this week" */
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  icon?: ReactNode;
  trend?: number[];
  large?: boolean;
  onClick?: () => void;
}

export function VitalCard({
  label,
  value,
  unit,
  status,
  subtext,
  delta,
  deltaTone = "flat",
  icon,
  large,
  onClick,
}: VitalCardProps) {
  const color = vitalStatusColor(status);
  const deltaColor =
    deltaTone === "up" ? patientTheme.colors.success : deltaTone === "down" ? patientTheme.colors.error : patientTheme.colors.textSecondary;
  const deltaBg =
    deltaTone === "up" ? patientTheme.colors.successSoft : deltaTone === "down" ? patientTheme.colors.errorSoft : patientTheme.colors.surfaceSecondary;

  return (
    <div
      onClick={onClick}
      style={{
        background: patientTheme.colors.surface,
        borderRadius: patientTheme.radius.card,
        padding: large ? 20 : 16,
        boxShadow: patientTheme.shadows.soft,
        border: `1px solid ${patientTheme.colors.border}`,
        minHeight: large ? 170 : undefined,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>{label}</p>
        {icon && (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: patientTheme.colors.primaryPale, color: patientTheme.colors.primaryGreen }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="font-bold tracking-tight"
          style={{
            fontSize: large ? 32 : 24,
            lineHeight: 1.1,
            color: patientTheme.colors.textPrimary,
          }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[13px] font-medium" style={{ color: patientTheme.colors.textSecondary }}>{unit}</span>
        )}
      </div>
      {delta ? (
        <span
          className="inline-flex items-center mt-2.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: deltaBg, color: deltaColor }}
        >
          {delta}
        </span>
      ) : (
        subtext && (
          <p className="text-xs mt-2 font-medium" style={{ color }}>{subtext}</p>
        )
      )}
    </div>
  );
}
