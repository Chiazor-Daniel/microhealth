import { AlertTriangle } from "lucide-react";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-5 rounded-2xl flex items-start gap-3" style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.15)", boxShadow: "0 4px 20px rgba(239,68,68,0.06)" }}>
      <AlertTriangle size={18} style={{ color: "#EF4444", marginTop: 2 }} />
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "#991B1B" }}>Something went wrong</p>
        <p className="text-xs mt-0.5" style={{ color: "#B91C1C" }}>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#EF4444" }}>Retry</button>
        )}
      </div>
    </div>
  );
}
