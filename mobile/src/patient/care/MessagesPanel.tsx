import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, elevation, gradients, radii, semantic, spacing } from "@tokens";
import { linearGradient, shadow, font } from "@rn/theme";
import { usePatientData } from "@app/hooks/usePatientData";
import { messageService } from "@app/services/message.service";

import { ErrorState } from "@/ui/ErrorState";
import { Loading } from "@/ui/Loading";
import { buttonPrimary, card, iconTile, iconTileBorder, mintCard } from "@/ui/styles";
import { BellIcon, CalendarIcon, CapsuleIcon, CheckIcon, ChatIcon, FlaskIcon, HeartIcon } from "@/icons";

/** Which tile a notification's type earns, in the design system's own tints. */
const ICON_MAP: Record<string, { Icon: typeof BellIcon; gradient: keyof typeof gradients; tone: string; color: string }> = {
  medication: { Icon: CapsuleIcon, gradient: "tileTeal", tone: "teal", color: colors.teal },
  appointment: { Icon: CalendarIcon, gradient: "tileBlue", tone: "blue", color: colors.blue },
  lab: { Icon: FlaskIcon, gradient: "tileBlue", tone: "blue", color: colors.blue },
  health: { Icon: HeartIcon, gradient: "tileRose", tone: "rose", color: colors.rose },
};

/** An untyped notification still reads as one, so it falls back to the bell. */
const FALLBACK = { Icon: BellIcon, gradient: "tile" as const, tone: "green", color: semantic.accentDeep };

/** The web leaves the date to `toLocaleDateString`; this is the same format. */
const DAY_MS = 1000 * 60 * 60 * 24;
const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = Math.floor((Date.now() - d.getTime()) / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return SHORT_DATE.format(d);
}

export function MessagesPanel() {
  const { notifications, loading, error, refresh } = usePatientData();
  const [dismissing, setDismissing] = useState<string | null>(null);

  const handleDismiss = async (id: string) => {
    setDismissing(id);
    try {
      await messageService.markNotificationRead(id);
      await refresh();
    } catch {
      /* The web raises a toast. There is no toast host in the native app; the
         dismissal simply does not take, and the row stays where it was. */
    } finally {
      setDismissing(null);
    }
  };

  if (loading) {
    return (
      <>
        <Loading />
      </>
    );
  }

  if (error) {
    return (
      <>
        <ErrorState message={error} onRetry={refresh} />
      </>
    );
  }

  return (
    <>

      {/* Enable push — a mint feature panel */}
      <LinearGradient {...linearGradient("mint")} style={[mintCard, styles.panel]}>
        <LinearGradient {...linearGradient("tile")} style={[iconTile, { width: 36, height: 36 }]}>
          <BellIcon size={15} color={semantic.accentDeep} />
        </LinearGradient>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.panelTitle}>Enable Push Notifications</Text>
          <Text style={styles.panelBody}>Get reminders for medications and appointments.</Text>
          {/* Web asks the browser for `Notification` permission. Native push
              needs expo-notifications, which this build does not carry yet — so
              the control is ported as it stands, with nothing to call. */}
          <Pressable accessibilityRole="button" style={styles.enable}>
            <LinearGradient {...linearGradient("buttonPrimary")} style={[buttonPrimary, styles.enableFill]}>
              <Text style={styles.enableLabel}>Enable Notifications</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>

      {notifications.length === 0 ? (
        <View style={[card, styles.empty]}>
          <LinearGradient
            {...linearGradient("tileSlate")}
            style={[iconTile, { width: 48, height: 48, borderColor: iconTileBorder.slate }]}
          >
            <ChatIcon size={20} color={semantic.textSecondary} />
          </LinearGradient>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <View style={{ marginTop: spacing.blockGap, gap: spacing.sm }}>
          {notifications.map((n) => {
            const { Icon, gradient, tone, color } = ICON_MAP[n.type || ""] || FALLBACK;
            const isUnread = !n.isRead;

            return (
              <View key={n.id} style={[card, styles.row]}>
                <LinearGradient
                  {...linearGradient(gradient)}
                  style={[iconTile, { width: 40, height: 40, borderColor: iconTileBorder[tone] }]}
                >
                  <Icon size={17} color={color} />
                </LinearGradient>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    {isUnread ? <View style={styles.dot} /> : null}
                  </View>
                  <Text style={styles.rowBody} numberOfLines={2}>
                    {n.message}
                  </Text>
                </View>

                <Text style={styles.time}>{formatTime(n.createdAt)}</Text>

                {isUnread ? (
                  <Pressable
                    onPress={() => handleDismiss(n.id)}
                    disabled={dismissing === n.id}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss notification"
                  >
                    {/* The glyph set has no close mark, and the button's job is
                        to mark the notification read — so it takes the tick the
                        set already uses for exactly that. */}
                    <LinearGradient {...linearGradient("surfaceRaise")} style={styles.dismiss}>
                      {dismissing === n.id ? (
                        <ActivityIndicator size="small" color={semantic.textSecondary} />
                      ) : (
                        <CheckIcon size={12} color={semantic.textSecondary} />
                      )}
                    </LinearGradient>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({

  panel: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, marginTop: spacing.blockGap },
  panelTitle: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.textPrimary },
  panelBody: { fontSize: 13, lineHeight: 19.5, color: semantic.textSecondary, marginTop: 2 },
  enable: { alignSelf: "flex-start", marginTop: spacing.sm },
  enableFill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  enableLabel: { fontSize: 13, ...font(600), lineHeight: 19.5, color: colors.onGreen },

  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: spacing.lg, marginTop: spacing.blockGap },
  emptyText: { fontSize: 13, lineHeight: 19.5, color: semantic.textMuted, marginTop: spacing.sm },

  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  rowTitle: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.textPrimary, flexShrink: 1 },
  /* The unread marker — the one place the primary green is used as a dot. */
  dot: { width: 8, height: 8, borderRadius: radii.pill, backgroundColor: colors.green600 },
  rowBody: { fontSize: 13, lineHeight: 19.5, color: semantic.textSecondary, marginTop: 2 },
  time: { fontSize: 11, lineHeight: 16.5, color: semantic.textMuted, marginTop: 2, flexShrink: 0 },

  /* `.mh-btn-icon` at `w-7 h-7`. */
  dismiss: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(226,236,231,0.95)",
    ...shadow(elevation.e1),
  },
});
