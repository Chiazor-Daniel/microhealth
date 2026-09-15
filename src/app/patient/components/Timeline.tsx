import { patientTheme } from "../theme";

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  value?: string;
  type: "vital" | "medication" | "agent" | "appointment" | "lab" | "system";
}

interface TimelineProps {
  events: TimelineEvent[];
}

const typeDot: Record<TimelineEvent["type"], string> = {
  vital: patientTheme.colors.success,
  medication: patientTheme.colors.info,
  agent: patientTheme.colors.aiAccent,
  appointment: patientTheme.colors.warning,
  lab: patientTheme.colors.info,
  system: patientTheme.colors.textMuted,
};

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) return null;
  return (
    <div className="space-y-0">
      {events.map((e, i) => (
        <div key={e.id} className="flex gap-3 relative">
          {i !== events.length - 1 && (
            <div
              className="absolute left-[11px] top-6 bottom-0 w-px"
              style={{ background: patientTheme.colors.border }}
            />
          )}
          <div className="flex flex-col items-center pt-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: typeDot[e.type], boxShadow: `0 0 0 4px ${typeDot[e.type]}15` }}
            />
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>{e.title}</p>
              <span className="text-xs font-medium" style={{ color: patientTheme.colors.textMuted }}>{e.time}</span>
            </div>
            {e.value && <p className="text-sm mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>{e.value}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
