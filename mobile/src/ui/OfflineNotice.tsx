import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, semantic, spacing } from "@tokens";
import { font } from "@rn/theme";
import { WifiOffIcon, RefreshIcon } from "@/icons";

/**
 * Connection states that are not errors.
 *
 * A dead connection is the common case on wards with bad reception, so it
 * gets its own soft slate panel — never the red ErrorState. Red means
 * "something broke"; slate means "nothing can load right now". The retry
 * button belongs to the panel, not to a separate red box.
 */

/** Full-panel: nothing could load and the phone is offline. */
export function OfflinePanel({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.panel}>
      <View style={styles.iconWrap}>
        <WifiOffIcon size={20} color={semantic.textSecondary} />
      </View>
      <Text style={styles.title}>You're offline</Text>
      <Text style={styles.body}>Check your connection — your saved data is still here, and everything will refresh when you're back.</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" style={styles.retry}>
          <RefreshIcon size={13} color={colors.onGreen} />
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Inline strip: stale data on screen, refresh failed behind it. */
export function StaleStrip({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.strip}>
      <WifiOffIcon size={13} color={semantic.textSecondary} />
      <Text style={styles.stripText}>Couldn't refresh — showing saved data.</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.stripRetry}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
    backgroundColor: "#F4F7F9",
    borderWidth: 1,
    borderColor: "rgba(203,213,225,0.7)",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(203,213,225,0.9)",
    marginBottom: spacing.xs,
  },
  title: { fontSize: 15, ...font(600), lineHeight: 22, color: semantic.textPrimary },
  body: { fontSize: 13, lineHeight: 20, color: semantic.textSecondary, textAlign: "center", marginTop: 4 },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.green600,
  },
  retryLabel: { fontSize: 13, ...font(600), lineHeight: 18, color: colors.onGreen },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.control,
    backgroundColor: "#F4F7F9",
    borderWidth: 1,
    borderColor: "rgba(203,213,225,0.6)",
    marginBottom: spacing.sm,
  },
  stripText: { flex: 1, fontSize: 12, lineHeight: 16, color: semantic.textSecondary },
  stripRetry: { fontSize: 12, ...font(600), lineHeight: 16, color: semantic.accentDeep },
});
