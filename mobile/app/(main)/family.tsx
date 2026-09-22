import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, semantic, spacing } from "@tokens";
import { linearGradient, text, font } from "@rn/theme";
import { familyService, type FamilyMember } from "@app/services/family.service";
import { aiService } from "@app/services/ai.service";
import { useAuth } from "@app/hooks/useAuth";
import { usePatientData } from "@app/hooks/usePatientData";

import { Screen } from "@/ui/Screen";
import { StatusBadge } from "@/ui/StatusBadge";
import { Avatar } from "@/ui/Avatar";
import { variantForRelation } from "@app/patient/lib/avatars";
import { card, iconTile, iconTileBorder } from "@/ui/styles";
import { PersonIcon } from "@/icons";

export default function FamilyMembers() {
  const { user } = useAuth();
  const { family, loading, refresh } = usePatientData();
  const userPatientId = user?.profile?.id;

  const [members, setMembers] = useState<FamilyMember[]>(family || []);
  const [patientId, setPatientId] = useState<string | null>(userPatientId || null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newAge, setNewAge] = useState("");
  const [saving, setSaving] = useState(false);
  /* Caregiver alert consent per member: which alert kinds they may receive. */
  const [prefs, setPrefs] = useState<Record<string, { alertAbnormal: boolean; alertMissedMedication: boolean; alertUrgent: boolean }>>({});

  useEffect(() => {
    setMembers(family || []);
    if (userPatientId) setPatientId(userPatientId);
  }, [family, userPatientId]);

  useEffect(() => {
    aiService.caregiverPrefs().then((rows) => {
      const map: Record<string, { alertAbnormal: boolean; alertMissedMedication: boolean; alertUrgent: boolean }> = {};
      for (const r of rows) {
        map[r.familyMemberId] = {
          alertAbnormal: !!r.alertAbnormal,
          alertMissedMedication: !!r.alertMissedMedication,
          alertUrgent: !!r.alertUrgent,
        };
      }
      setPrefs(map);
    }).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !newRelation.trim() || !patientId) return;
    setSaving(true);
    try {
      const member = await familyService.add(patientId, {
        name: newName.trim(),
        relation: newRelation.trim(),
        age: parseInt(newAge) || undefined,
        status: "active",
      });
      setMembers((prev) => [...prev, member]);
      setNewName("");
      setNewRelation("");
      setNewAge("");
      setShowForm(false);
      await refresh();
    } catch (err: any) {
      Alert.alert("Failed to add", err?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !members.length) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green600} />
        </View>
      </Screen>
    );
  }

  const fields: { placeholder: string; value: string; setter: (v: string) => void; numeric?: boolean }[] = [
    { placeholder: "Full name", value: newName, setter: setNewName },
    { placeholder: "Relation (e.g. Spouse, Daughter)", value: newRelation, setter: setNewRelation },
    { placeholder: "Age", value: newAge, setter: setNewAge, numeric: true },
  ];

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Family Members</Text>
        <Pressable onPress={() => setShowForm((v) => !v)}>
          <LinearGradient {...linearGradient("buttonPrimary")} style={styles.addButton}>
            <Text style={styles.addLabel}>+ Add</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {showForm ? (
        <LinearGradient {...linearGradient("mint")} style={styles.form}>
          <View style={styles.formHead}>
            <Text style={styles.formTitle}>Add Family Member</Text>
            <Pressable onPress={() => setShowForm(false)} accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {fields.map((f) => (
            <TextInput
              key={f.placeholder}
              value={f.value}
              onChangeText={f.setter}
              placeholder={f.placeholder}
              placeholderTextColor={semantic.textMuted}
              keyboardType={f.numeric ? "number-pad" : "default"}
              style={styles.input}
              accessibilityLabel={f.placeholder}
            />
          ))}

          <Pressable onPress={handleAdd} disabled={saving || !newName.trim() || !newRelation.trim()}>
            <LinearGradient
              {...linearGradient("buttonPrimary")}
              style={[styles.saveButton, { opacity: saving || !newName.trim() || !newRelation.trim() ? 0.5 : 1 }]}
            >
              {saving ? <ActivityIndicator color={colors.onGreen} /> : <Text style={styles.saveLabel}>Save Member</Text>}
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      ) : null}

      {members.length === 0 ? (
        <View style={[card, styles.empty]}>
          <LinearGradient
            {...linearGradient("tile")}
            style={[iconTile, { width: 48, height: 48, borderColor: iconTileBorder.green }]}
          >
            <PersonIcon size={20} color={semantic.accentDeep} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No family members yet</Text>
          <Text style={styles.emptyNote}>Add a dependent to manage their care.</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm, marginTop: spacing.blockGap }}>
          {members.map((m) => {
            return (
              <View key={m.id} style={[card, { padding: spacing.md }]}>
                <View style={styles.memberRow}>
                  <Avatar seed={m.id} variant={variantForRelation(m.relation)} name={m.name} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {m.name}
                    </Text>
                    <Text style={styles.memberMeta}>
                      {m.relation}
                      {m.age ? ` · ${m.age}y` : ""}
                    </Text>
                  </View>
                  <StatusBadge status={m.status} />
                </View>

                <View style={styles.actions}>
                  {["View Record", "Book Visit", "Vitals"].map((label) => (
                    <Pressable key={label} style={styles.action}>
                      <Text style={styles.actionLabel} numberOfLines={1}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <CaregiverToggles
                  memberId={m.id}
                  value={prefs[m.id]}
                  onChange={(next) => {
                    setPrefs((p) => ({ ...p, [m.id]: next }));
                    aiService.saveCaregiverPrefs({ familyMemberId: m.id, ...next }).catch(() => {
                      Alert.alert("Couldn't save", "Alert preferences didn't save. Try again.");
                    });
                  }}
                />
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

/** Consent toggles: which alert kinds this contact may receive. */
function CaregiverToggles({
  memberId,
  value,
  onChange,
}: {
  memberId: string;
  value?: { alertAbnormal: boolean; alertMissedMedication: boolean; alertUrgent: boolean };
  onChange: (next: { alertAbnormal: boolean; alertMissedMedication: boolean; alertUrgent: boolean }) => void;
}) {
  void memberId;
  const v = value ?? { alertAbnormal: false, alertMissedMedication: false, alertUrgent: false };
  const rows = [
    { key: "alertAbnormal", label: "Abnormal readings" },
    { key: "alertMissedMedication", label: "Missed medication" },
    { key: "alertUrgent", label: "Urgent care" },
  ] as const;
  return (
    <View style={styles.alertBox}>
      <Text style={styles.alertTitle}>Caregiver alerts</Text>
      {rows.map((r) => (
        <View key={r.key} style={styles.alertRow}>
          <Text style={styles.alertLabel}>{r.label}</Text>
          <Switch
            value={v[r.key]}
            onValueChange={(nv) => onChange({ ...v, [r.key]: nv })}
            trackColor={{ true: colors.green600 }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { fontSize: 22, ...font(600), lineHeight: 33, letterSpacing: -0.02 * 22, color: semantic.textPrimary },
  addButton: { paddingHorizontal: 14, paddingVertical: spacing.xs, borderRadius: radii.pill },
  addLabel: { fontSize: 13, ...font(600), lineHeight: 20, color: colors.onGreen },

  form: {
    marginTop: spacing.blockGap,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radii.feature,
    borderWidth: 1,
    borderColor: "rgba(196,224,233,0.75)",
    overflow: "hidden",
  },
  formHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.accentDeep },
  close: { fontSize: 15, lineHeight: 20, color: semantic.textSecondary },
  input: {
    fontSize: 14,
    lineHeight: 20,
    color: semantic.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: "#E0E6EC",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveButton: { paddingVertical: 10, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  saveLabel: { fontSize: 13, ...font(600), lineHeight: 20, color: colors.onGreen },

  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: spacing.lg, marginTop: spacing.blockGap },
  emptyTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary, marginTop: spacing.sm },
  emptyNote: { fontSize: 13, lineHeight: 20, color: semantic.textMuted, marginTop: 4 },

  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green50,
    borderWidth: 1,
    borderColor: "rgba(196,224,233,0.9)",
  },
  avatarText: { fontSize: 14, ...font(600), color: semantic.accentDeep },
  memberName: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary },
  memberMeta: { fontSize: 13, lineHeight: 20, color: semantic.textSecondary },

  actions: { flexDirection: "row", gap: spacing.xs, marginTop: 14 },
  action: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(133,192,206,0.65)",
  },
  actionLabel: { fontSize: 12, ...font(600), lineHeight: 18, color: semantic.accentDeep },

  alertBox: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(133,192,206,0.35)" },
  alertTitle: { fontSize: 12, ...font(600), lineHeight: 18, color: semantic.textSecondary, marginBottom: 2 },
  alertRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  alertLabel: { fontSize: 13, lineHeight: 20, color: semantic.textPrimary },
});
