import { patientTheme } from "../theme";

interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <div
      className="flex p-1 rounded-full"
      style={{ background: patientTheme.colors.surfaceSecondary }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 py-2 text-[13px] font-medium rounded-full transition-all"
            style={{
              background: active ? patientTheme.colors.surface : "transparent",
              color: active ? patientTheme.colors.textPrimary : patientTheme.colors.textSecondary,
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
