import React, { useState } from "react";
import { motion } from "motion/react";
import { Bell, Pill, Calendar, FlaskConical, Heart, Loader2, MessageSquareText, X } from "lucide-react";
import { messageService } from "../../services/message.service";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { success, error as showError } from "../../components/shared/SweetAlert";

interface Notification {
  id: string;
  title: string;
  message: string;
  type?: string;
  createdAt?: string;
  isRead?: boolean;
}

const ICON_MAP: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  medication: { icon: Pill, color: "#0F7D7A", bg: "#E6F7F6" },
  appointment: { icon: Calendar, color: "#3B82F6", bg: "#EFF6FF" },
  lab: { icon: FlaskConical, color: "#10B981", bg: "#ECFDF5" },
  health: { icon: Heart, color: "#F59E0B", bg: "#FFFBEB" },
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-base font-bold text-foreground">Messages & Reminders</h2>

      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "#E6F7F6", border: "1px solid rgba(15,125,122,0.15)", boxShadow: "var(--skeuo-shadow)" }}
      >
        <Bell size={16} style={{ color: "#0F7D7A", marginTop: 2 }} />
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "#0A5E5C" }}>Enable Push Notifications</p>
          <p className="text-xs mt-0.5" style={{ color: "#36A09D" }}>Get reminders for medications and appointments.</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
            style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 3px 8px rgba(15,125,122,0.3)" }}
            onClick={handleEnableNotifications}
          >
            Enable
          </motion.button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <MessageSquareText size={36} className="mb-3 opacity-40" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const iconConfig = ICON_MAP[n.type || ""] || { icon: Bell, color: "#0F7D7A", bg: "#E6F7F6" };
            const isUnread = !n.isRead;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-2xl transition-all"
                style={{
                  background: isUnread ? "#F8FFFF" : "var(--skeuo-card-gradient)",
                  border: isUnread ? "1px solid rgba(15,125,122,0.12)" : "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "var(--skeuo-shadow-sm)",
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconConfig.bg }}>
                  <iconConfig.icon size={15} style={{ color: iconConfig.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{n.title}</p>
                    <span className="text-[10px] font-bold text-muted-foreground flex-shrink-0">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                {isUnread && (
                  <button
                    onClick={() => handleDismiss(n.id)}
                    disabled={dismissing === n.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#E6F7F6" }}
                  >
                    {dismissing === n.id ? <Loader2 size={12} className="animate-spin" style={{ color: "#0F7D7A" }} /> : <X size={12} style={{ color: "#0F7D7A" }} />}
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
