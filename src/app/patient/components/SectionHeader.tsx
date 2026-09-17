import { type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ChevronRightIcon } from "../icons";
import { patientTheme } from "../theme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
  right?: ReactNode;
}

export function SectionHeader({ title, actionLabel, onAction, actionTo, right }: SectionHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
        {title}
      </h2>
      {right ??
        (actionLabel &&
          (actionTo || onAction) && (
            <button
              onClick={() => (actionTo ? navigate(actionTo) : onAction?.())}
              className="flex items-center gap-0.5 text-[13px] font-medium"
              style={{ color: patientTheme.colors.primaryGreen }}
            >
              {actionLabel}
              {actionTo && <ChevronRightIcon size={14} />}
            </button>
          ))}
    </div>
  );
}
