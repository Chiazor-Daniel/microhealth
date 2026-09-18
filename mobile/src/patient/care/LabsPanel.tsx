import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";
import { usePatientData } from "@app/hooks/usePatientData";

import { StatusBadge } from "@/ui/StatusBadge";
import { ErrorState } from "@/ui/ErrorState";
import { Loading } from "@/ui/Loading";
import { buttonSecondary, card, iconTile, iconTileBorder } from "@/ui/styles";
import { ArrowDownIcon, ChevronDownIcon, FlaskIcon } from "@/icons";

/** The web writes the result date out as "Sep 17, 2026". */
const RESULT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function LabsPanel() {
  const { labs, loading, error, refresh } = usePatientData();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>

      {error ? (
        <View style={{ marginTop: spacing.blockGap }}>
          <ErrorState message={error} onRetry={refresh} />
        </View>
      ) : null}

      {loading ? (
        <View style={{ marginTop: spacing.blockGap }}>
          <Loading />
        </View>
      ) : labs.length === 0 ? (
        <View style={[card, styles.empty]}>
          <LinearGradient
            {...linearGradient("tileSlate")}
            style={[iconTile, { width: 48, height: 48, borderColor: iconTileBorder.slate }]}
          >
            <FlaskIcon size={20} color={semantic.textSecondary} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No lab results yet</Text>
          <Text style={styles.emptyBody}>Results appear here after your visit</Text>
        </View>
      ) : (
        <View style={{ marginTop: spacing.blockGap, gap: spacing.sm }}>
          {labs.map((l, i) => {
            const isOpen = open === i;
            const isPending = l.status === "pending";
            const createdAt = (l as any).createdAt as string | undefined;

            return (
              <View key={l.id} style={[card, styles.test]}>
                <Pressable
                  onPress={() => setOpen(isOpen ? null : i)}
                  accessibilityRole="button"
                  style={styles.testRow}
                >
                  <LinearGradient
                    {...linearGradient("tileBlue")}
                    style={[iconTile, { width: 40, height: 40, borderColor: iconTileBorder.blue }]}
                  >
                    <FlaskIcon size={17} color={colors.blue} />
                  </LinearGradient>

                  <View style={styles.testText}>
                    <Text style={styles.testName} numberOfLines={1}>
                      {l.testName}
                    </Text>
                    <Text style={styles.testDate}>
                      {createdAt ? RESULT_DATE.format(new Date(createdAt)) : "—"}
                    </Text>
                  </View>

                  <StatusBadge status={isPending ? "pending" : "completed"} />

                  {/* The chevron turns over rather than swapping glyphs; the web
                      does the same with a 0.2s transform. RN takes the rotation
                      as a style, so the turn is instant — the only difference
                      worth noting. */}
                  <LinearGradient
                    {...linearGradient("tileSlate")}
                    style={[iconTile, styles.chevron, { borderColor: iconTileBorder.slate }]}
                  >
                    <View style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}>
                      <ChevronDownIcon size={14} color={semantic.textSecondary} />
                    </View>
                  </LinearGradient>
                </Pressable>

                {isOpen ? (
                  <View style={styles.panel}>
                    <View style={styles.panelInner}>
                      <Field label="Result" value={l.result || "—"} />
                      {l.resultNotes ? <Field label="Clinician note" value={l.resultNotes} /> : null}
                      {l.status !== "pending" ? (
                        <Pressable accessibilityRole="button" style={styles.download}>
                          <ArrowDownIcon size={13} color={semantic.accentDeep} />
                          <Text style={styles.downloadLabel}>Download PDF</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </>
  );
}

/** `.mh-field` — the recessed tray a result is read out of. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <LinearGradient
      colors={["#F2F6F8", "#F8FBFC"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.field}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  /* `mh-btn-secondary px-3.5 py-2 text-[13px] font-semibold` with the icon
     and label on one line. */
  download: {
    ...buttonSecondary,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  downloadLabel: { fontSize: 13, ...font(600), lineHeight: 19.5, color: semantic.accentDeep },

  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: spacing.lg, marginTop: spacing.blockGap },
  emptyTitle: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.textPrimary, marginTop: spacing.sm },
  emptyBody: { fontSize: 13, lineHeight: 19.5, color: semantic.textMuted, marginTop: 4, textAlign: "center" },

  test: { overflow: "hidden" },
  /* `p-4` on the row, and `gap-3` between the four columns of it. */
  testRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  testText: { flex: 1, minWidth: 0 },
  testName: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.textPrimary },
  testDate: { fontSize: 12, lineHeight: 18, color: semantic.textMuted, marginTop: 2 },
  chevron: { width: 32, height: 32 },

  /* `px-4 pb-4` around a `pt-3` panel, divided from the row by a hairline. */
  panel: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  panelInner: { paddingTop: spacing.sm, gap: 10, borderTopWidth: 1, borderTopColor: colors.hairlineSoft },

  /* `mh-field rounded-xl p-3` — `rounded-xl` is 12. */
  field: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224,234,240,0.95)",
  },
  fieldLabel: { fontSize: 11, ...font(600), lineHeight: 16.5, color: semantic.textMuted },
  fieldValue: { fontSize: 14, ...font(500), lineHeight: 20, color: semantic.textPrimary, marginTop: 4 },
});
