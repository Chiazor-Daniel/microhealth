import { patientTheme } from "../theme";

interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Segmented switch: recessed track, solid green capsule for the active tab.
 * The green fill — not a raised white thumb — is what marks selection, so the
 * eye reads it at a glance the way the design system specifies.
 */
export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  return (
    /* The strip fits its labels rather than truncating them: `min-w-fit` stops
       a tab shrinking below its word, so a long set ("Appointments,
       Prescriptions, Labs, Messages") scrolls instead of becoming "Appoint…".
       Short sets still stretch to fill the width. */
    <div className="mh-track flex gap-1 p-1 rounded-full overflow-x-auto" role="tablist">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 min-w-fit px-2.5 py-2 text-[11.5px] rounded-full transition-colors whitespace-nowrap ${
              active ? "mh-tab-active" : ""
            }`}
            style={
              active
                ? undefined
                : {
                    background: "transparent",
                    border: "1px solid transparent",
                    color: patientTheme.colors.textSecondary,
                    fontWeight: 500,
                  }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
