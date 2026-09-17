import { patientTheme } from "../theme";
import { CalendarIcon, ChevronRightIcon } from "../icons";

interface AppointmentCardProps {
  department?: string;
  specialty?: string;
  doctorName?: string;
  date: string;
  time: string;
  status: string;
  onClick?: () => void;
  /** Renders the full-width action the design system gives appointment cards. */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Appointment card.
 * Who, what, and when on the top row; the action is a full-width control
 * inside the card rather than a chevron the patient has to aim at.
 */
export function AppointmentCard({
  department,
  specialty,
  doctorName,
  date,
  time,
  status,
  onClick,
  actionLabel,
  onAction,
}: AppointmentCardProps) {
  const initials = (doctorName || department || "Dr")
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const cancelled = status === "cancelled";
  const settled = status === "completed";

  return (
    <div className="mh-card p-4">
      <div
        onClick={onClick}
        className="flex items-start gap-3"
        style={{ cursor: onClick ? "pointer" : undefined }}
      >
        <span
          className="mh-avatar flex items-center justify-center flex-shrink-0 text-[15px] font-semibold"
          style={{ width: 52, height: 52, color: patientTheme.colors.primaryDark }}
        >
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.01em" }}>
            {doctorName ? `Dr. ${doctorName}` : department}
          </p>
          <p className="text-[12.5px] truncate mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
            {specialty || department}
          </p>
          <p className="text-[12.5px] truncate mt-1.5 flex items-center gap-1.5" style={{ color: patientTheme.colors.textSecondary }}>
            <CalendarIcon size={13} />
            {date}
            {time ? ` • ${time}` : ""}
          </p>
        </div>
        {/* Only states worth flagging take up space here. */}
        {(cancelled || settled) && (
          <span
            className="text-[12px] font-semibold flex-shrink-0"
            style={{ color: cancelled ? "#BE123C" : patientTheme.colors.textMuted }}
          >
            {cancelled ? "Cancelled" : "Completed"}
          </span>
        )}
      </div>

      {actionLabel && (
        <button
          onClick={onAction ?? onClick}
          className="mh-btn-primary w-full mt-3.5 py-2.5 text-[13px] font-semibold"
        >
          {actionLabel}
        </button>
      )}

      {!actionLabel && onClick && (
        <button
          onClick={onClick}
          className="w-full mt-2.5 flex items-center justify-end gap-1 text-[12.5px] font-semibold"
          style={{ color: patientTheme.colors.primaryDark }}
        >
          View details <ChevronRightIcon size={14} />
        </button>
      )}
    </div>
  );
}
