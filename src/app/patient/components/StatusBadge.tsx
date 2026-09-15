import { patientTheme } from "../theme";

interface StatusBadgeProps {
  status: string;
}

const map: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: patientTheme.colors.primaryPale, color: patientTheme.colors.success, label: "Active" },
  confirmed: { bg: patientTheme.colors.primaryPale, color: patientTheme.colors.success, label: "Confirmed" },
  pending: { bg: "#FFFBEB", color: patientTheme.colors.warning, label: "Pending" },
  completed: { bg: "#ECFDF5", color: patientTheme.colors.success, label: "Completed" },
  cancelled: { bg: "#FEF2F2", color: patientTheme.colors.error, label: "Cancelled" },
  expired: { bg: "#FEF2F2", color: patientTheme.colors.error, label: "Expired" },
  paid: { bg: "#ECFDF5", color: patientTheme.colors.success, label: "Paid" },
  normal: { bg: patientTheme.colors.primaryPale, color: patientTheme.colors.success, label: "Normal" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = map[status] || { bg: "#F3F4F6", color: patientTheme.colors.textMuted, label: status };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color, textTransform: "capitalize" }}
    >
      {c.label}
    </span>
  );
}
