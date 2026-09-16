import { patientTheme } from "../theme";

interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Physical segmented switch: recessed track, raised thumb. */
export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <div className="mh-track flex gap-1 p-1 rounded-full" role="tablist">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 text-[13px] font-medium rounded-full transition-all ${active ? "mh-track-thumb" : ""}`}
            style={
              active
                ? { color: patientTheme.colors.textPrimary }
                : { background: "transparent", border: "1px solid transparent", color: patientTheme.colors.textSecondary }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
