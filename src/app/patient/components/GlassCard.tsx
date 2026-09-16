import { type ReactNode, type CSSProperties } from "react";
import { patientTheme } from "../theme";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/** Base surface card — flat white, 16px radius, hairline border, soft shadow (mockup spec). */
export function GlassCard({ children, className = "", style, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: patientTheme.colors.surface,
        border: `1px solid ${patientTheme.colors.border}`,
        borderRadius: patientTheme.radius.card,
        boxShadow: patientTheme.shadows.soft,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
