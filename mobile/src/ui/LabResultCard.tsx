import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";

import { CalendarIcon, ChevronRightIcon } from "@/icons";
import { card, iconTile } from "./styles";

interface LabResultCardProps {
  testName: string;
  date: string;
  status: string;
  result?: string;
  notes?: string;
}

/**
 * Lab row.
 * Collapsed it reads as a normal list row — what, when, and whether anything
 * needs attention. Opening it reveals the result without leaving the page.
 */
export function LabResultCard({ testName, date, status, result, notes }: LabResultCardProps) {
  const [open, setOpen] = useState(false);
  const normal = status === "completed" || status === "normal";

  return (
    <View style={[card, styles.wrap]}>
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityState={{ expanded: open }} style={styles.header}>
        <LinearGradient {...linearGradient("tile")} style={[iconTile, styles.icon]}>
          <CalendarIcon size={19} color={semantic.accentDeep} />
        </LinearGradient>

        <View style={styles.text}>
          <Text style={styles.testName} numberOfLines={1}>
            {testName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {date}
            {date ? " • " : ""}
            <Text style={{ color: normal ? semantic.accentDeep : colors.amber }}>
              {normal ? "Normal" : status === "pending" ? "Pending" : status}
            </Text>
          </Text>
        </View>

        {/* The chevron turns to point down as the panel opens, so the row's
            state is legible from the glyph alone. */}
        <View style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}>
          <ChevronRightIcon size={16} color={semantic.textPrimary} />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.panels}>
          <Panel label="Result" value={result || "—"} />
          {notes ? <Panel label="Clinician note" value={notes} /> : null}
        </View>
      ) : null}
    </View>
  );
}

/** One recessed read-out inside the opened row. */
function Panel({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelLabel}>{label}</Text>
      <Text style={styles.panelValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /* The card clips its own corners, so the opened panel stays inside them. */
  wrap: { overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: 14 },
  icon: { width: 40, height: 40 },
  text: { flex: 1, minWidth: 0 },

  testName: { fontSize: 13.5, ...font(600), lineHeight: 20.25, color: semantic.textPrimary },
  meta: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textSecondary, marginTop: 2 },

  panels: { paddingHorizontal: 14, paddingBottom: 14, gap: spacing.xs },
  panel: {
    padding: 12,
    borderRadius: radii.small,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  panelLabel: { fontSize: 11, ...font(600), lineHeight: 16.5, letterSpacing: 0.04 * 11, color: semantic.textMuted },
  panelValue: { fontSize: 13, lineHeight: 19.5, color: semantic.textPrimary, marginTop: 4 },
});
