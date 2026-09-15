import { Pill } from "lucide-react";
import { patientTheme } from "../theme";
import { StatusBadge } from "./StatusBadge";

interface MedicationCardProps {
  name: string;
  dosage: string;
  duration?: string;
  status: string;
  refills?: number;
  onRefill?: () => void;
}

export function MedicationCard({ name, dosage, duration, status, refills, onRefill }: MedicationCardProps) {
  const active = status !== "expired";
  return (
    <div
      className="p-4"
      style={{
        background: patientTheme.colors.surface,
        borderRadius: patientTheme.radius.card,
        boxShadow: patientTheme.shadows.soft,
        border: `1px solid ${patientTheme.colors.border}`,
        borderLeft: active ? `3px solid ${patientTheme.colors.primaryGreen}` : `3px solid ${patientTheme.colors.error}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>{name}</p>
          <p className="text-xs mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>{dosage}</p>
          {duration && <p className="text-xs mt-0.5" style={{ color: patientTheme.colors.textMuted }}>{duration}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: patientTheme.colors.primaryPale }}>
          <Pill size={18} style={{ color: patientTheme.colors.primaryGreen }} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <StatusBadge status={status} />
        {active && (refills ?? 0) > 0 && onRefill && (
          <button
            onClick={onRefill}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{ background: patientTheme.colors.primaryGreen }}
          >
            Refill · {refills}
          </button>
        )}
      </div>
    </div>
  );
}
