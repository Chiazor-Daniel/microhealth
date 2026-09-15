import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Calendar, Pill, FlaskConical, MessageSquare, Users, ChevronRight, Plus } from "lucide-react";
import { patientTheme } from "../theme";

const careItems = [
  { path: "/patient/care/appointments", icon: Calendar, label: "Appointments", sub: "Upcoming visits & history", color: patientTheme.colors.primaryGreen },
  { path: "/patient/care/prescriptions", icon: Pill, label: "Prescriptions", sub: "Medications & refills", color: patientTheme.colors.primaryGreen },
  { path: "/patient/care/labs", icon: FlaskConical, label: "Lab results", sub: "Tests & reports", color: patientTheme.colors.info },
  { path: "/patient/care/messages", icon: MessageSquare, label: "Messages", sub: "Care team chat", color: patientTheme.colors.warning },
  { path: "/patient/family", icon: Users, label: "Family members", sub: "Manage dependents", color: patientTheme.colors.aiAccent },
];

export default function Care() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: patientTheme.colors.textPrimary }}>Care</h1>
        <button
          onClick={() => navigate("/patient/book")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: patientTheme.colors.primaryGreen }}
        >
          <Plus size={14} /> Book visit
        </button>
      </div>

      <div className="space-y-3">
        {careItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                background: patientTheme.colors.surface,
                border: `1px solid ${patientTheme.colors.border}`,
                boxShadow: patientTheme.shadows.soft,
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}12` }}
              >
                <Icon size={20} style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: patientTheme.colors.textMuted }}>{item.sub}</p>
              </div>
              <ChevronRight size={18} style={{ color: patientTheme.colors.textMuted }} />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
