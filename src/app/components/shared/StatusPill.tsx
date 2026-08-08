function StatusPill({ status }: { status?: string }) {
  const m: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
    confirmed:    { label: "Confirmed",    bg: "#ECFDF5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    "in-progress":{ label: "In Progress", bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", border: "#BFDBFE" },
    critical:     { label: "Critical",    bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", border: "#FECACA" },
    pending:      { label: "Pending",     bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B", border: "#FDE68A" },
    active:       { label: "Active",      bg: "#ECFDF5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    discharged:   { label: "Discharged",  bg: "#F3F4F6", text: "#4B5563", dot: "#9CA3AF", border: "#E5E7EB" },
    observation:  { label: "Observation", bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", border: "#BFDBFE" },
    completed:    { label: "Completed",   bg: "#ECFDF5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    "in-review":  { label: "In Review",   bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", border: "#BFDBFE" },
    "on-duty":    { label: "On Duty",     bg: "#ECFDF5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    "off-duty":   { label: "Off Duty",    bg: "#F3F4F6", text: "#4B5563", dot: "#9CA3AF", border: "#E5E7EB" },
    dispensed:    { label: "Dispensed",   bg: "#ECFDF5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    expired:      { label: "Expired",     bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", border: "#FECACA" },
    paid:         { label: "Paid",        bg: "#ECFDF5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    failed:       { label: "Failed",      bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", border: "#FECACA" },
    low:          { label: "Low Stock",   bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B", border: "#FDE68A" },
    ok:           { label: "In Stock",    bg: "#ECFDF5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    abnormal:     { label: "Abnormal",    bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B", border: "#FDE68A" },
    normal:       { label: "Normal",      bg: "#ECFDF5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
    cancelled:    { label: "Cancelled",   bg: "#F3F4F6", text: "#4B5563", dot: "#9CA3AF", border: "#E5E7EB" },
  };
  const s = m[(status || "").toLowerCase()] ?? m.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot, boxShadow: `0 0 4px ${s.dot}` }} />
      {s.label}
    </span>
  );
}

export default StatusPill;
