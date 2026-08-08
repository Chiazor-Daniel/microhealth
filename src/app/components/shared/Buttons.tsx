import React from "react";
import { motion } from "motion/react";

const PRIMARY_SHADOW = "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)";
const GHOST_SHADOW = "0 4px 10px -2px rgba(15,125,122,0.12), inset 0 1px 0 rgba(255,255,255,0.6)";
const DANGER_SHADOW = "0 6px 12px -2px rgba(239,68,68,0.25), inset 0 1px 0 rgba(255,255,255,0.2)";

function PrimaryBtn({ children, onClick, icon: Icon, small, disabled, type = "button" }: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ElementType;
  small?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ translateY: -2, boxShadow: "0 10px 20px -4px rgba(15,125,122,0.4), inset 0 1px 0 rgba(255,255,255,0.25)" }}
      whileTap={{ scale: 0.97, translateY: 0 }}
      className={`flex items-center justify-center gap-2 font-semibold text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed ${small ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
      style={{
        background: "linear-gradient(145deg, #0F7D7A 0%, #0A5E5C 50%, #085352 100%)",
        boxShadow: PRIMARY_SHADOW,
        border: "1px solid rgba(6,64,63,0.4)",
        textShadow: "0 1px 1px rgba(0,0,0,0.15)",
      }}
    >
      {Icon && <Icon size={small ? 13 : 15} />}
      {children}
    </motion.button>
  );
}

function GhostBtn({ children, onClick, icon: Icon, disabled, type = "button" }: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ElementType;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ translateY: -1, boxShadow: "0 6px 14px -3px rgba(15,125,122,0.18), inset 0 1px 0 rgba(255,255,255,0.7)" }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
      style={{
        color: "#0F7D7A",
        background: "linear-gradient(180deg, #FFFFFF 0%, #F0FAFA 100%)",
        border: "1px solid rgba(15,125,122,0.25)",
        boxShadow: GHOST_SHADOW,
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </motion.button>
  );
}

function DangerBtn({ children, onClick, icon: Icon, small, disabled }: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ElementType;
  small?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ translateY: -2, boxShadow: "0 10px 20px -4px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.25)" }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-2 font-semibold text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed ${small ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
      style={{
        background: "linear-gradient(145deg, #EF4444 0%, #DC2626 100%)",
        boxShadow: DANGER_SHADOW,
        border: "1px solid rgba(153,27,27,0.4)",
        textShadow: "0 1px 1px rgba(0,0,0,0.15)",
      }}
    >
      {Icon && <Icon size={small ? 13 : 15} />}
      {children}
    </motion.button>
  );
}

export { PrimaryBtn, GhostBtn, DangerBtn };
