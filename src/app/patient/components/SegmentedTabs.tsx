import { patientTheme } from "../theme";

interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <div
      className="flex p-1 rounded-2xl"
      style={{ background: "rgba(16,24,40,0.05)" }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
            style={{
              background: active ? patientTheme.colors.surface : "transparent",
              color: active ? patientTheme.colors.primaryGreen : patientTheme.colors.textMuted,
              boxShadow: active ? patientTheme.shadows.soft : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
