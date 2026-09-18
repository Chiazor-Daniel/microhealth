import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, radii, semantic, spacing } from "@tokens";
import { linearGradient, text, font } from "@rn/theme";
import { AppointmentCard } from "./AppointmentCard";
import { MedicationCard } from "./MedicationCard";
import { LabResultCard } from "./LabResultCard";
import { Sparkline } from "./Sparkline";
import { card, tabular } from "./styles";
import {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  DropletIcon,
  HeartIcon,
  OxygenIcon,
  ThermometerIcon,
} from "@/icons";

/**
 * The agent's rich replies.
 *
 * The agent answers with structured elements rather than only prose, and this
 * renders them. Each `type` is one of a small fixed vocabulary the backend
 * emits — unknown types render nothing rather than guessing, which keeps a
 * server-side addition from breaking the screen.
 */

export interface GenUIElement {
  type: string;
  content?: string;
  data?: Record<string, any>;
  options?: { label: string; value: string; metadata?: Record<string, any> }[];
  actions?: { label: string; action: string; payload?: Record<string, any> }[];
}

/** A vital's status as the colour the design system gives it. */
function vitalStatusColor(status?: string) {
  switch (status) {
    case "normal":
      return colors.success;
    case "low":
      return colors.warning;
    case "high":
      return colors.error;
    case "attention":
      return "#EA580C";
    default:
      return semantic.textMuted;
  }
}

function vitalIcon(label?: string, color?: string) {
  const l = label ?? "";
  if (l.includes("Heart")) return <HeartIcon size={17} color={color} />;
  if (l.includes("Blood")) return <DropletIcon size={17} color={color} />;
  if (l.includes("SpO")) return <OxygenIcon size={17} color={color} />;
  if (l.includes("Temp")) return <ThermometerIcon size={17} color={color} />;
  return null;
}

