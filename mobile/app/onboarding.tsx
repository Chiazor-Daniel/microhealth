import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, semantic, spacing } from "@tokens";
import { font, linearGradient } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";
import { setBandConnected } from "@/lib/band";

import { Atmosphere } from "@/ui/Atmosphere";
import { BrandMark } from "@/ui/BrandMark";
import { AgentOrb } from "@/ui/AgentOrb";
import { Screen } from "@/ui/Screen";
import { ChevronRightIcon, HeartIcon, SparkIcon, SpeakerIcon, WatchIcon } from "@/icons";

/**
 * What a new patient sees between signing up and arriving at Home.
 *
 * A brand-new account is empty — no vitals, no appointments — and an empty
 * Home screen explains nothing. These two steps exist to say what the app is
 * for and to offer the one piece of setup that actually matters. Both are
 * skippable: someone who just wants to look around should never be trapped in
 * a setup wizard.
 */
export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [connecting, setConnecting] = useState(false);

  const finish = () => router.replace("/home");

  /**
   * The wearable step is a stand-in.
   *
   * There is no device to pair with yet, so this sets the expectation and
   * pauses long enough to feel like something happened. It deliberately does
   * not invent data — a new account stays empty, which is the state the app
   * has to present well.
   */
  const connect = () => {
    setConnecting(true);
    /* Records the pairing before leaving, so the feed starts for this account
       and the patient does not have to connect a second time. */
    const id = user?.profile?.id;
    setTimeout(async () => {
      if (id) await setBandConnected(id, true);
      finish();
    }, 1400);
  };

  if (step === 0) {
    return <Welcome name={user?.firstName} onNext={() => setStep(1)} onSkip={finish} />;
  }

  return (
    <Wearable onConnect={connect} connecting={connecting} onSkip={finish} onBack={() => setStep(0)} />
  );
}

/* ------------------------------------------------------------------ */

function Welcome({ name, onNext, onSkip }: { name?: string; onNext: () => void; onSkip: () => void }) {
  const insets = useSafeAreaInsets();

  const points = [
    {
      Icon: HeartIcon,
      title: "Your vitals, as they happen",
      body: "Heart rate, blood pressure and oxygen, tracked over time rather than one number at a time.",
    },
    {
      Icon: SparkIcon,
      title: "An agent that watches for you",
      body: "It reads your trends and tells you when something is worth a look — in plain language.",
    },
    {
      Icon: SpeakerIcon,
      title: "Ask anything, any time",
      body: "Book a visit, check a prescription, or just ask what a reading means.",
    },
  ];

  return (
    <Atmosphere>
      <Screen contentContainerStyle={{ paddingTop: Math.max(insets.top, spacing.lg) }}>
        <View style={styles.hero}>
          <LinearGradient {...linearGradient("iconGreen")} style={styles.mark}>
            <BrandMark size={26} color={colors.onGreen} />
          </LinearGradient>
          <Text style={styles.heroTitle}>{name ? `Welcome, ${name}.` : "Welcome."}</Text>
          <Text style={styles.heroBody}>MicroHealth keeps an eye on your readings so nothing creeps up unnoticed.</Text>
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          {points.map(({ Icon, title, body }) => (
            <View key={title} style={styles.point}>
              <LinearGradient
                {...linearGradient("tile")}
                style={[styles.pointIcon, { borderColor: "rgba(198,233,211,0.9)" }]}
              >
                <Icon size={18} color={semantic.accentDeep} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{title}</Text>
                <Text style={styles.pointBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Pressable onPress={onNext} accessibilityRole="button">
            <LinearGradient {...linearGradient("buttonPrimary")} style={styles.primary}>
              <Text style={styles.primaryLabel}>Get started</Text>
              <ChevronRightIcon size={17} color={colors.onGreen} />
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onSkip} accessibilityRole="button" style={styles.skip}>
            <Text style={styles.skipLabel}>Skip for now</Text>
          </Pressable>
        </View>
      </Screen>
    </Atmosphere>
  );
}

/* ------------------------------------------------------------------ */

function Wearable({
  onConnect,
  connecting,
  onSkip,
  onBack,
}: {
  onConnect: () => void;
  connecting: boolean;
  onSkip: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Atmosphere>
      <Screen contentContainerStyle={{ paddingTop: Math.max(insets.top, spacing.lg) }}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.orbWrap}>
            <AgentOrb size={96} active={connecting} />
          </View>
          <Text style={styles.heroTitle}>Connect the MicroHealth Band</Text>
          <Text style={styles.heroBody}>
            The band measures in the background so you don't have to remember to. You can add one later from your
            profile.
          </Text>
        </View>

        <View style={styles.bandCard}>
          <LinearGradient
            {...linearGradient("tile")}
            style={[styles.bandIcon, { borderColor: "rgba(198,233,211,0.9)" }]}
          >
            <WatchIcon size={22} color={semantic.accentDeep} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.bandTitle}>MicroHealth Band</Text>
            <Text style={styles.bandBody}>
              {connecting ? "Looking for a band nearby…" : "Make sure it's charged and nearby."}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Pressable onPress={onConnect} disabled={connecting} accessibilityRole="button">
            <LinearGradient
              {...linearGradient("buttonPrimary")}
              style={[styles.primary, { opacity: connecting ? 0.6 : 1 }]}
            >
              <Text style={styles.primaryLabel}>{connecting ? "Connecting…" : "Connect band"}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onSkip} accessibilityRole="button" style={styles.skip}>
            <Text style={styles.skipLabel}>I'll do this later</Text>
          </Pressable>
        </View>
      </Screen>
    </Atmosphere>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginTop: spacing.lg },
  mark: { width: 52, height: 52, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  orbWrap: { transform: [{ scale: 0.95 }] },
  heroTitle: {
    fontSize: 23,
    ...font(700),
    lineHeight: 30,
    letterSpacing: -0.02 * 23,
    color: semantic.textPrimary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    color: semantic.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  point: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  pointIcon: { width: 38, height: 38, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  pointTitle: { fontSize: 14.5, ...font(600), lineHeight: 21, color: semantic.textPrimary },
  pointBody: { fontSize: 13, lineHeight: 19.5, color: semantic.textSecondary, marginTop: 2 },

  bandCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(226,236,231,0.9)",
    backgroundColor: colors.surface,
  },
  bandIcon: { width: 44, height: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  bandTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary },
  bandBody: { fontSize: 12.5, lineHeight: 19, color: semantic.textSecondary, marginTop: 1 },

  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
    borderRadius: radii.pill,
  },
  primaryLabel: { fontSize: 15, ...font(600), lineHeight: 21, color: colors.onGreen },
  skip: { alignItems: "center", paddingVertical: spacing.sm, marginTop: 4 },
  skipLabel: { fontSize: 13.5, ...font(500), lineHeight: 20, color: semantic.textSecondary },

  back: { alignSelf: "flex-start", paddingVertical: 6 },
  backLabel: { fontSize: 14, ...font(500), lineHeight: 21, color: semantic.accentDeep },
});
