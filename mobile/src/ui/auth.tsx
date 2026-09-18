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
import { BrandMark } from "./BrandMark";

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
          <LinearGradient {...linearGradient("iconGreen")} style={styles.mark}>
            <BrandMark size={28} color={colors.onGreen} />
          </LinearGradient>

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
 */
export function AuthError({ message }: { message: string }) {
  return (
    <View style={styles.alert} accessibilityRole="alert">
      <Text style={styles.alertText}>{message}</Text>
    </View>
  );
}

/**
 * Notes the credentials a reviewer can use.
 *
 * This is a demo build with a seeded patient, and hunting for the password of
 * an app you were just handed is a poor way to start. Deliberately plain, so
 * it reads as a note about this build rather than as part of the product.
 */
export function DemoHint({ onUse }: { onUse: () => void }) {
  return (
    <Pressable onPress={onUse} style={styles.demo} accessibilityRole="button" accessibilityLabel="Fill in the demo account">
      <Text style={styles.demoTitle}>Demo account</Text>
      <Text style={styles.demoBody}>ada.patient@example.com · patient123</Text>
      <Text style={styles.demoAction}>Tap to fill</Text>
    </Pressable>
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
  mark: { width: 56, height: 56, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", alignSelf: "center" },
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

  demo: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(133,192,206,0.65)",
    backgroundColor: colors.green50,
  },
  demoTitle: { fontSize: 12, ...font(600), lineHeight: 17, color: semantic.accentDeep },
  demoBody: { fontSize: 12.5, lineHeight: 18, color: semantic.textSecondary, marginTop: 2 },
  demoAction: { fontSize: 11.5, ...font(600), lineHeight: 17, color: semantic.accentDeep, marginTop: 4 },

  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchPrompt: { ...text.secondary, color: semantic.textSecondary },
  switchAction: { ...text.secondary, ...font(600), color: semantic.accentDeep },
});
