import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";

import { CapsuleIcon, ChevronRightIcon } from "@/icons";
import { buttonSecondary, card, iconTile } from "./styles";

interface MedicationCardProps {
  name: string;
  dosage: string;
  duration?: string;
  status: string;
  refills?: number;
  onRefill?: () => void;
  onClick?: () => void;
}

/**
 * Prescription row.
 * A medicine is a row in a list, not a hero: the capsule leads, the schedule
 * reads as one line, and the only action offered is the one that matters.
 */
export function MedicationCard({ name, dosage, duration, status, refills, onRefill, onClick }: MedicationCardProps) {
  const expired = status === "expired";
  const schedule = [dosage, duration].filter(Boolean).join(" • ");
  const canRefill = !expired && (refills ?? 0) > 0 && !!onRefill;

  return (
    <Pressable onPress={onClick} style={[card, styles.row]}>
      {/* A spent prescription drops off the green register entirely — the grey
          tile is what tells the patient there is nothing left to act on. */}
      <LinearGradient
        {...linearGradient(expired ? "tileSlate" : "tile")}
        style={[iconTile, styles.icon]}
      >
        <CapsuleIcon size={19} color={expired ? semantic.textSecondary : semantic.accentDeep} />
      </LinearGradient>

      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.schedule} numberOfLines={1}>
          {schedule || "—"}
        </Text>
      </View>

      {expired ? (
        <Text style={[styles.tag, { color: colors.rose }]}>Expired</Text>
      ) : canRefill ? (
        /* The refill control sits inside a pressable row, so it has to swallow
           the press itself — otherwise one tap would also open the list. */
        <Pressable
          onPress={onRefill}
          accessibilityRole="button"
          style={[buttonSecondary, styles.refill]}
        >
          <Text style={styles.refillLabel}>Refill · {refills}</Text>
        </Pressable>
      ) : onClick ? (
        <ChevronRightIcon size={16} color={semantic.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: 14 },
  icon: { width: 40, height: 40 },
  text: { flex: 1, minWidth: 0 },

  name: { fontSize: 13.5, ...font(600), lineHeight: 20.25, color: semantic.textPrimary },
  schedule: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textSecondary, marginTop: 2 },
  tag: { fontSize: 12, ...font(600), lineHeight: 18 },

  refill: { paddingHorizontal: 12, paddingVertical: 6 },
  refillLabel: { fontSize: 12, ...font(600), lineHeight: 18, color: semantic.accentDeep },
});
