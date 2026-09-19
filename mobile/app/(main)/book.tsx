import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, radii, semantic, spacing } from "@tokens";
import { linearGradient, text, font } from "@rn/theme";
import { appointmentService } from "@app/services/appointment.service";
import { patientService } from "@app/services/patient.service";
import { staffService } from "@app/services/staff.service";
import { useAuth } from "@app/hooks/useAuth";
import { usePatientData } from "@app/hooks/usePatientData";

import { Screen } from "@/ui/Screen";
import { card, iconGreen, iconTile, iconTileBorder, washCard } from "@/ui/styles";
import { AlertIcon, CheckCircleIcon } from "@/icons";

const services = ["General Practice", "Antenatal Care", "Lab Tests", "Cardiology", "Dental"];
const units = ["MicroHealth Lekki", "MicroHealth Victoria Island", "MicroHealth Ikeja"];
const times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
const steps = ["Service", "Unit", "Date & Time", "Confirm"];

export default function BookAppointment() {
  const { user } = useAuth();
  const { refresh } = usePatientData();
  const patientId = user?.profile?.id;
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({ service: "", unit: "", date: "", time: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      setError("Patient profile not loaded. Please log in again.");
      return;
    }
    setLoading(true);
    setError("");
    /* The clinician directory is a convenience — if it's unavailable we still
       let the patient book (the backend assigns a doctor). */
    Promise.allSettled([patientService.getById(patientId), staffService.available()])
      .then(([patientRes, staffRes]) => {
        if (staffRes.status === "fulfilled") setStaff(staffRes.value);
        if (patientRes.status === "rejected") setError(patientRes.reason?.message || "Could not load booking data");
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  const confirmBooking = async () => {
    if (!patientId) return;
    setSubmitting(true);
    setError("");
    try {
      const doctor =
        staff.find((s) => s.department?.toLowerCase().includes(selected.service.split(" ")[0].toLowerCase())) || staff[0];
      const dateObj = selected.date ? new Date(selected.date) : new Date();
      await appointmentService.create({
        patientId,
        doctorId: doctor?.id,
        department: selected.service,
        scheduledDate: dateObj.toISOString().split("T")[0],
        scheduledTime: selected.time || "10:00",
        notes: selected.unit,
      });
      await refresh();
      Alert.alert("Appointment booked", "Your appointment has been scheduled", [
        { text: "OK", onPress: () => router.replace("/care?tab=appointments") },
      ]);
    } catch (err: any) {
      setError(err?.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  /* The web asks for confirmation in a dialog; Alert is native's own dialog,
     so the question and its two answers stay the same. */
  const handleConfirm = () => {
    const dateLabel = selected.date
      ? new Date(selected.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "the selected date";
    Alert.alert(
      "Confirm Booking?",
      `Book ${selected.service} at ${selected.unit} on ${dateLabel} at ${selected.time}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Book Now", onPress: confirmBooking },
      ],
    );
  };

  const patientName = user ? `${user.firstName} ${user.lastName}` : "Loading...";

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
      value: d.toISOString().split("T")[0],
    };
  });

  /* Three chips per row, as the web's `grid-cols-3` does. */
  const chipWidth = (width - spacing.pageX * 2 - spacing.xs * 2) / 3;

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green600} />
        </View>
      </Screen>
    );
  }

  const canContinue =
    (step === 1 && !!selected.service) || (step === 2 && !!selected.unit) || (step === 3 && !!selected.date && !!selected.time);

  return (
    <Screen>
      <Text style={styles.title}>Book Appointment</Text>

      {/* Stepper */}
      <View style={styles.stepper}>
        {steps.map((s, i) => {
          const done = i + 1 < step;
          const current = i + 1 === step;
          const tint = current ? semantic.accentDeep : done ? semantic.textSecondary : semantic.textMuted;
          return (
            <View key={s} style={styles.stepWrap}>
              <View style={styles.step}>
                {done || current ? (
                  <LinearGradient {...linearGradient("iconGreen")} style={[iconGreen, { width: 32, height: 32 }]}>
                    {done ? (
                      <CheckCircleIcon size={14} color={colors.onGreen} strokeWidth={2.6} />
                    ) : (
                      <Text style={styles.stepNumber}>{i + 1}</Text>
                    )}
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    {...linearGradient("tileSlate")}
                    style={[iconTile, { width: 32, height: 32, borderColor: iconTileBorder.slate }]}
                  >
                    <Text style={[styles.stepNumber, { color: semantic.textMuted }]}>{i + 1}</Text>
                  </LinearGradient>
                )}
                <Text style={[styles.stepLabel, { color: tint, ...font(current ? 700 : 500) }]} numberOfLines={1}>
                  {s}
                </Text>
              </View>
              {i < steps.length - 1 ? (
                <View style={[styles.stepBar, { backgroundColor: done ? colors.green300 : colors.hairline }]} />
              ) : null}
            </View>
          );
        })}
      </View>

      {error ? (
        <LinearGradient
          colors={["#FFFCF3", "#FEF3C7"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.errorBanner}
        >
          <AlertIcon size={14} color="#B45309" />
          <Text style={styles.errorText}>{error}</Text>
        </LinearGradient>
      ) : null}

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Service</Text>
          {services.map((s) => (
            <OptionButton
              key={s}
              label={s}
              isSelected={selected.service === s}
              onSelect={() => setSelected((p) => ({ ...p, service: s }))}
            />
          ))}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Unit</Text>
          {units.map((u) => (
            <OptionButton
              key={u}
              label={u}
              isSelected={selected.unit === u}
              onSelect={() => setSelected((p) => ({ ...p, unit: u }))}
            />
          ))}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.section, { gap: spacing.md }]}>
          <Text style={styles.sectionTitle}>Select Date &amp; Time</Text>
          <View style={styles.chipGrid}>
            {next7Days.map((d) => (
              <ChipButton
                key={d.value}
                label={d.label}
                width={chipWidth}
                isSelected={selected.date === d.value}
                onSelect={() => setSelected((p) => ({ ...p, date: d.value }))}
              />
            ))}
          </View>

          <Text style={styles.subheading}>Available slots</Text>
          <View style={styles.chipGrid}>
            {times.map((t) => (
              <ChipButton
                key={t}
                label={t}
                width={chipWidth}
                isSelected={selected.time === t}
                onSelect={() => setSelected((p) => ({ ...p, time: t }))}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={[styles.section, { gap: spacing.md }]}>
          <Text style={styles.sectionTitle}>Confirm Booking</Text>

          <View style={[card, { overflow: "hidden" }]}>
            <LinearGradient
              {...linearGradient("greenCard")}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={{ padding: spacing.md }}
            >
              <Text style={styles.confirmService}>{selected.service || "General Practice"}</Text>
              <Text style={styles.confirmUnit}>{selected.unit || "No unit selected"}</Text>
            </LinearGradient>
            <View style={{ padding: spacing.md, gap: spacing.sm }}>
              {[
                [
                  "Date",
                  selected.date
                    ? new Date(selected.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                    : "—",
                ],
                ["Time", selected.time || "—"],
                ["Patient", patientName],
                ["Reference", "APT-" + Math.floor(1000 + Math.random() * 9000)],
              ].map(([k, v]) => (
                <View key={k} style={styles.summaryRow}>
                  <Text style={text.body}>{k}</Text>
                  <Text style={styles.summaryValue}>{v}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable onPress={handleConfirm} disabled={submitting}>
            <LinearGradient {...linearGradient("buttonPrimary")} style={styles.primaryButton}>
              {submitting ? (
                <ActivityIndicator color={colors.onGreen} />
              ) : (
                <Text style={styles.primaryLabel}>Confirm Booking</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.navRow}>
        {step > 1 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} style={styles.secondaryButton}>
            <Text style={styles.secondaryLabel}>← Back</Text>
          </Pressable>
        ) : null}
        {step < 4 ? (
          <Pressable onPress={() => setStep((s) => s + 1)} disabled={!canContinue} style={{ flex: 1 }}>
            <LinearGradient
              {...linearGradient("buttonPrimary")}
              style={[styles.primaryButton, { opacity: canContinue ? 1 : 0.45 }]}
            >
              <Text style={styles.primaryLabel}>Continue →</Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

/** A selectable option card — raised surface, mint + green when chosen. */
function OptionButton({ label, isSelected, onSelect }: { label: string; isSelected: boolean; onSelect: () => void }) {
  const inner = (
    <>
      <Text style={styles.optionLabel}>{label}</Text>
      {isSelected ? <CheckCircleIcon size={18} color={colors.green600} /> : null}
    </>
  );

  if (isSelected) {
    return (
      <Pressable onPress={onSelect}>
        <LinearGradient {...linearGradient("mint")} style={[washCard, styles.option, { borderColor: "rgba(133,192,206,0.8)" }]}>
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onSelect} style={[card, styles.option]}>
      {inner}
    </Pressable>
  );
}

/** A compact pick chip for dates and time slots. */
function ChipButton({
  label,
  width,
  isSelected,
  onSelect,
}: {
  label: string;
  width: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  if (isSelected) {
    return (
      <Pressable onPress={onSelect} style={{ width }}>
        <LinearGradient {...linearGradient("buttonPrimary")} style={styles.chip}>
          <Text style={[styles.chipLabel, { color: colors.onGreen }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onSelect} style={[styles.chip, styles.chipIdle, { width }]}>
      <Text style={styles.chipLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center" },
  title: { fontSize: 22, ...font(600), lineHeight: 33, letterSpacing: -0.02 * 22, color: semantic.textPrimary },

  stepper: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg },
  stepWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  step: { alignItems: "center", gap: 6, flex: 1 },
  stepNumber: { fontSize: 11.5, ...font(700), color: colors.onGreen },
  stepLabel: { fontSize: 10.5, lineHeight: 14, textAlign: "center" },
  stepBar: { flex: 1, height: 2, borderRadius: 999, marginHorizontal: 4, marginBottom: 20 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(250,227,160,0.85)",
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: { fontSize: 12.5, lineHeight: 19, color: "#B45309", flex: 1 },

  section: { marginTop: spacing.lg, gap: spacing.sm },
  sectionTitle: { fontSize: 15, ...font(600), lineHeight: 22, color: semantic.textPrimary },
  subheading: { fontSize: 13, ...font(600), lineHeight: 20, color: semantic.textSecondary, paddingTop: 4 },

  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md },
  optionLabel: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: { paddingVertical: 10, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  chipIdle: { backgroundColor: colors.surface, borderWidth: 1, borderColor: "rgba(133,192,206,0.65)" },
  chipLabel: { fontSize: 13, ...font(600), lineHeight: 19, color: semantic.accentDeep },

  confirmService: { fontSize: 14, ...font(600), lineHeight: 21, letterSpacing: -0.01 * 14, color: colors.onGreen },
  confirmUnit: { fontSize: 13, lineHeight: 20, color: colors.onGreenMuted, marginTop: 2 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  summaryValue: { fontSize: 14, lineHeight: 21, ...font(600), color: semantic.textPrimary, flexShrink: 1, textAlign: "right" },

  primaryButton: { paddingVertical: 13, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  primaryLabel: { fontSize: 14, ...font(600), lineHeight: 20, color: colors.onGreen },
  secondaryButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(133,192,206,0.65)",
  },
  secondaryLabel: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.accentDeep },
  navRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
});
