import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, elevation, radii, semantic, spacing } from "@tokens";
import { linearGradient, shadow, font } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";
import { useWearable } from "@app/patient/hooks/useWearable";

import { Screen } from "@/ui/Screen";
import { Avatar } from "@/ui/Avatar";
import { useBandConnected } from "@/lib/band";
import { buttonPrimary, buttonSecondary, card, iconTile } from "@/ui/styles";
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EmergencyIcon,
  HelpIcon,
  LogOutIcon,
  PersonIcon,
  SecurityIcon,
  WatchIcon,
  type GlyphProps,
} from "@/icons";

/** A settings row: outlined glyph, label, and the row's own affordance. */
function MenuRow({
  icon: Icon,
  label,
  sublabel,
  onClick,
  danger,
  last,
}: {
  icon: (p: GlyphProps) => React.ReactElement;
  label: string;
  sublabel?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const color = danger ? colors.error : semantic.textPrimary;
  return (
    <Pressable
      onPress={onClick}
      accessibilityRole="button"
      style={[styles.menuRow, last ? null : styles.menuDivider]}
    >
      <View style={{ flexShrink: 0 }}>
        <Icon size={21} color={danger ? colors.error : semantic.textSecondary} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
        {sublabel ? <View style={{ marginTop: 2 }}>{sublabel}</View> : null}
      </View>
      <View style={{ flexShrink: 0 }}>
        <ChevronRightIcon size={17} color={semantic.textMuted} />
      </View>
    </Pressable>
  );
}

/** Patient IDs are quoted as MH-XXXXXX; a raw uuid fragment tells nobody anything. */
function patientId(user: any) {
  const raw: string | undefined = user?.profile?.id ?? user?.id;
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  const source = digits.length >= 5 ? digits : raw.replace(/-/g, "");
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) % 1000000;
  return `MH-${String(hash).padStart(6, "0")}`;
}

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const bandConnected = useBandConnected(user?.profile?.id, false);
  const { connected, batteryLevel, lastSynced } = useWearable(user?.profile?.id, bandConnected);

  /* Web asks through the app's overlay dialog. Native has no such host, so the
     question is asked by a plain modal that mirrors its card. */
  const [confirming, setConfirming] = useState(false);

  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <Screen>
      {/* Back sits alone on the left; the identity is the header */}
      <View style={styles.backRow}>
        <Pressable
          onPress={() => router.push("/home")}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          style={styles.back}
        >
          <ChevronLeftIcon size={22} color={semantic.textPrimary} />
        </Pressable>
      </View>

      {/* Identity */}
      <View style={styles.identity}>
        <LinearGradient
          colors={["#F1FBF4", "#E1F5E8"]}
          start={{ x: 0.318, y: 0 }}
          end={{ x: 0.682, y: 1 }}
          style={[styles.avatar, shadow(elevation.e2)]}
        >
          <Avatar seed={user?.profile?.id ?? user?.email} name={fullName} size={92} />
        </LinearGradient>
        <Text style={styles.name}>{fullName || "Loading…"}</Text>
        <Text style={styles.patientId}>Patient ID: {patientId(user)}</Text>
      </View>

      {/* Everything you can reach from here, in one card.
          Personal Information, Emergency Information and Security & Privacy
          all open the family screen on the web, and do the same here. */}
      <View style={[card, styles.block, styles.cardClip]}>
        <MenuRow icon={PersonIcon} label="Personal Information" onClick={() => router.push("/family")} />
        <MenuRow
          icon={WatchIcon}
          label="Wearable & Devices"
          sublabel={
            <View style={styles.connectedRow}>
              <Text style={styles.connectedText}>{connected ? "Connected" : "Not connected"}</Text>
              <View
                style={[
                  styles.connectedDot,
                  /* A pairing indicator is a *status*, so it takes the signal
                     colour, not the brand. */
                  { backgroundColor: connected ? colors.leaf600 : semantic.textMuted },
                ]}
              />
            </View>
          }
          onClick={() => router.push("/vitals")}
        />
        <MenuRow icon={BellIcon} label="Notifications" onClick={() => router.push("/notifications")} />
        <MenuRow icon={EmergencyIcon} label="Emergency Information" onClick={() => router.push("/family")} />
        <MenuRow icon={SecurityIcon} label="Security & Privacy" onClick={() => router.push("/family")} />
        <MenuRow
          icon={HelpIcon}
          label="Help & Support"
          onClick={() => router.push("/care/messages")}
          last
        />
      </View>

      {/* The device itself, as its own quiet card */}
      <View style={[card, styles.block, styles.device]}>
        <LinearGradient {...linearGradient("tile")} style={[iconTile, styles.deviceIcon]}>
          <WatchIcon size={25} color={semantic.accentDeep} />
        </LinearGradient>
        <View style={styles.deviceText}>
          <Text style={styles.deviceLabel}>Connected Device</Text>
          <Text style={styles.deviceName}>MicroHealth Band</Text>
          <Text style={styles.deviceMeta}>
            {batteryLevel != null ? `Battery ${Math.round(batteryLevel)}%` : "Battery —"}
            {lastSynced ? ` • Synced ${lastSynced}` : ""}
          </Text>
        </View>
        <View style={{ flexShrink: 0 }}>
          <ChevronRightIcon size={17} color={semantic.textMuted} />
        </View>
      </View>

      {/* The one destructive action, deliberately on its own */}
      <View style={[card, styles.block, styles.cardClip]}>
        <MenuRow
          icon={LogOutIcon}
          label="Log Out"
          danger
          last
          onClick={() => setConfirming(true)}
        />
      </View>

      <ConfirmDialog
        visible={confirming}
        title="Sign Out?"
        text="You will be returned to the patient login page."
        confirmText="Yes, proceed"
        cancelText="Cancel"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          logout();
          router.push("/login");
        }}
      />
    </Screen>
  );
}

