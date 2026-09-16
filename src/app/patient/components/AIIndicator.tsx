import { Sparkles } from "lucide-react";

interface AIIndicatorProps {
  size?: number;
  active?: boolean;
}

export function AIIndicator({ size = 32, active = false }: AIIndicatorProps) {
  return (
    <div
      className={`mh-icon-green ${active ? "mh-breathe" : ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <Sparkles size={size * 0.5} />
    </div>
  );
}
