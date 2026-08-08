import React from "react";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 animate-pulse ${className}`}
      style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--skeuo-shadow-sm)" }}
    >
      <div className="h-3 w-1/3 rounded mb-3" style={{ background: "#E5E7EB" }} />
      <div className="h-8 w-1/2 rounded mb-2" style={{ background: "#E5E7EB" }} />
      <div className="h-2 w-2/3 rounded" style={{ background: "#E5E7EB" }} />
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3 rounded" style={{ width: `${60 + Math.random() * 30}%`, background: "#E5E7EB" }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
        <div className="h-4 w-1/4 rounded" style={{ background: "#E5E7EB" }} />
      </div>
      <div className="px-4 py-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3 py-3">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="flex-1 h-3 rounded" style={{ background: "#E5E7EB" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-full animate-pulse"
      style={{ width: size, height: size, background: "#E5E7EB" }}
    />
  );
}

export function SkeletonPulse({ width, height, circle, className = "" }: { width?: string | number; height?: string | number; circle?: boolean; className?: string }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ width, height, borderRadius: circle ? "9999px" : 8, background: "#E5E7EB" }}
    />
  );
}
