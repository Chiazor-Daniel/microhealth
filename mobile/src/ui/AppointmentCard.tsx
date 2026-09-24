import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, elevation, radii, semantic, spacing } from "@tokens";
import { linearGradient, shadow, font } from "@rn/theme";

import { CalendarIcon, ChevronRightIcon, VideoIcon } from "@/icons";
import { Avatar } from "./Avatar";
import { buttonPrimary, card, pillTone, statusText } from "./styles";

interface AppointmentCardProps {
  department?: string;
  specialty?: string;
  doctorName?: string;
  date: string;
  time: string;
  status: string;
  onClick?: () => void;
  /** Renders the full-width action the design system gives appointment cards. */
  actionLabel?: string;
  onAction?: () => void;
  /** Second row action (e.g. joining a visit) — quieter than the primary. */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

/**
 * Appointment card.
 * Who, what, and when on the top row; the action is a full-width control
 * inside the card rather than a chevron the patient has to aim at.
 */
export function AppointmentCard({
  department,
  specialty,
  doctorName,
  date,
  time,
  status,
  onClick,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: AppointmentCardProps) {
  const cancelled = status === "cancelled";
  const settled = status === "completed";

  return (
    <View style={[card, styles.wrap]}>
      <Pressable onPress={onClick} style={styles.top}>
        <Avatar seed={doctorName || department} name={doctorName || department} size={52} />
        <View style={styles.topText}>
          <Text style={styles.name} numberOfLines={1}>
            {doctorName ? `Dr. ${doctorName}` : department}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {specialty || department}
          </Text>
          <View style={styles.dateRow}>
            <CalendarIcon size={13} color={semantic.textSecondary} />
            <Text style={styles.date} numberOfLines={1}>
              {date}
              {time ? ` • ${time}` : ""}
            </Text>
          </View>
        </View>
        {/* Only states worth flagging take up space here. A cancelled visit is
            the one that gets colour; a completed one is settled, not news. */}
        {cancelled || settled ? (
          <Text style={[statusText, { color: cancelled ? pillTone.rose.fg : semantic.textMuted }]}>
            {cancelled ? "Cancelled" : "Completed"}
          </Text>
        ) : null}
      </Pressable>

      {actionLabel ? (
        <Pressable onPress={onAction ?? onClick} accessibilityRole="button" style={{ marginTop: 14 }}>
          <LinearGradient {...linearGradient("buttonPrimary")} style={[buttonPrimary, styles.action]}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      {secondaryActionLabel ? (
        <Pressable onPress={onSecondaryAction} accessibilityRole="button" style={[styles.secondary, !actionLabel ? { marginTop: 14 } : null]}>
          <VideoIcon size={15} color={semantic.accentDeep} />
          <Text style={styles.secondaryLabel}>{secondaryActionLabel}</Text>
        </Pressable>
      ) : null}

      {!actionLabel && onClick ? (
        <Pressable onPress={onClick} accessibilityRole="button" style={styles.viewDetails}>
          <Text style={styles.viewDetailsLabel}>View details</Text>
          <ChevronRightIcon size={14} color={semantic.accentDeep} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md },
  top: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  topText: { flex: 1, minWidth: 0 },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(196,224,233,0.9)",
  },
  avatarText: { fontSize: 15, ...font(600), lineHeight: 22.5, color: semantic.accentDeep },

  /* `text-[15px] font-semibold` with the card's own tighter tracking. */
  name: { fontSize: 15, ...font(600), lineHeight: 22.5, letterSpacing: -0.01 * 15, color: semantic.textPrimary },
  specialty: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textSecondary, marginTop: 2 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  date: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textSecondary, flexShrink: 1 },

  action: { alignItems: "center", paddingVertical: 10 },
  actionLabel: { fontSize: 13, ...font(600), lineHeight: 19.5, color: colors.onGreen },

  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(133,192,206,0.65)",
    backgroundColor: colors.surface,
  },
  secondaryLabel: { fontSize: 13, ...font(600), lineHeight: 19.5, color: semantic.accentDeep },

  viewDetails: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 10 },
  viewDetailsLabel: { fontSize: 12.5, ...font(600), lineHeight: 18.75, color: semantic.accentDeep },
});
