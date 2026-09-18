import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, semantic, spacing } from "@tokens";
import { font, linearGradient } from "@rn/theme";

import { card, iconTile, iconTileBorder } from "./styles";

/**
 * What a screen shows before there is anything to show.
 *
 * A new patient has no readings and no history, and the honest failure mode is
 * a card full of em dashes — which reads as broken rather than as new. Every
 * empty screen should say what belongs here and, where there is something the
 * patient can actually do, offer it.
 *
 * Deliberately not a cute illustration: an empty state is an instruction, and
 * the fastest way for someone to understand the app is for it to tell them.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  /** Omit both when there is genuinely nothing the patient can do yet. */
  action?: string;
  onAction?: () => void;
  /** Tighter layout, for an empty state inside a card rather than a page. */
  compact?: boolean;
}) {
  return (
    <View style={[card, compact ? styles.compact : styles.full]}>
      <LinearGradient
        {...linearGradient("tile")}
        style={[iconTile, { width: compact ? 44 : 52, height: compact ? 44 : 52, borderColor: iconTileBorder.green }]}
      >
        {icon}
      </LinearGradient>

      <Text style={[styles.title, compact ? styles.titleCompact : null]}>{title}</Text>
      <Text style={[styles.body, compact ? styles.bodyCompact : null]}>{body}</Text>

      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" style={styles.action}>
          <Text style={styles.actionLabel}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  full: { alignItems: "center", paddingVertical: 48, paddingHorizontal: spacing.lg, marginTop: spacing.blockGap },
  compact: { alignItems: "center", paddingVertical: 32, paddingHorizontal: spacing.md },

  title: { fontSize: 15.5, ...font(600), lineHeight: 22, color: semantic.textPrimary, marginTop: 14, textAlign: "center" },
  titleCompact: { fontSize: 14, lineHeight: 20, marginTop: 10 },
  body: { fontSize: 13.5, lineHeight: 20, color: semantic.textSecondary, marginTop: 5, textAlign: "center", maxWidth: 300 },
  bodyCompact: { fontSize: 12.5, lineHeight: 19 },

  action: {
    marginTop: spacing.md,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(133,192,206,0.65)",
    backgroundColor: colors.surface,
  },
  actionLabel: { fontSize: 13.5, ...font(600), lineHeight: 20, color: semantic.accentDeep },
});
