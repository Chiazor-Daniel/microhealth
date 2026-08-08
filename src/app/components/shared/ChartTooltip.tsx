import React from "react";

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.dataKey}: <span className="text-foreground font-medium">{typeof p.value === "number" && p.value > 1000 ? `₦${p.value.toLocaleString()}` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default ChartTooltip;
