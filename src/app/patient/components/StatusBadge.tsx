import { patientTheme } from "../theme";

interface StatusBadgeProps {
  status: string;
}

const map: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: patientTheme.colors.successSoft, color: patientTheme.colors.success, label: "Active" },
  confirmed: { bg: patientTheme.colors.successSoft, color: patientTheme.colors.success, label: "Confirmed" },
  connected: { bg: patientTheme.colors.successSoft, color: patientTheme.colors.success, label: "Connected" },
  pending: { bg: patientTheme.colors.warningSoft, color: "#B45309", label: "Pending" },
  completed: { bg: patientTheme.colors.successSoft, color: patientTheme.colors.success, label: "Completed" },
  cancelled: { bg: patientTheme.colors.errorSoft, color: patientTheme.colors.error, label: "Cancelled" },
  expired: { bg: patientTheme.colors.errorSoft, color: patientTheme.colors.error, label: "Expired" },
  paid: { bg: patientTheme.colors.successSoft, color: patientTheme.colors.success, label: "Paid" },
  normal: { bg: patientTheme.colors.successSoft, color: patientTheme.colors.success, label: "Normal" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = map[status] || { bg: patientTheme.colors.surfaceSecondary, color: patientTheme.colors.textSecondary, label: status };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}
