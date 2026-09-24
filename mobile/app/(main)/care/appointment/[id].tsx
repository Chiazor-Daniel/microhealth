import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radii, semantic, spacing } from "@tokens";
import { linearGradient, font, text } from "@rn/theme";
import { usePatientData } from "@app/hooks/usePatientData";

import { Screen } from "@/ui/Screen";
import { Avatar } from "@/ui/Avatar";
import { StatusBadge } from "@/ui/StatusBadge";
import { card, cardFeature, iconTile, iconTileBorder } from "@/ui/styles";
import { CalendarIcon, ChevronLeftIcon, VideoIcon } from "@/icons";

/**
 * One appointment, on its own screen.
 *
 * This is the case a separate screen is *for*: the patient has picked a
 * specific thing and wants to look at it. It shows that appointment and
 * nothing else — its own details, the clinician, and how to get hold of the
 * clinic — rather than repeating the list they just came from.
 *
 * Reached from the Appointments tab, and popped by the system back gesture,
 * which the (main) stack now provides.
 */

/** The web writes dates out in en-GB day-month-year order. */
const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function AppointmentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { appointments } = usePatientData();

  const appt = appointments.find((a) => a.id === id);

  /* Reached by a stale link, or the record was removed. Saying so beats an
     empty screen that looks broken. */
  if (!appt) {
    return (
      <Screen>
        <Header onBack={() => router.back()} />
        <View style={[card, styles.missing]}>
          <Text style={styles.missingTitle}>Appointment not found</Text>
          <Text style={styles.missingBody}>It may have been cancelled or rescheduled.</Text>
        </View>
      </Screen>
    );
  }

  const doctor = appt.doctor?.user;
  const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : null;
  const when = appt.scheduledDate ? LONG_DATE.format(new Date(appt.scheduledDate)) : "—";
  const at = appt.scheduledTime ? appt.scheduledTime.slice(0, 5) : null;

  return (
    <Screen>
      <Header onBack={() => router.back()} />

      {/* The appointment itself, as the one thing this screen is about */}
      <LinearGradient {...linearGradient("mint")} style={[cardFeature, styles.hero]}>
        <View style={styles.heroTop}>
          <LinearGradient
            {...linearGradient("tile")}
            style={[iconTile, { width: 44, height: 44, borderColor: iconTileBorder.green }]}
          >
            <CalendarIcon size={20} color={semantic.accentDeep} />
          </LinearGradient>
          <StatusBadge status={appt.status} variant="pill" />
        </View>

        <Text style={styles.heroTitle}>{appt.department || "General Practice"}</Text>
        <Text style={styles.heroWhen}>
          {when}
          {at ? ` · ${at}` : ""}
        </Text>
      </LinearGradient>

      {/* Who you are seeing */}
      {doctorName ? (
        <View style={[card, styles.section, styles.doctorRow]}>
          <Avatar seed={doctorName} name={doctorName} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.doctorMeta}>{appt.department || "General Practice"}</Text>
          </View>
        </View>
      ) : null}

      {/* What was recorded when it was booked */}
      <View style={[card, styles.section]}>
        <Detail label="Reference" value={appt.id.slice(0, 8).toUpperCase()} />
        {appt.notes ? <Detail label="Location" value={appt.notes} /> : null}
        <Detail label="Status" value={appt.status} last />
      </View>

      {/* Appointment time: join the visit room. */}
      {!["cancelled", "completed"].includes(appt.status) ? (
        <Pressable onPress={() => router.push(`/care/visit/${appt.id}`)} accessibilityRole="button" style={{ marginTop: spacing.sm }}>
          <LinearGradient {...linearGradient("buttonPrimary")} style={styles.join}>
            <VideoIcon size={17} color={colors.onGreen} />
            <Text style={styles.joinLabel}>Join visit</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </Screen>
  );
}

/**
 * The back control is a courtesy for people who look for one; the system back
 * gesture is what actually has to work, and does — this is a real stack entry.
 */
function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityLabel="Back"
        accessibilityRole="button"
        style={styles.back}
      >
        <ChevronLeftIcon size={22} color={semantic.textPrimary} />
      </Pressable>
      <Text style={styles.headerTitle}>Appointment</Text>
    </View>
  );
}

function Detail({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, last ? null : styles.detailDivider]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 36, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  back: { position: "absolute", left: -8, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, ...font(600), lineHeight: 25.5, letterSpacing: -0.02 * 17, color: semantic.textPrimary },

  hero: { marginTop: spacing.blockGap, padding: spacing.md },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroTitle: { fontSize: 20, ...font(600), lineHeight: 26, letterSpacing: -0.02 * 20, color: semantic.textPrimary, marginTop: spacing.sm },
  heroWhen: { fontSize: 13.5, lineHeight: 20, color: semantic.textSecondary, marginTop: 2 },

  section: { marginTop: spacing.sm, paddingHorizontal: spacing.md },
  doctorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  doctorName: { fontSize: 15, ...font(600), lineHeight: 22, color: semantic.textPrimary },
  doctorMeta: { fontSize: 12.5, lineHeight: 19, color: semantic.textSecondary, marginTop: 1 },

  detailRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md, paddingVertical: 13 },
  detailDivider: { borderBottomWidth: 1, borderBottomColor: colors.hairlineSoft },
  detailLabel: { ...text.body, color: semantic.textSecondary },
  detailValue: { ...text.body, ...font(600), color: semantic.textPrimary, flexShrink: 1, textAlign: "right" },

  missing: { marginTop: spacing.blockGap, padding: spacing.lg, alignItems: "center" },
  missingTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary },
  missingBody: { fontSize: 13, lineHeight: 19.5, color: semantic.textMuted, marginTop: 4, textAlign: "center" },

  join: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: radii.pill },
  joinLabel: { fontSize: 15, ...font(600), lineHeight: 21, color: colors.onGreen },
});
