import { patientTheme } from "../theme";
import { CapsuleIcon, ChevronRightIcon } from "../icons";

interface MedicationCardProps {
  name: string;
  dosage: string;
  duration?: string;
  status: string;
  refills?: number;
  onRefill?: () => void;
  onClick?: () => void;
}

/**
 * Prescription row.
 * A medicine is a row in a list, not a hero: the capsule leads, the schedule
 * reads as one line, and the only action offered is the one that matters.
 */
export function MedicationCard({ name, dosage, duration, status, refills, onRefill, onClick }: MedicationCardProps) {
  const expired = status === "expired";
  const schedule = [dosage, duration].filter(Boolean).join(" • ");
  const canRefill = !expired && (refills ?? 0) > 0 && !!onRefill;

  return (
    <div
      onClick={onClick}
      className="mh-card flex items-center gap-3 p-3.5"
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      <span
        className="mh-icon flex items-center justify-center flex-shrink-0"
        style={{
          width: 40,
          height: 40,
          color: expired ? patientTheme.colors.textSecondary : patientTheme.colors.primaryDark,
          background: expired
            ? "linear-gradient(160deg, #FAFCFD 0%, #E9EFF4 100%)"
            : "linear-gradient(160deg, #F4FCF6 0%, #DCF2E5 100%)",
        }}
      >
        <CapsuleIcon size={19} />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
          {name}
        </p>
        <p className="text-[12.5px] truncate mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
          {schedule || "—"}
        </p>
      </div>

      {expired ? (
        <span className="text-[12px] font-semibold flex-shrink-0" style={{ color: patientTheme.colors.rose }}>
          Expired
        </span>
      ) : canRefill ? (
        <button
          onClick={(e) => { e.stopPropagation(); onRefill?.(); }}
          className="mh-btn-secondary px-3 py-1.5 text-[12px] font-semibold flex-shrink-0"
        >
          Refill · {refills}
        </button>
      ) : onClick ? (
        <ChevronRightIcon size={16} />
      ) : null}
    </div>
  );
}
