import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { colors, radii, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";
import { familyService, familyGroupService, type FamilyMember, type GroupMember, type GroupRole } from "@app/services/family.service";
import { vitalService } from "@app/services/vital.service";
import { computeHealthScore, readingsFromPacket } from "@metrics/healthScore";
import { aiService } from "@app/services/ai.service";
import { useAuth } from "@app/hooks/useAuth";
import { usePatientData } from "@app/hooks/usePatientData";

import { Screen } from "@/ui/Screen";
import { StatusBadge } from "@/ui/StatusBadge";
import { Avatar } from "@/ui/Avatar";
import { variantForRelation } from "@app/patient/lib/avatars";
import { card, iconTile, iconTileBorder } from "@/ui/styles";
import { PersonIcon, CheckIcon, ChevronRightIcon } from "@/icons";
import { RowSkeleton } from "@/ui/Skeleton";
import { useIsOffline } from "@/lib/connectivity";

const ROLES: GroupRole[] = ["Mum", "Dad", "Spouse", "Child", "Grandparent", "Other"];

/**
 * Family: the household (real accounts) first, dependents second.
 *
 * Household cards show name, role, health score and a View Vitals action —
 * every member sees the same household. Only the head (group creator) gets
 * manual Add and the invite-link generator; everyone gets alert-follow
 * switches ("whose alerts do I get").
 */
export default function FamilyMembers() {
  const router = useRouter();
  const { user } = useAuth();
  const { family, loading, refresh } = usePatientData();
  const offline = useIsOffline();
  const userPatientId = user?.profile?.id;

  const [members, setMembers] = useState<FamilyMember[]>(family || []);
  const [household, setHousehold] = useState<GroupMember[]>([]);
  const [isHead, setIsHead] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [houseLoading, setHouseLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newAge, setNewAge] = useState("");
  const [saving, setSaving] = useState(false);

  const [inviteRole, setInviteRole] = useState<GroupRole>("Child");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const [prefs, setPrefs] = useState<Record<string, { alertAbnormal: boolean; alertMissedMedication: boolean; alertUrgent: boolean }>>({});
  const [follows, setFollows] = useState<Record<string, boolean>>({});

  const loadHousehold = async () => {
    setHouseLoading(true);
    try {
      const groups = await familyGroupService.mine();
      if (!groups.length) {
        setHousehold([]);
        setIsHead(false);
        setGroupId(null);
        return;
      }
      const gid = groups[0].group.id;
      setGroupId(gid);
      setIsHead(groups[0].group.createdBy === userPatientId);
      const ms = await familyGroupService.members(gid);
      setHousehold(ms);
      const subs = await familyGroupService.subscriptions().catch(() => []);
      const map: Record<string, boolean> = {};
      for (const s of subs) {
        map[s.targetPatientId] = !!(s.alertAbnormal || s.alertMissedMedication || s.alertUrgent);
      }
      setFollows(map);
    } catch {
      /* Household is additive; dependents still render without it. */
    } finally {
      setHouseLoading(false);
    }
  };

  useEffect(() => {
    setMembers(family || []);
  }, [family]);

  useEffect(() => {
    loadHousehold();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Profile hydrates async — re-resolve headship once it lands. */
  useEffect(() => {
    if (userPatientId) loadHousehold();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPatientId]);

  const handleAdd = async () => {
    if (!newName.trim() || !newRelation.trim() || !userPatientId) return;
    setSaving(true);
    try {
      const member = await familyService.add(userPatientId, {
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

  const makeInviteLink = async () => {
    if (!groupId || inviting) return;
    setInviting(true);
    try {
      const row = await familyGroupService.inviteLink(groupId, inviteRole);
      const url = Linking.createURL(`join/${row.token}`);
      setInviteLink(url);
      await Share.share({ message: `Join our MicroHealth family as ${inviteRole}: ${url}` });
    } catch (err: any) {
      Alert.alert("Couldn't create link", err?.message ?? "Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const toggleFollow = async (targetId: string | null, on: boolean) => {
    if (!targetId) return;
    setFollows((f) => ({ ...f, [targetId]: on }));
    try {
      if (on) await familyGroupService.follow(targetId, {});
      else await familyGroupService.unfollow(targetId);
    } catch {
      setFollows((f) => ({ ...f, [targetId]: !on }));
      Alert.alert("Couldn't save", "Alert follow didn't save. Try again.");
    }
  };

  if (loading && !members.length && houseLoading) {
    return (
      <Screen>
        <RowSkeleton rows={3} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Family</Text>
        {isHead ? (
          <Pressable onPress={() => setShowForm((v) => !v)}>
            <LinearGradient {...linearGradient("buttonPrimary")} style={styles.addButton}>
              <Text style={styles.addLabel}>+ Add</Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>

      {/* Household — real accounts, visible to every member. */}
      <Text style={styles.sectionTitle}>Household</Text>
      {household.length === 0 ? (
        <View style={[card, styles.empty]}>
          <Text style={styles.emptyTitle}>No household yet</Text>
          <Text style={styles.emptyNote}>
            {isHead ? "Create one during onboarding, or invite from here once a group exists." : "Once you're in a family group, everyone appears here."}
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {household.map((m) => {
            const name = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.role;
            const isMe = m.patientId === userPatientId;
            return (
              <View key={m.membershipId} style={[card, { padding: spacing.md }]}>
                <View style={styles.memberRow}>
                  <Avatar seed={m.patientId ?? name} name={name} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {name}{isMe ? " (you)" : ""}
                    </Text>
                    <Text style={styles.memberMeta}>{m.role}{m.status !== "active" ? ` · ${m.status}` : ""}</Text>
                  </View>
                </View>

                {m.patientId && !isMe ? (
                  <MemberScoreRow
                    patientId={m.patientId}
                    name={m.firstName ?? m.role}
                    onOpen={() => router.push(`/care/member/${m.patientId}`)}
                  />
                ) : null}

                {m.patientId && !isMe ? (
                  <View style={styles.alertRow}>
                    <Text style={styles.alertLabel}>Alert me about {m.firstName ?? "them"}</Text>
                    <Switch
                      value={!!follows[m.patientId]}
                      onValueChange={(nv) => toggleFollow(m.patientId, nv)}
                      trackColor={{ true: colors.green600 }}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {/* Invite links — head only. */}
      {isHead && groupId ? (
        <View style={[card, styles.inviteBox]}>
          <Text style={styles.sectionTitle}>Invite by link</Text>
          <Text style={styles.hint}>They register or sign in through the link and join automatically.</Text>
          <View style={styles.chipWrap}>
            {ROLES.map((r) => {
              const on = inviteRole === r;
              return (
                <Pressable key={r} onPress={() => setInviteRole(r)} accessibilityState={{ selected: on }}>
                  <View style={[styles.chip, on ? styles.chipOn : null]}>
                    <Text style={[styles.chipLabel, on ? styles.chipLabelOn : null]}>{r}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={makeInviteLink} disabled={inviting} style={[styles.inviteBtn, { opacity: inviting ? 0.6 : 1 }]}>
            <Text style={styles.inviteBtnLabel}>{inviting ? "Creating…" : "Create + share invite link"}</Text>
          </Pressable>
          {inviteLink ? <Text style={styles.link} selectable>{inviteLink}</Text> : null}
        </View>
      ) : null}

      {/* Manual add — head only. */}
      {isHead && showForm ? (
        <LinearGradient {...linearGradient("mint")} style={styles.form}>
          <View style={styles.formHead}>
            <Text style={styles.formTitle}>Add dependent</Text>
            <Pressable onPress={() => setShowForm(false)} accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <TextInput value={newName} onChangeText={setNewName} placeholder="Full name" placeholderTextColor={semantic.textMuted} style={styles.input} />
          <TextInput value={newRelation} onChangeText={setNewRelation} placeholder="Relation (e.g. Daughter)" placeholderTextColor={semantic.textMuted} style={styles.input} />
          <TextInput value={newAge} onChangeText={setNewAge} placeholder="Age" placeholderTextColor={semantic.textMuted} keyboardType="number-pad" style={styles.input} />
          <Pressable onPress={handleAdd} disabled={saving || !newName.trim() || !newRelation.trim()}>
            <LinearGradient {...linearGradient("buttonPrimary")} style={[styles.saveButton, { opacity: saving || !newName.trim() || !newRelation.trim() ? 0.5 : 1 }]}>
              {saving ? <ActivityIndicator color={colors.onGreen} /> : <Text style={styles.saveLabel}>Save Member</Text>}
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      ) : null}

      {/* Dependents — contact rows with outbound alert toggles. */}
      {members.length > 0 ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Dependents</Text>
          <View style={{ gap: spacing.sm }}>
            {members.map((m) => (
              <View key={m.id} style={[card, { padding: spacing.md }]}>
                <View style={styles.memberRow}>
                  <Avatar seed={m.id} variant={variantForRelation(m.relation)} name={m.name} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName} numberOfLines={1}>{m.name}</Text>
                    <Text style={styles.memberMeta}>{m.relation}{m.age ? ` · ${m.age}y` : ""}</Text>
                  </View>
                  <StatusBadge status={m.status} />
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
            ))}
          </View>
        </View>
      ) : null}
      {offline ? <Text style={styles.offlineNote}>You're offline — family changes will sync when you reconnect.</Text> : null}
    </Screen>
  );
}

/** Member health-score summary with a drill-in arrow. Taps through to View Vitals. */
function MemberScoreRow({ patientId, name, onOpen }: { patientId: string; name: string; onOpen: () => void }) {
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    vitalService.getByPatient(patientId).then((rows) => {
      if (!rows.length) return;
      const s = computeHealthScore(readingsFromPacket(rows[0]));
      setScore(s.score);
    }).catch(() => {});
  }, [patientId]);
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`View ${name}'s vitals`} style={styles.scoreRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.scoreLabel}>Health score</Text>
        <Text style={styles.scoreValue}>{score == null ? "—" : score}<Text style={styles.scoreDenom}>/100</Text></Text>
      </View>
      <ChevronRightIcon size={18} color={semantic.textSecondary} />
    </Pressable>
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
  sectionTitle: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.textPrimary, marginTop: spacing.md, marginBottom: spacing.xs },

  form: { marginTop: spacing.sm, padding: spacing.md, gap: spacing.sm, borderRadius: radii.feature, borderWidth: 1, borderColor: "rgba(196,224,233,0.75)", overflow: "hidden" },
  formHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.accentDeep },
  close: { fontSize: 15, lineHeight: 20, color: semantic.textSecondary },
  input: { fontSize: 14, lineHeight: 20, color: semantic.textPrimary, backgroundColor: colors.surface, borderRadius: radii.control, borderWidth: 1, borderColor: "#E0E6EC", paddingHorizontal: 14, paddingVertical: 10 },
  saveButton: { paddingVertical: 10, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  saveLabel: { fontSize: 13, ...font(600), lineHeight: 20, color: colors.onGreen },

  empty: { alignItems: "center", paddingVertical: 32, paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary, marginTop: spacing.sm },
  emptyNote: { fontSize: 13, lineHeight: 20, color: semantic.textMuted, marginTop: 4, textAlign: "center" },

  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  memberName: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary },
  memberMeta: { fontSize: 13, lineHeight: 20, color: semantic.textSecondary },

  actions: { flexDirection: "row", gap: spacing.xs, marginTop: 14 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: spacing.sm,
    marginTop: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.control,
    backgroundColor: "#F6FAF8",
    borderWidth: 1,
    borderColor: "rgba(226,236,231,0.9)",
  },
  scoreLabel: { fontSize: 12, ...font(500), lineHeight: 16, color: semantic.textSecondary },
  scoreValue: { fontSize: 22, ...font(700), lineHeight: 26, color: semantic.textPrimary, marginTop: 2 },
  scoreDenom: { fontSize: 12, ...font(500), color: semantic.textMuted },
  action: { flex: 1, paddingVertical: spacing.xs, paddingHorizontal: spacing.xs, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.green600 },
  actionLabel: { fontSize: 12, ...font(600), lineHeight: 18, color: colors.onGreen },

  inviteBox: { marginTop: spacing.md, padding: spacing.md },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: spacing.xs },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, borderWidth: 1, borderColor: "rgba(133,192,206,0.65)", backgroundColor: colors.surface },
  chipOn: { borderColor: colors.green600, backgroundColor: colors.green600 },
  chipLabel: { fontSize: 12.5, ...font(600), lineHeight: 17, color: semantic.textPrimary },
  chipLabelOn: { color: colors.onGreen },
  inviteBtn: { paddingVertical: 11, borderRadius: radii.pill, alignItems: "center", backgroundColor: colors.green600 },
  inviteBtnLabel: { fontSize: 13.5, ...font(600), color: colors.onGreen },
  link: { fontSize: 12, lineHeight: 17, color: semantic.accentDeep, marginTop: spacing.xs },
  hint: { fontSize: 12.5, lineHeight: 18, color: semantic.textMuted, marginTop: spacing.xs },
  offlineNote: { fontSize: 12, lineHeight: 17, color: semantic.textSecondary, textAlign: "center", marginTop: spacing.md },

  alertBox: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(133,192,206,0.35)" },
  alertTitle: { fontSize: 12, ...font(600), lineHeight: 18, color: semantic.textSecondary, marginBottom: 2 },
  alertRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  alertLabel: { fontSize: 13, lineHeight: 20, color: semantic.textPrimary },
});
