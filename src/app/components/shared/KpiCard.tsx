import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

export const CARD_SHADOW = "0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)";
export const CARD_SHADOW_HOVER = "0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)";

function KpiCard({ icon: Icon, label, value, delta, deltaUp, sub, color }: {
  icon: React.ElementType; label: string; value: string;
  delta: string; deltaUp: boolean; sub: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: CARD_SHADOW_HOVER }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="bg-card rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFA 100%)",
        boxShadow: CARD_SHADOW,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-start justify-between">
        <motion.div
          whileHover={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.5 }}
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            background: color + "15",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 8px ${color}25`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon size={20} style={{ color }} />
        </motion.div>
        <span className={`flex items-center gap-1 text-xs font-bold ${deltaUp ? "text-emerald-600" : "text-red-500"}`}>
          {deltaUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta}
        </span>
      </div>
      <div>
        <div className="text-2xl text-foreground tracking-tight font-bold">{value}</div>
        <div className="text-sm font-semibold text-foreground mt-0.5">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </div>
    </motion.div>
  );
}

export default KpiCard;
