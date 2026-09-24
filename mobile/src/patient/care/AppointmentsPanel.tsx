import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";
import { usePatientData } from "@app/hooks/usePatientData";

import { SegmentedTabs } from "@/ui/SegmentedTabs";
import { AppointmentCard } from "@/ui/AppointmentCard";
import { ErrorState } from "@/ui/ErrorState";
import { Loading } from "@/ui/Loading";
import { buttonPrimary, card, iconTile } from "@/ui/styles";
import { CalendarIcon } from "@/icons";

const tabs: { value: "upcoming" | "past"; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

/** The web writes the card's date out in en-GB day-month-year order. */
const CARD_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function AppointmentsPanel() {
  const router = useRouter();
  const { appointments, loading, error, refresh } = usePatientData();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = appointments.filter((a) => a.scheduledDate >= today && a.status !== "cancelled");
  const past = appointments.filter((a) => a.scheduledDate < today || a.status === "cancelled");
  const list = tab === "upcoming" ? upcoming : past;

  if (loading) {
    return (
      <>
        <Loading />
      </>
    );
  }

  if (error) {
    return (
      <>
        <ErrorState message={error} onRetry={refresh} />
      </>
    );
  }

  return (
    <>

      <View style={{ marginTop: spacing.blockGap }}>
        <SegmentedTabs options={tabs} value={tab} onChange={setTab} fill />
      </View>

      {list.length === 0 ? (
        <View style={[card, styles.empty]}>
          <LinearGradient {...linearGradient("tile")} style={[iconTile, { width: 52, height: 52 }]}>
            <CalendarIcon size={24} color={semantic.textSecondary} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No {tab} appointments</Text>
          <Text style={styles.emptyBody}>
            {tab === "upcoming" ? "Book a visit to get started" : "Past visits will appear here"}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: spacing.blockGap, gap: spacing.sm }}>
          {list.map((a) => (
            <AppointmentCard
              key={a.id}
              department={a.department}
              specialty={a.department}
              doctorName={a.doctor?.user ? `${a.doctor.user.firstName} ${a.doctor.user.lastName}` : undefined}
              date={CARD_DATE.format(new Date(a.scheduledDate))}
              time={a.scheduledTime?.slice(0, 5) ?? ""}
              status={a.status}
              actionLabel="View Details"
              /* The one place Care navigates: you are looking at a specific
                 appointment, which is what a separate screen is for. */
              onAction={() => router.push(`/care/appointment/${a.id}`)}
              secondaryActionLabel={tab === "upcoming" && !["cancelled", "completed"].includes(a.status) ? "Join visit" : undefined}
              onSecondaryAction={() => router.push(`/care/visit/${a.id}`)}
            />
          ))}
        </View>
      )}

      {/* The primary action lives at the foot of the list, where the eye ends */}
      {tab === "upcoming" ? (
        <Pressable onPress={() => router.push("/book")} accessibilityRole="button" style={{ marginTop: spacing.blockGap }}>
          <LinearGradient {...linearGradient("buttonPrimary")} style={[buttonPrimary, styles.book]}>
            <Text style={styles.bookLabel}>Book Appointment</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({

  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: spacing.lg, marginTop: spacing.blockGap },
  emptyTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary, marginTop: 14 },
  emptyBody: { fontSize: 13, lineHeight: 19.5, color: semantic.textMuted, marginTop: 4, textAlign: "center" },

  book: { alignItems: "center", paddingVertical: 14 },
  bookLabel: { fontSize: 14, ...font(600), lineHeight: 21, color: colors.onGreen },
});
