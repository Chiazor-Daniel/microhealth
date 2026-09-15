import { type ReactNode } from "react";
import { patientTheme, vitalStatusColor } from "../theme";

export interface VitalCardProps {
  label: string;
  value: string;
  unit?: string;
  status: "normal" | "low" | "high" | "attention";
  subtext: string;
  icon?: ReactNode;
  trend?: number[];
  large?: boolean;
  onClick?: () => void;
}

export function VitalCard({ label, value, unit, status, subtext, icon, large, onClick }: VitalCardProps) {
  const color = vitalStatusColor(status);
  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden"
      style={{
        background: patientTheme.colors.surface,
        borderRadius: patientTheme.radius.card,
        padding: large ? 22 : 16,
        boxShadow: patientTheme.shadows.soft,
        border: `1px solid ${patientTheme.colors.border}`,
        minHeight: large ? 180 : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: patientTheme.colors.textMuted }}>{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-bold tracking-tight"
              style={{
                fontSize: large ? 40 : 26,
                lineHeight: 1.1,
                color: patientTheme.colors.textPrimary,
              }}
            >
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium" style={{ color: patientTheme.colors.textSecondary }}>{unit}</span>
            )}
          </div>
          <p className="text-xs mt-1.5 font-medium" style={{ color: color }}>{subtext}</p>
        </div>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}12` }}
          >
            {icon}
          </div>
        )}
      </div>
      {large && (
        <div
          className="absolute bottom-0 left-0 right-0 h-16 rounded-b-3xl"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${patientTheme.colors.primaryPale}90 100%)`,
          }}
        />
      )}
    </div>
  );
}
