import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";

import { BrandMark } from "./BrandMark";
import { buttonPrimary, buttonSecondary, card, iconGreen } from "./styles";

export interface InsightCardProps {
  priority: "info" | "watch" | "attention" | "urgent";
  title: string;
  message: string;
  time?: string;
  type?: "trend" | "medication" | "appointment" | "lab" | "recovery" | "wearable" | "system";
  actions?: { label: string; onClick: () => void }[];
  onClick?: () => void;
  /** Accepted for parity with the web component, which ignores both. */
  chevron?: boolean;
}

/**
 * What the agent has to say.
 *
 * This is the agent speaking in its own voice, so it carries the agent's mark
 * rather than a per-type icon — the category is already legible from the
 * words, and a grid of differently-tinted tiles made every insight look like
 * a different kind of object. The action is a full-width control.
 *
 * Web paints the mint ground with `patientTheme.gradients.mint` over `.mh-card`;
 * here the card is the plain surface and the gradient sits on it.
 */
export function InsightCard({ priority, title, message, time, actions, onClick }: InsightCardProps) {
  const accent = statusColor(priority);
  const flagged = priority === "attention" || priority === "urgent";

  /* A flagged finding wears the danger red instead of the agent's green. The
     red has no gradient token — the design system only names the flat error
     colour — so the lighter top stop is the one the web hard-codes. */
  const markColors = flagged ? (["#F87171", colors.error] as [string, string]) : gradients.iconGreen.colors;

  return (
    <Pressable onPress={onClick} disabled={!onClick}>
      <LinearGradient {...linearGradient("mint")} style={[card, styles.card]}>
        <View style={styles.top}>
          <View style={styles.titleRow}>
            <LinearGradient colors={markColors} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[iconGreen, styles.mark]}>
              <BrandMark size={15} />
            </LinearGradient>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>

        <Text style={styles.message}>{message}</Text>

        {flagged ? (
          <Text style={[styles.flagged, { color: accent }]}>
            {priority === "urgent" ? "Needs attention now" : "Worth watching"}
          </Text>
        ) : null}

        {actions && actions.length > 0 ? (
          <View style={styles.actions}>
            {actions.map((a, i) =>
              i === 0 ? (
                <Pressable key={a.label} onPress={a.onClick} style={styles.action}>
                  <LinearGradient {...linearGradient("buttonPrimary")} style={[buttonPrimary, styles.actionControl]}>
                    <Text style={[styles.actionLabel, { color: colors.onGreen }]}>{a.label}</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable key={a.label} onPress={a.onClick} style={[buttonSecondary, styles.action, styles.actionControl]}>
                  <Text style={[styles.actionLabel, { color: semantic.accentDeep }]}>{a.label}</Text>
                </Pressable>
              ),
            )}
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

/**
 * The priority as a colour: the agent's own green for "nothing to do", and the
 * rungs above it. The orange between warning and error is the one value the
 * design system states only here.
 */
function statusColor(priority: InsightCardProps["priority"]) {
  switch (priority) {
    case "info":
      return colors.success;
    case "watch":
      return colors.warning;
    case "attention":
      return "#EA580C";
    case "urgent":
      return colors.error;
    default:
      return semantic.textMuted;
  }
}

const styles = StyleSheet.create({
  card: { padding: spacing.md },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.xs },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  mark: { width: 34, height: 34 },
  title: { fontSize: 14.5, ...font(600), lineHeight: 19.9, letterSpacing: -0.01 * 14.5, color: semantic.textPrimary, flexShrink: 1 },
  time: { fontSize: 11, lineHeight: 16.5, color: semantic.textMuted },
  message: { fontSize: 13, lineHeight: 21.1, color: semantic.textPrimary, marginTop: spacing.sm },
  flagged: { fontSize: 12, ...font(600), lineHeight: 18, marginTop: spacing.xs },
  actions: { flexDirection: "row", gap: 10, marginTop: spacing.md },
  action: { flex: 1 },
  actionControl: { paddingVertical: 10, alignItems: "center" },
  actionLabel: { fontSize: 13, ...font(600), lineHeight: 19.5 },
});
