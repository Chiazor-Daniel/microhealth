import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radii, semantic, spacing } from "@tokens";
import { font } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";
import { usePatientData } from "@app/hooks/usePatientData";
import { visitService } from "@app/services/appointment.service";
import { messageService } from "@app/services/message.service";

import { Screen } from "@/ui/Screen";
import { Avatar } from "@/ui/Avatar";
import { card } from "@/ui/styles";
import { ChevronLeftIcon, SendIcon, VideoIcon } from "@/icons";

/**
 * The consultation room.
 *
 * Appointment time comes, the patient taps Join, and lands here: the doctor
 * on one tile, themselves on the other, their live vitals shared across the
 * bottom, and a chat thread for the visit. The video track itself joins with
 * the native build (Expo Go has no camera-call module); the room around it —
 * session, shared vitals, chat, summary — is real today, so the call slots
 * into a working visit rather than an empty screen.
 */
export default function Visit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { appointments, vitals } = usePatientData();

  const [session, setSession] = useState<any>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [ended, setEnded] = useState<any>(null);

  const appt = appointments.find((a) => a.id === id);
  const doctorUser = (appt as any)?.doctor?.user ?? null;
  const doctorName = doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : "Your doctor";

  useEffect(() => {
    if (!id) return;
    visitService
      .join(id)
      .then(setSession)
      .catch((e: any) => setFailed(e?.message ?? "Couldn't join the visit."));
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadThread = async () => {
    if (!doctorUser?.id) return;
    try {
      const all = await messageService.list();
      setMsgs(all.filter((m: any) => m.senderId === doctorUser.id || m.recipientId === doctorUser.id));
    } catch {
      /* Chat is the side dish; the visit stands without it. */
    }
  };

  useEffect(() => {
    loadThread();
    const t = setInterval(loadThread, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorUser?.id]);

  const latest = vitals[0];
  const elapsed = useMemo(() => {
    if (!session?.joinedAt) return "00:00";
    const s = Math.max(0, Math.floor((now - new Date(session.joinedAt).getTime()) / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }, [now, session]);

  const send = async () => {
    if (!draft.trim() || sending || !doctorUser?.id) return;
    setSending(true);
    try {
      const m = await messageService.send(doctorUser.id, draft.trim());
      setMsgs((prev) => [...prev, m]);
      setDraft("");
    } catch {
      /* Leave the draft in place so nothing the patient wrote is lost. */
    } finally {
      setSending(false);
    }
  };

  const endVisit = async () => {
    if (!id) return;
    try {
      const done = await visitService.end(id, `Visit with ${doctorName}.`);
      setEnded(done);
    } catch {
      router.back();
    }
  };

  if (failed) {
    return (
      <Screen>
        <Text style={styles.title}>Visit</Text>
        <View style={[card, styles.center]}>
          <Text style={styles.body}>{failed}</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backLabel}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (ended) {
    return (
      <Screen>
        <Text style={styles.title}>Visit ended</Text>
        <View style={[card, styles.center]}>
          <Text style={styles.body}>Thanks — {doctorName} has your visit summary, including the vitals shared during the call ({elapsed}).</Text>
          <Pressable onPress={() => router.replace("/care")} style={styles.backBtn}>
            <Text style={styles.backLabel}>Back to Care</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green600} />
          <Text style={styles.body}>Joining your visit…</Text>
        </View>
      </Screen>
    );
  }

  const me = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "You";

  return (
    <Screen>
      {/* Visit header: who, how long, out. */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={styles.back}>
          <ChevronLeftIcon size={22} color={semantic.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>{doctorName}</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{elapsed}</Text>
          </View>
        </View>
        <Pressable onPress={endVisit} accessibilityRole="button" style={styles.endBtn}>
          <Text style={styles.endLabel}>End</Text>
        </Pressable>
      </View>

      {/* The call tiles. Video connects in the full build; the room is live now. */}
      <View style={styles.tiles}>
        <View style={[card, styles.tile]}>
          <Avatar seed={doctorUser?.id ?? doctorName} name={doctorName} size={64} />
          <Text style={styles.tileName}>{doctorName}</Text>
          <Text style={styles.tileNote}>Video connects in the full build</Text>
        </View>
        <View style={[card, styles.tile]}>
          <Avatar seed={user?.profile?.id ?? user?.email} name={me} size={64} />
          <Text style={styles.tileName}>{me} (you)</Text>
          <Text style={styles.tileNote}>Camera preview joins with video</Text>
        </View>
      </View>

      {/* Vitals the doctor sees with you, live. */}
      <View style={[card, styles.vitals]}>
        <View style={styles.vitalsHead}>
          <VideoIcon size={15} color={semantic.accentDeep} />
          <Text style={styles.vitalsTitle}>Shared live with {doctorName}</Text>
        </View>
        <View style={styles.vitalsRow}>
          <VitalMini label="Heart rate" value={latest?.heartRate != null ? `${latest.heartRate}` : "—"} unit="bpm" />
          <VitalMini
            label="Blood pressure"
            value={latest?.bloodPressureSystolic != null ? `${latest.bloodPressureSystolic}/${latest?.bloodPressureDiastolic ?? "—"}` : "—"}
            unit="mmHg"
          />
          <VitalMini label="SpO2" value={latest?.spo2 != null ? `${latest.spo2}` : "—"} unit="%" />
        </View>
      </View>

      {/* Visit chat */}
      <View style={[card, styles.chat]}>
        {msgs.length === 0 ? (
          <Text style={styles.body}>Say hello — {doctorName.split(" ")[1] ?? "the doctor"} joins the chat here.</Text>
        ) : (
          msgs.slice(-20).map((m) => (
            <View key={m.id} style={[styles.bubble, m.senderId === user?.id ? styles.mine : styles.theirs]}>
              <Text style={m.senderId === user?.id ? styles.mineText : styles.body}>{m.content}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message during the visit…"
          placeholderTextColor={semantic.textMuted}
          style={styles.input}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable onPress={send} disabled={sending || !draft.trim()} accessibilityLabel="Send" style={[styles.send, { opacity: sending || !draft.trim() ? 0.5 : 1 }]}>
          <SendIcon size={17} color={colors.onGreen} />
        </Pressable>
      </View>
    </Screen>
  );
}

function VitalMini({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>
        {value} <Text style={styles.miniUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, ...font(600), lineHeight: 24, color: semantic.textPrimary, textAlign: "center" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.error },
  liveText: { fontSize: 12, ...font(600), color: semantic.textSecondary },
  endBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.error },
  endLabel: { fontSize: 13, ...font(600), color: "#FFFFFF" },
  backBtn: { marginTop: spacing.sm, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: colors.green600 },
  backLabel: { fontSize: 14, ...font(600), color: colors.onGreen },

  tiles: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  tile: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  tileName: { fontSize: 13.5, ...font(600), marginTop: 8, color: semantic.textPrimary, textAlign: "center" },
  tileNote: { fontSize: 11.5, color: semantic.textMuted, marginTop: 2, textAlign: "center" },

  vitals: { marginTop: spacing.sm, padding: spacing.md },
  vitalsHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  vitalsTitle: { fontSize: 13, ...font(600), color: semantic.textPrimary },
  vitalsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  mini: { flex: 1 },
  miniLabel: { fontSize: 11.5, color: semantic.textSecondary },
  miniValue: { fontSize: 17, ...font(700), color: semantic.textPrimary },
  miniUnit: { fontSize: 11.5, ...font(500), color: semantic.textSecondary },

  chat: { marginTop: spacing.sm, padding: spacing.sm, gap: 6, minHeight: 120 },
  bubble: { maxWidth: "85%", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.green600 },
  theirs: { alignSelf: "flex-start", backgroundColor: "#F1F5F9" },
  mineText: { fontSize: 13.5, lineHeight: 19, color: "#FFFFFF" },
  body: { fontSize: 13.5, lineHeight: 19, color: semantic.textSecondary },

  composer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm },
  input: {
    flex: 1,
    fontSize: 14,
    color: semantic.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#E0E6EC",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.green600, alignItems: "center", justifyContent: "center" },

  loading: { paddingVertical: 80, alignItems: "center", gap: 10 },
  center: { marginTop: spacing.md, padding: spacing.lg, alignItems: "center" },
});
