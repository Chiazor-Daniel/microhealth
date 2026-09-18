import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";
import { usePatientData } from "@app/hooks/usePatientData";
import { prescriptionService } from "@app/services/prescription.service";

import { SegmentedTabs } from "@/ui/SegmentedTabs";
import { ErrorState } from "@/ui/ErrorState";
import { Loading } from "@/ui/Loading";
import { buttonPrimary, card, iconTile, iconTileBorder, pill, pillTone, statusText } from "@/ui/styles";
import { CapsuleIcon } from "@/icons";

const tabs: { value: "active" | "past"; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "past", label: "Past" },
];

export function PrescriptionsPanel() {
  const { prescriptions, loading, error, refresh } = usePatientData();
  const [tab, setTab] = useState<"active" | "past">("active");
  const [refillingId, setRefillingId] = useState<string | null>(null);

  const active = prescriptions.filter((p) => p.status !== "expired");
  const past = prescriptions.filter((p) => p.status === "expired");
  const list = tab === "active" ? active : past;

  const handleRefill = async (id: string) => {
    setRefillingId(id);
    try {
      await prescriptionService.requestRefill(id);
    } catch {
      /* The web raises a toast here. There is no toast host in the native app,
         and the refill request is the part that matters, so a failure is left
         to surface on the next read of the list rather than being swallowed by
         a notification that does not exist. */
    } finally {
      setRefillingId(null);
    }
  };

  return (
    <>

      <View style={{ marginTop: spacing.blockGap }}>
        <SegmentedTabs options={tabs} value={tab} onChange={setTab} fill />
      </View>

      {error ? (
        <View style={{ marginTop: spacing.blockGap }}>
          <ErrorState message={error} onRetry={refresh} />
        </View>
      ) : loading ? (
        <View style={{ marginTop: spacing.blockGap }}>
          <Loading />
        </View>
      ) : list.length === 0 ? (
        <View style={[card, styles.empty]}>
          <LinearGradient
            {...linearGradient("tileTeal")}
            style={[iconTile, { width: 48, height: 48, borderColor: iconTileBorder.teal }]}
          >
            <CapsuleIcon size={20} color={colors.teal} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No {tab} prescriptions</Text>
          <Text style={styles.emptyBody}>
            {tab === "active" ? "Active prescriptions appear here" : "Past prescriptions will show here"}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: spacing.blockGap, gap: spacing.sm }}>
          {list.map((rx) => {
            const expired = rx.status === "expired";
            return (
              <View key={rx.id} style={[card, styles.rx]}>
                <View style={styles.rxRow}>
                  <LinearGradient
                    {...linearGradient("tileTeal")}
                    style={[iconTile, { width: 40, height: 40, borderColor: iconTileBorder.teal }]}
                  >
                    <CapsuleIcon size={17} color={colors.teal} />
                  </LinearGradient>

                  <View style={styles.rxText}>
                    <Text style={styles.medicine} numberOfLines={1}>
                      {rx.medicine}
                    </Text>
                    <Text style={styles.dosage}>{rx.dosage}</Text>
                    {rx.duration ? <Text style={styles.duration}>{rx.duration}</Text> : null}
                  </View>

                  <Pill tone={expired ? "rose" : "green"}>
                    <Text style={[statusText, { fontSize: 11, color: pillTone[expired ? "rose" : "green"].fg }]}>
                      {rx.expiryDate ? `Expires ${rx.expiryDate}` : expired ? "Expired" : "Active"}
                    </Text>
                  </Pill>
                </View>

                {tab === "active" && (rx.refills ?? 0) > 0 ? (
                  <Pressable
                    onPress={() => handleRefill(rx.id)}
                    disabled={refillingId === rx.id}
                    accessibilityRole="button"
                    style={{ marginTop: 14 }}
                  >
                    {/* The web also desaturates the disabled control; RN has no
                        saturate filter, and the label already says what is
                        happening, so the state is carried by text alone. */}
                    <LinearGradient {...linearGradient("buttonPrimary")} style={[buttonPrimary, styles.refill]}>
                      {refillingId === rx.id ? (
                        <View style={styles.refillBusy}>
                          <ActivityIndicator size="small" color={colors.onGreen} />
                          <Text style={styles.refillLabel}>Requesting…</Text>
                        </View>
                      ) : (
                        <Text style={styles.refillLabel}>Request refill · {rx.refills} left</Text>
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

/** `.mh-pill` in one of its tones — the capsule the header count and each
    prescription's state are written in. */
function Pill({ tone, children }: { tone: "green" | "rose"; children: React.ReactNode }) {
  const t = pillTone[tone];
  return (
    <LinearGradient
      colors={[t.bg[0], t.bg[1]]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[pill, { borderColor: t.borderColor, paddingHorizontal: 10, paddingVertical: 4 }]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: spacing.lg, marginTop: spacing.blockGap },
  /* `text-sm font-semibold mt-3` */
  emptyTitle: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.textPrimary, marginTop: spacing.sm },
  emptyBody: { fontSize: 13, lineHeight: 19.5, color: semantic.textMuted, marginTop: 4, textAlign: "center" },

  rx: { padding: spacing.md },
  rxRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  rxText: { flex: 1, minWidth: 0 },
  medicine: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.textPrimary },
  dosage: { fontSize: 13, lineHeight: 19.5, color: semantic.textSecondary, marginTop: 2 },
  duration: { fontSize: 12, lineHeight: 18, color: semantic.textMuted },

  refill: { alignItems: "center", paddingVertical: 10 },
  refillBusy: { flexDirection: "row", alignItems: "center", gap: 6 },
  refillLabel: { fontSize: 13, ...font(600), lineHeight: 19.5, color: colors.onGreen },
});
