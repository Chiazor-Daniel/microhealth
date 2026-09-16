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
    text: "Your health looks stable",
  },
  watch: {
    text: "Something worth watching",
  },
  attention: {
    text: "Needs your attention",
  },
  urgent: {
    text: "Please address promptly",
  },
};

/** Tint the hero by status while keeping the same green material language. */
const gradients = {
  stable: "linear-gradient(158deg, #1CAE51 0%, #16A34A 32%, #15803D 72%, #14703A 100%)",
  watch: "linear-gradient(158deg, #F5A524 0%, #F59E0B 35%, #D97706 75%, #B45309 100%)",
  attention: "linear-gradient(158deg, #FB923C 0%, #F97316 35%, #EA580C 75%, #C2410C 100%)",
  urgent: "linear-gradient(158deg, #F87171 0%, #EF4444 35%, #DC2626 75%, #B91C1C 100%)",
};

/**
 * Health status hero — the strongest element on Home.
 * Rich tonal gradient, embedded light geometry, lit top edge, soft depth.
 */
export function HealthStatusCard({ status, label, updatedAt, onViewReport }: HealthStatusCardProps) {
  const c = config[status];
  return (
    <div className="mh-green-card" style={{ background: gradients[status], padding: 20 }}>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3.5">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.20)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.42), 0 1px 3px rgba(6,60,30,0.18)",
            }}
          >
            <Heart size={15} color="#fff" fill="#fff" />
          </span>
          <span className="text-[12.5px] font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>
            Health Status
          </span>
        </div>

        <p
          className="text-white"
          style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.02em", maxWidth: 250 }}
        >
          {c.text}
        </p>
        <p className="text-[13px] mt-1.5" style={{ color: "rgba(255,255,255,0.78)" }}>
          {label} · {updatedAt || "Updated just now"}
        </p>

        {onViewReport && (
          <button
            onClick={onViewReport}
            className="mt-4 px-4 py-2 text-[13px] font-semibold"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F4FBF6 100%)",
              color: patientTheme.colors.primaryDark,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 2px 6px rgba(6,60,30,0.22)",
            }}
          >
            View Report
          </button>
        )}
      </div>
    </div>
  );
}
