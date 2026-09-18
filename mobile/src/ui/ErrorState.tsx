import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, semantic, spacing } from "@tokens";
import { font } from "@rn/theme";

import { AlertIcon } from "@/icons";

/**
 * What a screen shows when its data call failed.
 *
 * The panel is a fixed red — it is the one surface in the app that is not part
 * of the mint language, deliberately, so a failure cannot be mistaken for a
 * normal card. Only `colors.error` is on the token ramp; the three deeper reds
 * are the web build's own and are written literally.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      {/* The glyph sits a touch below the title's cap line, as it does on web. */}
      <View style={styles.icon}>
        <AlertIcon size={18} color={colors.error} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} accessibilityRole="button" style={styles.retry}>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: 20,
    borderRadius: radii.small,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
    /* The web's soft red halo. A platform paints one shadow, and Android
       ignores the shadow props entirely — so it lands on iOS alone. */
    ...Platform.select({
      ios: { shadowColor: "#EF4444", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      default: {},
    }),
  },
  icon: { marginTop: 2 },

  /* `text-sm font-semibold` */
  title: { fontSize: 14, ...font(600), lineHeight: 20, color: "#991B1B" },
  /* `text-xs mt-0.5` */
  message: { fontSize: 12, lineHeight: 16, color: "#B91C1C", marginTop: 2 },

  /* `mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg` — `rounded-lg` is 8. */
  retry: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.error,
  },
  retryLabel: { fontSize: 12, ...font(600), lineHeight: 16, color: colors.onGreen },
});
