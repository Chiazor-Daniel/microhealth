import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, radii, semantic, spacing } from "@tokens";
import { font, linearGradient } from "@rn/theme";

import { BrandMark } from "./BrandMark";

/**
 * What is on screen while the app boots.
 *
 * Two things have to finish before the first screen can be drawn: Inter has to
 * load, and the stored token has to be read so the app knows whether you are
 * signed in. That is short but not instant, and without this the app opens on
 * a flat colour that flickers into Home.
 *
 * It is the same brand mark the app uses everywhere, so launch reads as the
 * product starting rather than as a loading screen.
 */
export function Splash() {
  const mark = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    mark.value = withTiming(1, { duration: 520, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    /* A slow breath after the mark lands, so the screen is never completely
       still while it waits — motion is what says "working", not "stuck". */
    breathe.value = withDelay(
      520,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [mark, breathe]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: mark.value,
    transform: [{ scale: 0.92 + mark.value * 0.08 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.25 + breathe.value * 0.45 }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={markStyle}>
        <LinearGradient {...linearGradient("iconGreen")} style={styles.mark}>
          <BrandMark size={34} color={colors.onGreen} />
        </LinearGradient>
      </Animated.View>

      <Animated.Text style={[styles.name, markStyle]}>MicroHealth</Animated.Text>
      <Animated.Text style={[styles.tagline, markStyle]}>Your health, watched over</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  /* Sits behind the mark and breathes, so the wait has a pulse. */
  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: colors.green300,
  },
  mark: { width: 72, height: 72, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  name: {
    fontSize: 22,
    ...font(700),
    lineHeight: 30,
    letterSpacing: -0.02 * 22,
    color: semantic.textPrimary,
    marginTop: spacing.md,
  },
  tagline: { fontSize: 13, lineHeight: 19, color: semantic.textMuted, marginTop: 4 },
});
