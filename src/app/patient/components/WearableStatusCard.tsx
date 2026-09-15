import { Watch, Battery, RefreshCw } from "lucide-react";
import { patientTheme } from "../theme";

interface WearableStatusCardProps {
  name?: string;
  connected: boolean;
  batteryLevel?: number;
  lastSynced?: string;
  onReconnect?: () => void;
}

export function WearableStatusCard({
  name = "MicroHealth Band",
  connected,
  batteryLevel,
  lastSynced,
  onReconnect,
}: WearableStatusCardProps) {
  return (
    <div
      className="flex items-center gap-4 p-4"
      style={{
        background: patientTheme.colors.surface,
        borderRadius: patientTheme.radius.card,
        boxShadow: patientTheme.shadows.soft,
        border: `1px solid ${patientTheme.colors.border}`,
      }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{
          background: connected ? patientTheme.colors.primaryPale : "#F3F4F6",
          color: connected ? patientTheme.colors.success : patientTheme.colors.textMuted,
        }}
      >
        <Watch size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>{name}</p>
        <p className="text-xs" style={{ color: connected ? patientTheme.colors.success : patientTheme.colors.warning }}>
          {connected ? "Connected" : "Connection lost"}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {batteryLevel !== undefined && (
          <div className="flex items-center gap-1 text-xs" style={{ color: patientTheme.colors.textSecondary }}>
            <Battery size={14} /> {batteryLevel}%
          </div>
        )}
        {lastSynced && (
          <span className="text-xs" style={{ color: patientTheme.colors.textMuted }}>Synced {lastSynced}</span>
        )}
        {!connected && onReconnect && (
          <button
            onClick={onReconnect}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: patientTheme.colors.primaryGreen }}
          >
            <RefreshCw size={12} /> Reconnect
          </button>
        )}
      </div>
    </div>
  );
}
