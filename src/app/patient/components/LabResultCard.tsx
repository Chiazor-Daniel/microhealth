import { useState } from "react";
import { patientTheme } from "../theme";
import { CalendarIcon, ChevronRightIcon } from "../icons";

interface LabResultCardProps {
  testName: string;
  date: string;
  status: string;
  result?: string;
  notes?: string;
}

/**
 * Lab row.
 * Collapsed it reads as a normal list row — what, when, and whether anything
 * needs attention. Opening it reveals the result without leaving the page.
 */
export function LabResultCard({ testName, date, status, result, notes }: LabResultCardProps) {
  const [open, setOpen] = useState(false);
  const normal = status === "completed" || status === "normal";

  return (
    <div className="mh-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        <span
          className="mh-icon flex items-center justify-center flex-shrink-0"
          style={{ width: 40, height: 40, color: patientTheme.colors.primaryDark, background: patientTheme.gradients.tile }}
        >
          <CalendarIcon size={19} />
        </span>

        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
            {testName}
          </span>
          <span className="block text-[12.5px] truncate mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
            {date}
            {date && " • "}
            <span style={{ color: normal ? patientTheme.colors.primaryDark : patientTheme.colors.amber }}>
              {normal ? "Normal" : status === "pending" ? "Pending" : status}
            </span>
          </span>
        </span>

        <span
          className="flex-shrink-0"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
        >
          <ChevronRightIcon size={16} />
        </span>
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 space-y-2">
          <div
            className="p-3 rounded-2xl"
            style={{ background: patientTheme.colors.surfaceSecondary, border: `1px solid ${patientTheme.colors.hairline}` }}
          >
            <p className="text-[11px] font-semibold uppercase" style={{ color: patientTheme.colors.textMuted, letterSpacing: "0.04em" }}>
              Result
            </p>
            <p className="text-[13px] mt-1" style={{ color: patientTheme.colors.textPrimary }}>{result || "—"}</p>
          </div>
          {notes && (
            <div
              className="p-3 rounded-2xl"
              style={{ background: patientTheme.colors.surfaceSecondary, border: `1px solid ${patientTheme.colors.hairline}` }}
            >
              <p className="text-[11px] font-semibold uppercase" style={{ color: patientTheme.colors.textMuted, letterSpacing: "0.04em" }}>
                Clinician note
              </p>
              <p className="text-[13px] mt-1" style={{ color: patientTheme.colors.textPrimary }}>{notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
