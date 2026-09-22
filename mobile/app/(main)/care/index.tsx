import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { colors, radii, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";
import { usePatientData } from "@app/hooks/usePatientData";

import { Screen } from "@/ui/Screen";
import { Reveal, TapScale } from "@/ui/motion";
import { SegmentedTabs } from "@/ui/SegmentedTabs";
import { AppointmentsPanel } from "@/patient/care/AppointmentsPanel";
import { PrescriptionsPanel } from "@/patient/care/PrescriptionsPanel";
import { LabsPanel } from "@/patient/care/LabsPanel";
import { MessagesPanel } from "@/patient/care/MessagesPanel";
import { SectionHeader } from "@/ui/SectionHeader";
import { AppointmentCard } from "@/ui/AppointmentCard";
import { MedicationCard } from "@/ui/MedicationCard";
import { LabResultCard } from "@/ui/LabResultCard";
import { ErrorState } from "@/ui/ErrorState";
import { RowSkeleton } from "@/ui/Skeleton";
import { OfflinePanel, StaleStrip } from "@/ui/OfflineNotice";
import { useIsOffline } from "@/lib/connectivity";
import { buttonPrimary, card, iconTile } from "@/ui/styles";
import { ChatIcon, ChevronRightIcon, MoreIcon } from "@/icons";

/**
 * The tabs are where you are going, not what is being filtered — each one
 * opens its own screen, which is why the sections below stay put.
 */
type CareTab = "all" | "appointments" | "prescriptions" | "labs" | "messages";

/**
 * The tabs switch what is *below* the bar; they do not go anywhere.
 *
 * They used to push a route each, which made picking a tab feel like leaving
 * the screen — you landed somewhere new with no obvious way back, and the
 * system back gesture undid a choice you had just made rather than navigating.
 * The Care screen now stays mounted and only its body changes.
 *
 * "All" leads because it is the answer to "show me my care" without the
 * patient having to know which drawer it lives in.
 */
const TABS: { value: CareTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "appointments", label: "Appointments" },
  { value: "prescriptions", label: "Prescriptions" },
  { value: "labs", label: "Labs" },
  { value: "messages", label: "Messages" },
];

const isCareTab = (v: string): v is CareTab => TABS.some((t) => t.value === v);

function formatApptDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function doctorName(appt: any) {
  const u = appt?.doctor?.user;
  return u ? `${u.firstName} ${u.lastName}` : undefined;
}

