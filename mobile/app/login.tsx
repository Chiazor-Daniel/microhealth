import { useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { colors } from "@tokens";
import { useAuth } from "@app/hooks/useAuth";

import { Atmosphere } from "@/ui/Atmosphere";
import { AuthShell, AuthField, AuthButton, AuthSwitch, DemoHint, AuthError } from "@/ui/auth";

const DEMO = { email: "ada.patient@example.com", password: "patient123" };

/**
 * Patient sign-in.
 *
 * Email and password, the same credentials the backend already issues. A
 * patient who has just signed up comes back here only if they signed out.
 */
export default function Login() {
  const { isAuthenticated, login, loading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});

  if (loading) {
    return (
      <Atmosphere style={{ alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.green600} />
      </Atmosphere>
    );
  }

  if (isAuthenticated) return <Redirect href={(params.from as any) || "/home"} />;

  const submit = async () => {
    if (busy) return;

    /* Checked here rather than only on the server so the mistake is pointed at,
       instead of coming back as one line under the form. */
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Enter your email address";
    setFieldError(next);
    if (Object.keys(next).length || !password) {
      if (!password) setFieldError({ ...next, password: "Enter your password" });
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      /* The API says "Invalid credentials" for both a wrong password and an
         unknown address, which is right for security and unhelpful on screen.
         The form keeps that wording but puts it where the problem is. */
      const message = String(e?.message ?? "");
      setError(/invalid/i.test(message) ? "That email and password don't match an account." : message || "Couldn't sign you in. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your health at a glance.">
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        error={fieldError.email}
        returnKeyType="next"
      />
      <AuthField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secure
        autoComplete="password"
        error={fieldError.password}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error ? <AuthError message={error} /> : null}

      <AuthButton label="Sign in" onPress={submit} busy={busy} />

      <DemoHint
        onUse={() => {
          setEmail(DEMO.email);
          setPassword(DEMO.password);
          setError(null);
          setFieldError({});
        }}
      />

      <AuthSwitch prompt="New here?" action="Create an account" onPress={() => router.push("/register")} />
    </AuthShell>
  );
}
