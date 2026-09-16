import { Heart } from "lucide-react";
import { patientTheme } from "../theme";

interface HealthStatusCardProps {
  status: "stable" | "watch" | "attention" | "urgent";
  label: string;
  updatedAt?: string;
  onViewReport?: () => void;
}

const config = {
  stable: {
    gradient: "linear-gradient(135deg, #16A34A 0%, #15803D 60%, #14532D 100%)",
    text: "Your health looks stable",
  },
  watch: {
    gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #B45309 100%)",
    text: "Something worth watching",
  },
  attention: {
    gradient: "linear-gradient(135deg, #F97316 0%, #EA580C 60%, #C2410C 100%)",
    text: "Needs your attention",
  },
  urgent: {
    gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 60%, #B91C1C 100%)",
    text: "Please address promptly",
  },
};

export function HealthStatusCard({ status, label, updatedAt, onViewReport }: HealthStatusCardProps) {
  const c = config[status];
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: c.gradient,
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
      }}
    >
      {/* Decorative pulse rings */}
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          right: -24,
          top: -24,
          width: 130,
          height: 130,
          border: "1.5px solid rgba(255,255,255,0.18)",
        }}
      />
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          right: 12,
          bottom: -34,
          width: 90,
          height: 90,
          border: "1.5px solid rgba(255,255,255,0.14)",
        }}
      />

      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center mh-pulse"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <Heart size={16} color="#fff" fill="#fff" />
        </span>
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
          Health Status
        </span>
      </div>

      <p className="text-[22px] font-semibold leading-snug text-white" style={{ maxWidth: 240 }}>
        {c.text}
      </p>
      <p className="text-[13px] mt-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
        {label} · {updatedAt || "Updated just now"}
      </p>

      {onViewReport && (
        <button
          onClick={onViewReport}
          className="mt-4 px-4 py-2 rounded-xl text-[13px] font-semibold"
          style={{ background: "#FFFFFF", color: patientTheme.colors.primaryGreen }}
        >
          View Report
        </button>
      )}
    </div>
  );
}
