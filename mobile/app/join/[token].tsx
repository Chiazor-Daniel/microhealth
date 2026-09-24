import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radii, semantic, spacing } from "@tokens";
import { font } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";
import { familyGroupService } from "@app/services/family.service";

import { Screen } from "@/ui/Screen";
import { Avatar } from "@/ui/Avatar";
import { card } from "@/ui/styles";

/**
 * Invite-link landing: microhealth://join/<token> (or the web preview link).
 *
 * Shows the family name and offered role — nothing else — then routes:
 * signed in → join immediately; signed out → register carrying the token,
 * which joins right after the account exists.
 */
export default function Join() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [info, setInfo] = useState<{ familyName: string; role: string; used: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) {
      setFailed(true);
      return;
    }
    familyGroupService
      .resolveLink(token)
      .then(setInfo)
      .catch(() => setFailed(true));
  }, [token]);

  const join = async () => {
    if (!token || joining) return;
    setJoining(true);
    try {
      await familyGroupService.joinLink(token);
      router.replace("/family");
    } catch {
      setFailed(true);
    } finally {
      setJoining(false);
    }
  };

  if (loading || (!info && !failed)) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green600} />
        </View>
      </Screen>
    );
  }

  if (failed || !info) {
    return (
      <Screen>
        <View style={[card, styles.center]}>
          <Text style={styles.title}>Invite not found</Text>
          <Text style={styles.body}>This link is invalid or expired. Ask the family head for a fresh one.</Text>
        </View>
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return (
      <Screen>
        <View style={[card, styles.center]}>
          <Avatar seed={info.familyName} name={info.familyName} size={64} />
          <Text style={[styles.title, { marginTop: spacing.sm }]}>{info.familyName}</Text>
          <Text style={styles.body}>You've been invited to join as {info.role}. Create your account to join.</Text>
          <Pressable
            onPress={() => router.replace({ pathname: "/register", params: { inviteToken: token } })}
            style={styles.primary}
          >
            <Text style={styles.primaryLabel}>Accept invite</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[card, styles.center]}>
        <Avatar seed={info.familyName} name={info.familyName} size={64} />
        <Text style={[styles.title, { marginTop: spacing.sm }]}>{info.familyName}</Text>
        <Text style={styles.body}>Join as {info.role}?</Text>
        <Pressable onPress={join} disabled={joining} style={[styles.primary, { opacity: joining ? 0.6 : 1 }]}>
          <Text style={styles.primaryLabel}>{joining ? "Joining…" : "Join family"}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 80, alignItems: "center" },
  center: { marginTop: 40, padding: spacing.lg, alignItems: "center" },
  title: { fontSize: 19, ...font(700), lineHeight: 26, color: semantic.textPrimary, textAlign: "center" },
  body: { fontSize: 13.5, lineHeight: 20, color: semantic.textSecondary, textAlign: "center", marginTop: 6, marginBottom: spacing.md },
  primary: { paddingHorizontal: 26, paddingVertical: 13, borderRadius: radii.pill, backgroundColor: colors.green600 },
  primaryLabel: { fontSize: 14.5, ...font(600), color: colors.onGreen },
});