/**
 * The confirm card, drawn as a plain modal.
 *
 * `Modal` rather than an absolutely-positioned View because the floating nav
 * is a sibling of the screen, and only the platform's dialog surface is
 * guaranteed to sit above it.
 */
function ConfirmDialog({
  visible,
  title,
  text,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  text: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* A press that lands on the scrim dismisses; the card swallows its own. */}
      <Pressable style={styles.scrim} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <View style={styles.dialogTop}>
            <LinearGradient {...linearGradient("tile")} style={[iconTile, styles.dialogIcon]}>
              <HelpIcon size={21} color={semantic.accentDeep} />
            </LinearGradient>
            <View style={styles.dialogText}>
              <Text style={styles.dialogTitle}>{title}</Text>
              {text ? <Text style={styles.dialogBody}>{text}</Text> : null}
            </View>
          </View>

          <View style={styles.dialogActions}>
            <Pressable onPress={onCancel} accessibilityRole="button" style={[buttonSecondary, styles.dialogButton]}>
              <Text style={styles.dialogCancelLabel}>{cancelText}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} accessibilityRole="button" style={{ flex: 1 }}>
              <LinearGradient {...linearGradient("buttonPrimary")} style={[buttonPrimary, styles.dialogButton]}>
                <Text style={styles.dialogConfirmLabel}>{confirmText}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backRow: { height: 36, flexDirection: "row", alignItems: "center" },
  back: { width: 36, height: 36, marginLeft: -8, alignItems: "center", justifyContent: "center" },

  identity: { alignItems: "center" },
  /* `.mh-avatar .mh-avatar-raised` — the same mint disc as an appointment card,
     taken up to the hero size and lifted one step further to match. */
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(196,224,233,0.9)",
  },
  avatarText: { fontSize: 26, ...font(600), lineHeight: 39, color: semantic.accentDeep },
  name: {
    fontSize: 19,
    ...font(600),
    lineHeight: 28.5,
    letterSpacing: -0.02 * 19,
    color: semantic.textPrimary,
    marginTop: 14,
  },
  patientId: { fontSize: 13, lineHeight: 19.5, color: semantic.textSecondary, marginTop: 4 },

  block: { marginTop: spacing.blockGap },
  cardClip: { overflow: "hidden" },

  menuRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: spacing.md, paddingVertical: 14 },
  menuDivider: { borderTopWidth: 1, borderTopColor: colors.hairlineSoft },
  menuText: { flex: 1, minWidth: 0 },
  menuLabel: { fontSize: 14, ...font(500), lineHeight: 21 },

  connectedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  connectedText: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textSecondary },
  connectedDot: { width: 6, height: 6, borderRadius: 999 },

  device: { flexDirection: "row", alignItems: "center", gap: 14, padding: spacing.md },
  deviceIcon: { width: 52, height: 52 },
  deviceText: { flex: 1, minWidth: 0 },
  deviceLabel: { fontSize: 12, lineHeight: 18, color: semantic.textSecondary },
  deviceName: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary, marginTop: 2 },
  deviceMeta: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textSecondary, marginTop: 2 },

  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.blockGap,
    backgroundColor: colors.scrim,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.blockGap,
    backgroundColor: colors.surface,
    borderRadius: radii.feature,
    borderWidth: 1,
    borderColor: "rgba(226,236,231,0.9)",
    ...shadow(elevation.e3),
  },
  dialogTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  dialogIcon: { width: 44, height: 44 },
  dialogText: { flex: 1, minWidth: 0, paddingTop: 2 },
  dialogTitle: {
    fontSize: 16,
    ...font(600),
    lineHeight: 22,
    letterSpacing: -0.01 * 16,
    color: semantic.textPrimary,
  },
  dialogBody: { fontSize: 13, lineHeight: 21, color: semantic.textSecondary, marginTop: 6 },
  dialogActions: { flexDirection: "row", gap: 10, marginTop: spacing.blockGap },
  dialogButton: { flex: 1, alignItems: "center", paddingVertical: 10 },
  dialogCancelLabel: { fontSize: 13.5, ...font(600), lineHeight: 20.25, color: semantic.accentDeep },
  dialogConfirmLabel: { fontSize: 13.5, ...font(600), lineHeight: 20.25, color: colors.onGreen },
});
