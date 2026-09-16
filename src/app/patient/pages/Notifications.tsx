import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft, Sparkles, TrendingUp, Clock, Activity, Heart, AlertCircle, CheckCheck } from "lucide-react";
import { type ReactNode } from "react";
import { useInsights } from "../hooks/useInsights";
import { patientTheme } from "../theme";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";

const typeIcons: Record<string, ReactNode> = {
  trend: <TrendingUp size={18} />,
  medication: <Clock size={18} />,
  appointment: <Clock size={18} />,
  lab: <Activity size={18} />,
  recovery: <Heart size={18} />,
  wearable: <AlertCircle size={18} />,
  system: <Sparkles size={18} />,
};

function timeLabel(iso?: string) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 2) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}:${String(new Date(iso).getMinutes()).padStart(2, "0")} AM`.replace(/^24/, "12");
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Notifications() {
  const navigate = useNavigate();
  const { insights, loading, error, markRead } = useInsights();

  const today = insights.filter(
    (i) => Date.now() - new Date(i.createdAt).getTime() < 24 * 60 * 60 * 1000
  );
  const earlier = insights.filter(
    (i) => Date.now() - new Date(i.createdAt).getTime() >= 24 * 60 * 60 * 1000
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const rows = (list: typeof insights) => (
    <div className="space-y-3">
      {list.map((n) => {
        const unread = !n.isRead;
        const icon = typeIcons[n.type as string] ?? <Sparkles size={18} />;
        return (
          <div
            key={n.id}
            onClick={() => { if (unread) markRead(n.id); }}
            className="flex items-start gap-3 p-4"
            style={{
              background: patientTheme.colors.surface,
              borderRadius: patientTheme.radius.card,
              border: `1px solid ${patientTheme.colors.border}`,
              boxShadow: patientTheme.shadows.soft,
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: patientTheme.colors.primaryPale, color: patientTheme.colors.primaryGreen }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                  {n.title}
                </p>
                {unread && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: patientTheme.colors.primaryGreen }} />}
              </div>
              <p className="text-[13px] leading-snug mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
                {n.message}
              </p>
            </div>
            <span className="text-[11px] whitespace-nowrap mt-0.5" style={{ color: patientTheme.colors.textMuted }}>
              {timeLabel(n.createdAt)}
            </span>
          </div>
        );
      })}
      {list.length === 0 && (
        <p className="text-[13px] py-6 text-center" style={{ color: patientTheme.colors.textMuted }}>
          Nothing here yet.
        </p>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/patient/home")}
          aria-label="Back"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: patientTheme.colors.surface, border: `1px solid ${patientTheme.colors.border}`, color: patientTheme.colors.textPrimary }}
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-base font-semibold" style={{ color: patientTheme.colors.textPrimary }}>Notifications</p>
        <button
          onClick={() => insights.forEach((n) => !n.isRead && markRead(n.id))}
          className="flex items-center gap-1 text-[13px] font-medium"
          style={{ color: patientTheme.colors.primaryGreen }}
        >
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>

      {/* Today */}
      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>Today</p>
        {rows(today)}
      </section>

      {/* Earlier */}
      {earlier.length > 0 && (
        <section>
          <p className="text-sm font-semibold mb-3" style={{ color: patientTheme.colors.textPrimary }}>Earlier</p>
          {rows(earlier)}
        </section>
      )}
    </motion.div>
  );
}
