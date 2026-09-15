import { type ReactNode } from "react";
import { patientTheme } from "../theme";

interface QuickActionButtonProps {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "filled" | "outline";
}

export function QuickActionButton({ icon, label, onClick, variant = "outline" }: QuickActionButtonProps) {
  const isFilled = variant === "filled";
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
      style={{
        background: isFilled ? patientTheme.colors.primaryGreen : patientTheme.colors.surface,
        color: isFilled ? "#fff" : patientTheme.colors.primaryGreen,
        border: `1px solid ${isFilled ? patientTheme.colors.primaryGreen : patientTheme.colors.border}`,
        boxShadow: patientTheme.shadows.soft,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
