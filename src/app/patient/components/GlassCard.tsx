import { type ReactNode, type CSSProperties } from "react";
import { patientTheme } from "../theme";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/** Base surface — device housing: lit plastic card with seam and ground shadow. */
export function GlassCard({ children, className = "", style, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`mh-card ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
