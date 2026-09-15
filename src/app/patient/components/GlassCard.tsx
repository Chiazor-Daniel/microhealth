import { type ReactNode, type CSSProperties } from "react";
import { patientTheme } from "../theme";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function GlassCard({ children, className = "", style, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: patientTheme.colors.glassSurface,
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        border: `1px solid rgba(255,255,255,0.75)`,
        borderRadius: patientTheme.radius.card,
        boxShadow: patientTheme.shadows.medium,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
