import { motion } from "motion/react";

export const CARD_SHADOW = "0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)";
export const CARD_SHADOW_HOVER = "0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)";

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-muted rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

function TableCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFA 100%)",
        boxShadow: CARD_SHADOW,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </motion.div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3.5 text-sm ${className}`}>{children}</td>;
}

function TrHover({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-all"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#F0FAFA")}
      onMouseLeave={e => (e.currentTarget.style.background = "")}
    >
      {children}
    </tr>
  );
}

function InitialsAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const s = size === "sm" ? "w-8 h-8 text-[10px]" : size === "lg" ? "w-12 h-12 text-sm" : "w-9 h-9 text-xs";
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{
        background: "linear-gradient(145deg, #E6F7F6, #B2E8E6)",
        color: "#0A5E5C",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 4px rgba(15,125,122,0.15)",
        border: "1px solid rgba(15,125,122,0.15)",
      }}
    >
      {initials}
    </div>
  );
}

export { SkeletonRow, TableCard, Th, Td, TrHover, InitialsAvatar };