export function GenUI({ elements, onAction }: { elements: GenUIElement[]; onAction?: (action: string, payload?: any) => void }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  if (!elements || elements.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
      {elements.map((el, i) => {
        switch (el.type) {
          case "text":
            return (
              <Text key={i} style={[text.body, { color: semantic.textSecondary }]}>
                {el.content}
              </Text>
            );

          case "vital_card": {
            const tone = vitalStatusColor(el.data?.status);
            return (
              <View key={i} style={[card, { padding: spacing.md }]}>
                <View style={styles.vitalHead}>
                  {vitalIcon(el.data?.label, tone)}
                  <Text style={styles.vitalLabel}>{el.data?.label}</Text>
                </View>
                <View style={styles.vitalValueRow}>
                  <Text style={[styles.vitalValue, tabular]}>{el.data?.value}</Text>
                  <Text style={styles.vitalUnit}>{el.data?.unit}</Text>
                </View>
                <Text style={[text.caption, { color: tone, marginTop: 4 }]}>{el.data?.subtext}</Text>
              </View>
            );
          }

          case "appointment_card":
            return (
              <AppointmentCard
                key={i}
                department={el.data?.department || "General Practice"}
                doctorName={el.data?.doctorName}
                date={el.data?.date}
                time={el.data?.time}
                status={el.data?.status || "confirmed"}
              />
            );

          case "appointment_selector":
            return (
              <View key={i} style={{ gap: spacing.xs }}>
                <Text style={[text.cardLabel, { color: semantic.textSecondary }]}>
                  {el.content || "Select an appointment:"}
                </Text>
                {el.options?.map((opt) => {
                  const on = selected === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        setSelected(opt.value);
                        onAction?.("select_appointment", opt);
                      }}
                      style={[
                        styles.option,
                        {
                          backgroundColor: on ? colors.green50 : colors.surface,
                          borderColor: on ? colors.green600 : semantic.border,
                        },
                      ]}
                    >
                      <View style={styles.optionLabel}>
                        <CalendarIcon size={15} color={colors.green600} />
                        <Text style={text.body} numberOfLines={2}>
                          {opt.label}
                        </Text>
                      </View>
                      {on ? <CheckIcon size={17} color={colors.green600} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            );

          case "medication_card":
            return (
              <MedicationCard
                key={i}
                name={el.data?.name || "Medication"}
                dosage={el.data?.dosage || ""}
                status={el.data?.status || "active"}
              />
            );

          case "lab_card":
            return (
              <LabResultCard
                key={i}
                testName={el.data?.testName || "Lab test"}
                date={el.data?.date || "—"}
                status={el.data?.status || "completed"}
                result={el.data?.result}
              />
            );

          case "triage_question":
            return (
              <View key={i} style={{ gap: spacing.xs }}>
                <Text style={[text.cardLabel, { color: semantic.textPrimary }]}>{el.content}</Text>
                <View style={styles.chipWrap}>
                  {el.options?.map((opt) => (
                    <Pressable key={opt.value} onPress={() => onAction?.("triage_answer", opt)} style={styles.triageChip}>
                      <Text style={[text.body, { color: semantic.textPrimary }]}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );

          case "confirmation":
            return (
              <View key={i} style={styles.confirmation}>
                <Text style={[text.cardLabel, { color: semantic.textPrimary }]}>{el.content}</Text>
                <View style={styles.chipWrap}>
                  {el.actions?.map((a) => (
                    <Pressable key={a.label} onPress={() => onAction?.(a.action, a.payload)}>
                      <LinearGradient {...linearGradient("buttonPrimary")} style={styles.confirmButton}>
                        <Text style={styles.confirmLabel}>{a.label}</Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              </View>
            );

          case "quick_actions":
            return (
              <View key={i} style={styles.chipWrap}>
                {el.actions?.map((a) => {
                  const danger = a.action === "call_emergency";
                  return (
                    <Pressable
                      key={a.label}
                      onPress={() => {
                        /* The two navigations are the agent's own shortcuts and
                           belong to the app; anything else is the caller's. */
                        if (a.action === "book_appointment") router.push("/book");
                        else if (a.action === "message_team") router.push("/care/messages");
                        else onAction?.(a.action, a.payload);
                      }}
                      style={[styles.quickAction, { backgroundColor: danger ? colors.error : colors.green600 }]}
                    >
                      {danger ? <AlertIcon size={13} color={colors.onGreen} /> : null}
                      <Text style={styles.quickActionLabel}>{a.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            );

          case "trend_chart": {
            const values: { label: string; value: number }[] = el.data?.values ?? [];
            return (
              <View key={i} style={[card, { padding: spacing.md }]}>
                <Text style={[text.caption, { color: semantic.textMuted }]}>{el.data?.title || "Trend"}</Text>
                {values.length ? (
                  <View style={{ marginTop: spacing.xs }}>
                    <Sparkline data={values.map((v) => v.value)} width={TREND_WIDTH} height={110} dot={false} fill={false} />
                    <View style={styles.axis}>
                      {values.map((v, j) => (
                        <Text key={j} style={styles.axisLabel} numberOfLines={1}>
                          {v.label}
                        </Text>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={[text.caption, { color: semantic.textMuted, marginTop: spacing.xs }]}>No trend data.</Text>
                )}
              </View>
            );
          }

          default:
            return null;
        }
      })}
    </View>
  );
}

/**
 * The chart is drawn inside a card inside a chat bubble that is 85% of a
 * screen that is already inset — so its width is fixed rather than measured,
 * which avoids a layout pass and keeps the axis labels aligned.
 */
const TREND_WIDTH = 240;

const styles = StyleSheet.create({
  vitalHead: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: 4 },
  vitalLabel: { fontSize: 12, ...font(500), color: semantic.textMuted },
  vitalValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  vitalValue: { fontSize: 24, ...font(700), lineHeight: 28, color: semantic.textPrimary },
  vitalUnit: { fontSize: 14, ...font(400), color: semantic.textSecondary },

  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  optionLabel: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  triageChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: semantic.border,
  },
  confirmation: {
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.green50,
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.19)",
    gap: spacing.sm,
  },
  confirmButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.card },
  confirmLabel: { fontSize: 14, ...font(600), color: colors.onGreen },

  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.card,
  },
  quickActionLabel: { fontSize: 12, ...font(600), color: colors.onGreen },

  axis: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  axisLabel: { fontSize: 9, color: semantic.textMuted, flex: 1, textAlign: "center" },
});
