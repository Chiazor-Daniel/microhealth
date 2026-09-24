import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, semantic, spacing } from "@tokens";
import { font, linearGradient, text } from "@rn/theme";

import { Atmosphere } from "./Atmosphere";
import { BrandLogo } from "./BrandLogo";
import { WifiOffIcon } from "@/icons";
import { useIsOffline } from "@/lib/connectivity";

/**
 * The chrome shared by sign-in and sign-up.
 *
 * Both screens are the same shape — brand, a line explaining what you are
 * about to do, a small form, one primary action — so they are built from one
 * set of parts. Anything that differs lives in the screen, not here.
 *
 * The keyboard is avoided here too. These are the first forms a new patient
 * meets, and a field hidden behind the keyboard is a bad first impression.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Atmosphere>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandLogo variant="horizontal" height={44} style={styles.brand} />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.form}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Atmosphere>
  );
}

/** A labelled input with an inline error, so mistakes point at the field. */
export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secure = false,
  keyboardType = "default",
  autoComplete,
  onSubmitEditing,
  returnKeyType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: "email" | "password" | "name" | "given-name" | "family-name" | "off";
  onSubmitEditing?: () => void;
  returnKeyType?: "next" | "go" | "done";
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={semantic.textMuted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        accessibilityLabel={label}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
        ]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

/** The one primary action on an auth screen. */
export function AuthButton({
  label,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const off = busy || disabled;

  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button" style={{ marginTop: spacing.xs }}>
      <LinearGradient {...linearGradient("buttonPrimary")} style={[styles.button, { opacity: off ? 0.55 : 1 }]}>
        {busy ? <ActivityIndicator color={colors.onGreen} /> : <Text style={styles.buttonLabel}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

/**
 * A form-level failure — a wrong password, a server that isn't there.
 *
 * Distinct from a field error, which points at one input. This one belongs to
 * the whole attempt, so it sits above the button rather than under a field.
 *
 * A dead connection is not a red event: when the phone is offline the box
 * goes slate and says so, with the retry left to the button below it.
 */
export function AuthError({ message }: { message: string }) {
  const offline = useIsOffline();
  if (offline) {
    return (
      <View style={styles.offline} accessibilityRole="alert">
        <WifiOffIcon size={15} color={semantic.textSecondary} />
        <Text style={styles.offlineText}>You're offline. Check your connection and try again.</Text>
      </View>
    );
  }
  return (
    <View style={styles.alert} accessibilityRole="alert">
      <Text style={styles.alertText}>{message}</Text>
    </View>
  );
}

/**
 * Demo quick-fills — one tap per test account.
 *
 * Demo builds get handed around, and typing five credentials to compare
 * Individual vs Family is how a reviewer gives up on the second account.
 * Each chip fills its login; the list is data, so adding the next demo
 * account is one line in the screen, not a new component.
 */
export const DEMO_ACCOUNTS = [
  { label: "Ada", detail: "Individual + household", email: "ada.patient@example.com", password: "patient123" },
  { label: "Kola", detail: "Individual only", email: "individual.demo@example.com", password: "demo1234" },
  { label: "Femi (Dad)", detail: "Family household", email: "dad.demo@example.com", password: "demo1234" },
  { label: "Ngozi (Mum)", detail: "Family member", email: "mum.demo@example.com", password: "demo1234" },
  { label: "Tunde (Child)", detail: "Family member", email: "child.demo@example.com", password: "demo1234" },
] as const;

export function DemoHint({ onUse }: { onUse: (email: string, password: string) => void }) {
  return (
    <View style={styles.demoBox}>
      <Text style={styles.demoTitle}>Demo accounts — tap to fill</Text>
      {DEMO_ACCOUNTS.map((a) => (
        <Pressable
          key={a.email}
          onPress={() => onUse(a.email, a.password)}
          style={styles.demoRow}
          accessibilityRole="button"
          accessibilityLabel={`Fill in ${a.label}'s account`}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.demoName}>{a.label}</Text>
            <Text style={styles.demoBody}>{a.detail}</Text>
          </View>
          <Text style={styles.demoAction}>Fill</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** The "don't have an account?" line under the form. */
export function AuthSwitch({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchPrompt}>{prompt} </Text>
      <Pressable onPress={onPress} accessibilityRole="button">
        <Text style={styles.switchAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.pageX },
  brand: { alignSelf: "center", marginBottom: spacing.xs },
  title: { fontSize: 24, ...font(700), lineHeight: 32, letterSpacing: -0.02 * 24, color: semantic.textPrimary, textAlign: "center", marginTop: spacing.md },
  subtitle: { fontSize: 14, lineHeight: 21, color: semantic.textSecondary, textAlign: "center", marginTop: 6 },

  form: { marginTop: spacing.lg },
  field: { marginBottom: spacing.sm },
  label: { fontSize: 13, ...font(500), lineHeight: 18, color: semantic.textSecondary, marginBottom: 6 },
  input: {
    fontSize: 15,
    lineHeight: 21,
    color: semantic.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: "#E0E6EC",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputFocused: { borderColor: colors.green400 },
  inputError: { borderColor: colors.error },
  fieldError: { fontSize: 12, lineHeight: 17, color: colors.error, marginTop: 5 },

  button: { paddingVertical: 15, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  buttonLabel: { fontSize: 15, ...font(600), lineHeight: 21, color: colors.onGreen },

  footer: { marginTop: spacing.lg },

  alert: {
    marginBottom: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    backgroundColor: colors.errorSoft,
  },
  alertText: { fontSize: 13, lineHeight: 19, color: "#991B1B" },

  offline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: "rgba(203,213,225,0.7)",
    backgroundColor: "#F4F7F9",
  },
  offlineText: { flex: 1, fontSize: 13, lineHeight: 19, color: semantic.textSecondary },

  demoBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(133,192,206,0.65)",
    backgroundColor: colors.green50,
    gap: 2,
  },
  demoTitle: { fontSize: 12, ...font(600), lineHeight: 17, color: semantic.accentDeep, marginBottom: 4 },
  demoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7 },
  demoName: { fontSize: 13.5, ...font(600), lineHeight: 19, color: semantic.textPrimary },
  demoBody: { fontSize: 12, lineHeight: 16, color: semantic.textSecondary },
  demoAction: { fontSize: 12.5, ...font(700), lineHeight: 17, color: semantic.accentDeep },

  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchPrompt: { ...text.secondary, color: semantic.textSecondary },
  switchAction: { ...text.secondary, ...font(600), color: semantic.accentDeep },
});
