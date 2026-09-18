import { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors, semantic, spacing } from "@tokens";
import { font } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";

import { Atmosphere } from "@/ui/Atmosphere";
import { AuthShell, AuthField, AuthButton, AuthSwitch, AuthError } from "@/ui/auth";
import { Text } from "react-native";

const MIN_PASSWORD = 8;

/**
 * Create an account.
 *
 * Kept to the four things the account actually needs. Asking for a date of
 * birth, a diagnosis or an insurance number up front is how a health app loses
 * someone in the first thirty seconds — those belong in the profile, once the
 * person has seen a reason to care.
 */
export default function Register() {
  const { isAuthenticated, register, loading } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<{ firstName?: string; email?: string; password?: string }>({});

  if (loading) {
    return (
      <Atmosphere style={{ alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.green600} />
      </Atmosphere>
    );
  }

  if (isAuthenticated) return <Redirect href="/home" />;

  const submit = async () => {
    if (busy) return;

    const next: typeof fields = {};
    if (!firstName.trim()) next.firstName = "What should we call you?";
    if (!email.trim()) next.email = "Enter your email address";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "That doesn't look like an email address";
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters`;

    setFields(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setError(null);
    try {
      await register({ email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim() || undefined });
      /* Straight into onboarding — a new account is empty, and the app has to
         introduce itself before a blank Home screen makes sense. */
      router.replace("/onboarding");
    } catch (e: any) {
      const message = String(e?.message ?? "");
      setError(
        /exists/i.test(message)
          ? "There's already an account with that email. Try signing in instead."
          : message || "Couldn't create your account. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="A few details and you're in.">
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <AuthField
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Ada"
            autoComplete="given-name"
            error={fields.firstName}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AuthField
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Nwosu"
            autoComplete="family-name"
          />
        </View>
      </View>

      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        error={fields.email}
      />
      <AuthField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder={`At least ${MIN_PASSWORD} characters`}
        secure
        autoComplete="password"
        error={fields.password}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error ? <AuthError message={error} /> : null}

      <AuthButton label="Create account" onPress={submit} busy={busy} />

      <Text style={styles.terms}>
        Your health information stays private to you and the care team you choose.
      </Text>

      <AuthSwitch prompt="Already have an account?" action="Sign in" onPress={() => router.replace("/login")} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  terms: {
    fontSize: 12,
    lineHeight: 18,
    color: semantic.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