export default function Care() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { appointments, prescriptions, labs, notifications, loading, error, refresh } = usePatientData();

  /* Seeded once from `?tab=`, so a link from elsewhere — Home's "next
     appointment", a notification — can open Care *on* the right tab without
     that tab being a separate screen with its own history entry. */
  const [tab, setTab] = useState<CareTab>(isCareTab(params.tab ?? "") ? (params.tab as CareTab) : "all");

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "completed" && new Date(a.scheduledDate) >= now,
  );
  const shown = upcoming.length > 0 ? upcoming : appointments.filter((a) => a.status !== "cancelled");

  const offline = useIsOffline();
  const hasAny = appointments.length + prescriptions.length + labs.length + notifications.length > 0;

  if (loading && !hasAny) {
    return (
      <Screen>
        <View style={{ gap: spacing.sm }}>
          <RowSkeleton rows={2} />
          <RowSkeleton rows={2} />
        </View>
      </Screen>
    );
  }

  if (error && !hasAny) {
    return (
      <Screen>
        {offline ? <OfflinePanel onRetry={refresh} /> : <ErrorState message={error} onRetry={refresh} />}
      </Screen>
    );
  }

  return (
    <Screen>
      {error && hasAny ? <StaleStrip onRetry={refresh} /> : null}
      {/* Header — the title is the axis of the screen, so it centres */}
      <View style={styles.header}>
        <Text style={styles.title}>Care</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="More options" style={styles.headerAction}>
          <MoreIcon size={18} color={semantic.textSecondary} />
        </Pressable>
      </View>

      <View style={{ marginTop: spacing.blockGap }}>
        <SegmentedTabs options={TABS} value={tab} onChange={(v) => setTab(v as CareTab)} fill={false} />
      </View>

      {tab === "all" ? (
      <>
      {/* Appointments */}
      <Reveal index={0}>
      <Block>
        <SectionHeader title="Upcoming Appointments" actionLabel="View all" onAction={() => setTab("appointments")} />
        <View style={styles.rows}>
          {shown.length > 0 ? (
            shown.slice(0, 2).map((appt) => (
              <AppointmentCard
                key={appt.id}
                department={appt.department}
                specialty={appt.department}
                doctorName={doctorName(appt)}
                date={formatApptDate(appt.scheduledDate)}
                time={appt.scheduledTime?.slice(0, 5) ?? ""}
                status={appt.status}
                actionLabel="View Details"
                onAction={() => setTab("appointments")}
              />
            ))
          ) : (
            <View style={[card, styles.empty]}>
              <Text style={styles.emptyText}>Nothing booked yet.</Text>
              <Pressable onPress={() => router.push("/book")} accessibilityRole="button" style={{ marginTop: 14 }}>
                <LinearGradient {...linearGradient("buttonPrimary")} style={[buttonPrimary, styles.emptyAction]}>
                  <Text style={styles.emptyActionLabel}>Book an appointment</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </Block>
      </Reveal>

      {/* Prescriptions */}
      {prescriptions.length > 0 ? (
      <Reveal index={1}>
        <Block>
          <SectionHeader title="Prescriptions" actionLabel="View all" onAction={() => setTab("prescriptions")} />
          <View style={styles.rows}>
            {prescriptions.slice(0, 2).map((rx) => (
              <MedicationCard
                key={rx.id}
                name={rx.medicine}
                dosage={rx.dosage}
                duration={rx.duration}
                status={rx.status}
                refills={rx.refills}
                onClick={() => setTab("prescriptions")}
                onRefill={() => setTab("prescriptions")}
              />
            ))}
          </View>
        </Block>
      </Reveal>
      ) : null}

      {/* Recent labs */}
      {labs.length > 0 ? (
      <Reveal index={2}>
        <Block>
          <SectionHeader title="Recent Labs" actionLabel="View all" onAction={() => setTab("labs")} />
          <View style={styles.rows}>
            {labs.slice(0, 2).map((lab) => (
              <LabResultCard
                key={lab.id}
                testName={lab.testName}
                date={lab.resultNotes || ""}
                status={lab.status}
                result={lab.result}
                notes={lab.resultNotes}
              />
            ))}
          </View>
        </Block>
      </Reveal>
      ) : null}

      {/* Messages */}
      <Reveal index={3}>
      <Block>
        <SectionHeader title="Messages" actionLabel="View all" actionTo="/care/messages" />
        <Pressable
          onPress={() => setTab("messages")}
          accessibilityRole="button"
          style={[card, styles.messages]}
        >
          <LinearGradient {...linearGradient("tileTeal")} style={[iconTile, styles.messagesIcon]}>
            <ChatIcon size={19} color={colors.teal} />
          </LinearGradient>
          <View style={styles.messagesText}>
            <Text style={styles.messagesTitle}>Care team</Text>
            <Text style={styles.messagesMeta} numberOfLines={1}>
              {notifications.length > 0
                ? `${notifications.length} recent notification${notifications.length === 1 ? "" : "s"}`
                : "Chat with your doctors and nurses"}
            </Text>
          </View>
          {/* An unread count replaces the chevron — the row is worth opening
              for a reason, so it says how many. */}
          {notifications.length > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notifications.length}</Text>
            </View>
          ) : (
            <ChevronRightIcon size={16} color={semantic.textPrimary} />
          )}
        </Pressable>
      </Block>
      </Reveal>
      </>
      ) : tab === "appointments" ? (
        <AppointmentsPanel />
      ) : tab === "prescriptions" ? (
        <PrescriptionsPanel />
      ) : tab === "labs" ? (
        <LabsPanel />
      ) : (
        <MessagesPanel />
      )}
    </Screen>
  );
}

/** One block of the screen. Every block sits `space-y-5` below the last. */
function Block({ children }: { children: React.ReactNode }) {
  return <View style={{ marginTop: spacing.blockGap }}>{children}</View>;
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center" },

  header: { height: 36, alignItems: "center", justifyContent: "center" },
  /* The web heading is 22/600 on Tailwind's 1.5 line box. */
  title: { fontSize: 22, ...font(600), lineHeight: 33, letterSpacing: -0.02 * 22, color: semantic.textPrimary },
  headerAction: {
    position: "absolute",
    right: -4,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  rows: { gap: spacing.sm },

  empty: { padding: spacing.blockGap, alignItems: "center" },
  emptyText: { fontSize: 13, lineHeight: 19.5, color: semantic.textMuted },
  emptyAction: { paddingHorizontal: 20, paddingVertical: 10 },
  emptyActionLabel: { fontSize: 13, ...font(600), lineHeight: 19.5, color: colors.onGreen },

  messages: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: 14 },
  messagesIcon: { width: 40, height: 40 },
  messagesText: { flex: 1, minWidth: 0 },
  messagesTitle: { fontSize: 13.5, ...font(600), lineHeight: 20.25, color: semantic.textPrimary },
  messagesMeta: { fontSize: 12.5, lineHeight: 18.75, color: semantic.textSecondary, marginTop: 2 },

  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green600,
  },
  badgeText: { fontSize: 11, ...font(700), lineHeight: 16.5, color: colors.onGreen },
});
