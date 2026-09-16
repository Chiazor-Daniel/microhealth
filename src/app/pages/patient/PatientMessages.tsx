import React, { useState } from "react";
import { motion } from "motion/react";
import { Bell, Pill, Calendar, FlaskConical, Heart, Loader2, MessageSquareText, X } from "lucide-react";
import { messageService } from "../../services/message.service";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { success, error as showError } from "../../components/shared/SweetAlert";
import { patientTheme } from "../../patient/theme";

const ICON_MAP: Record<string, { icon: React.ElementType; cls: string }> = {
  medication: { icon: Pill, cls: "mh-icon-teal" },
  appointment: { icon: Calendar, cls: "mh-icon-blue" },
  lab: { icon: FlaskConical, cls: "mh-icon-blue" },
  health: { icon: Heart, cls: "mh-icon-rose" },
};

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PatientMessages() {
  const { notifications, loading, error, refresh } = usePatientData();
  const [dismissing, setDismissing] = useState<string | null>(null);

  const handleEnableNotifications = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  const handleDismiss = async (id: string) => {
    setDismissing(id);
    try {
      await messageService.markNotificationRead(id);
      success("Notification dismissed");
      await refresh();
    } catch (err: any) {
      showError("Failed to dismiss", err?.message);
    } finally {
      setDismissing(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <h1 className="text-[22px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
        Messages & Reminders
      </h1>

      {/* Enable push — a mint feature panel */}
      <div className="mh-mint-card p-4 flex items-start gap-3">
        <div className="mh-icon w-9 h-9 flex-shrink-0">
          <Bell size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
            Enable Push Notifications
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: patientTheme.colors.textSecondary }}>
            Get reminders for medications and appointments.
          </p>
          <button
            className="mh-btn-primary mt-3 px-4 py-2 text-[13px] font-semibold"
            onClick={handleEnableNotifications}
          >
            Enable Notifications
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="mh-card flex flex-col items-center justify-center py-12 px-6">
          <div className="mh-icon mh-icon-slate w-12 h-12">
            <MessageSquareText size={20} />
          </div>
          <p className="text-[13px] mt-3" style={{ color: patientTheme.colors.textMuted }}>
            No notifications yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => {
            const cfg = ICON_MAP[n.type || ""] || { icon: Bell, cls: "" };
            const Icon = cfg.icon;
            const isUnread = !n.isRead;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="mh-card flex items-start gap-3 p-4"
              >
                <div className={`mh-icon ${cfg.cls} w-10 h-10`}>
                  <Icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                      {n.title}
                    </p>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: patientTheme.colors.primaryGreen }} />
                    )}
                  </div>
                  <p className="text-[13px] mt-0.5 line-clamp-2" style={{ color: patientTheme.colors.textSecondary }}>
                    {n.message}
                  </p>
                </div>
                <span className="text-[11px] whitespace-nowrap mt-0.5" style={{ color: patientTheme.colors.textMuted }}>
                  {formatTime(n.createdAt)}
                </span>
                {isUnread && (
                  <button
                    onClick={() => handleDismiss(n.id)}
                    disabled={dismissing === n.id}
                    aria-label="Dismiss notification"
                    className="mh-btn-icon w-7 h-7 flex items-center justify-center flex-shrink-0"
                  >
                    {dismissing === n.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <X size={12} />}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default PatientMessages;
