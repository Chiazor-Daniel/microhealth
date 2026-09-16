import { FlaskConical, ChevronDown } from "lucide-react";
import { useState } from "react";
import { patientTheme } from "../theme";
import { StatusBadge } from "./StatusBadge";

interface LabResultCardProps {
  testName: string;
  date: string;
  status: string;
  result?: string;
  notes?: string;
}

export function LabResultCard({ testName, date, status, result, notes }: LabResultCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="overflow-hidden"
      style={{
        background: patientTheme.colors.surface,
        borderRadius: patientTheme.radius.card,
        boxShadow: patientTheme.shadows.soft,
        border: `1px solid ${patientTheme.colors.border}`,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>{testName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: patientTheme.colors.textMuted }}>{date}</span>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: patientTheme.colors.surfaceSecondary }}>
          <ChevronDown size={16} style={{ color: patientTheme.colors.textMuted, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <div
            className="p-3 rounded-xl"
            style={{ background: patientTheme.colors.surfaceSecondary, border: `1px solid ${patientTheme.colors.borderLight}` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: patientTheme.colors.textMuted }}>Result</p>
            <p className="text-sm mt-1" style={{ color: patientTheme.colors.textPrimary }}>{result || "—"}</p>
          </div>
          {notes && <div
            className="p-3 rounded-xl"
            style={{ background: patientTheme.colors.surfaceSecondary, border: `1px solid ${patientTheme.colors.borderLight}` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: patientTheme.colors.textMuted }}>Clinician note</p>
            <p className="text-sm mt-1" style={{ color: patientTheme.colors.textPrimary }}>{notes}</p>
          </div>}
        </div>
      )}
    </div>
  );
}
