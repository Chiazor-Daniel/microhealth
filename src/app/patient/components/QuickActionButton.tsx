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
      className={`${isFilled ? "mh-btn-primary" : "mh-btn-secondary"} flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold`}
      style={{ color: isFilled ? "#fff" : patientTheme.colors.primaryDark }}
    >
      {icon}
      {label}
    </button>
  );
}
