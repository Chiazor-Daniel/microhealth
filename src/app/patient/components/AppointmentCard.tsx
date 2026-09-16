import { Calendar, ChevronRight } from "lucide-react";
import { patientTheme } from "../theme";
import { StatusBadge } from "./StatusBadge";

interface AppointmentCardProps {
  department?: string;
  specialty?: string;
  doctorName?: string;
  date: string;
  time: string;
  status: string;
  onClick?: () => void;
}

export function AppointmentCard({ department, specialty, doctorName, date, time, status, onClick }: AppointmentCardProps) {
  const initials = (doctorName || department || "Dr")
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className="mh-card flex items-center gap-3 p-4"
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      <div
        className="mh-avatar w-11 h-11 flex items-center justify-center flex-shrink-0 text-sm font-semibold"
        style={{ color: patientTheme.colors.primaryDark }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
          {doctorName ? `Dr. ${doctorName}` : department}
        </p>
        <p className="text-xs truncate" style={{ color: patientTheme.colors.textSecondary }}>
          {specialty || department}
        </p>
        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: patientTheme.colors.textMuted }}>
          <Calendar size={11} /> {date} · {time}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={status} />
        {onClick && <ChevronRight size={16} style={{ color: patientTheme.colors.textMuted }} />}
      </div>
    </div>
  );
}
