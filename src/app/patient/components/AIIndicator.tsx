import { Sparkles } from "lucide-react";
import { patientTheme } from "../theme";

interface AIIndicatorProps {
  size?: number;
  active?: boolean;
}

export function AIIndicator({ size = 32, active = false }: AIIndicatorProps) {
  return (
    <div
      className={active ? "mh-breathe" : ""}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: `linear-gradient(135deg, ${patientTheme.colors.aiAccent}, ${patientTheme.colors.primaryGreen})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        boxShadow: active ? `0 0 20px ${patientTheme.colors.aiAccent}50` : patientTheme.shadows.soft,
      }}
    >
      <Sparkles size={size * 0.5} />
    </div>
  );
}
