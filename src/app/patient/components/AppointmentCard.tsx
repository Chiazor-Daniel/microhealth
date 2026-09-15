import { Calendar, Clock } from "lucide-react";
import { patientTheme } from "../theme";
import { StatusBadge } from "./StatusBadge";

interface AppointmentCardProps {
  department: string;
  doctorName?: string;
  date: string;
  time: string;
  status: string;
  onClick?: () => void;
}

export function AppointmentCard({ department, doctorName, date, time, status, onClick }: AppointmentCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-4"
      style={{
        background: patientTheme.colors.surface,
        borderRadius: patientTheme.radius.card,
        boxShadow: patientTheme.shadows.soft,
        border: `1px solid ${patientTheme.colors.border}`,
        borderLeft: `3px solid ${patientTheme.colors.primaryGreen}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>{department}</p>
        <StatusBadge status={status} />
      </div>
      {doctorName && <p className="text-xs mb-2" style={{ color: patientTheme.colors.textSecondary }}>Dr. {doctorName}</p>}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
          style={{ background: patientTheme.colors.primaryPale, color: patientTheme.colors.primaryGreen }}
        >
          <Calendar size={12} /> {date}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
          style={{ background: "rgba(16,24,40,0.05)", color: patientTheme.colors.textSecondary }}
        >
          <Clock size={12} /> {time}
        </span>
      </div>
    </div>
  );
}
