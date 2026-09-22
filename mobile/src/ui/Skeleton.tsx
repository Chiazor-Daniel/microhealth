import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { colors, radii, spacing } from "@tokens";

/**
 * Skeleton loading blocks.
 *
 * What a screen shows while its data is on the way: the shape of the content
 * in soft mint-grey, with a light sweep passing through. The sweep is the
 * whole point — a static grey box reads as broken, a moving one reads as
 * loading.
 *
 * Shapes stay generic (block / circle / hero / tile / row) so every screen
 * composes its own skeleton from the same pieces instead of each inventing
 * grey boxes with different radii.
 */

function useShimmer(width: number) {
  const x = useSharedValue(-width);
  useEffect(() => {
    x.value = withRepeat(withTiming(width, { duration: 1300, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [width, x]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}

export function Block({
  width,
  height,
  radius = 8,
  style,
}: {
  width: number | string;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const w = typeof width === "number" ? width : 300;
  const sweep = useShimmer(w);
  return (
    <View style={[{ width, height, borderRadius: radius, backgroundColor: "#E6EEF2", overflow: "hidden" }, style]}>
      <Animated.View style={[{ width: w * 0.5, height: "100%" }, sweep]}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.75)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

export function Circle({ size = 44 }: { size?: number }) {
  return <Block width={size} height={size} radius={size / 2} />;
}

/** Score-ring hero: ring placeholder, two text lines. */
export function HeroSkeleton() {
  return (
    <View style={[styles.card]}>
      <Block width={120} height={16} />
      <View style={styles.heroRow}>
        <Block width={96} height={96} radius={48} />
        <View style={{ flex: 1, gap: 8 }}>
          <Block width="90%" height={14} />
          <Block width="70%" height={14} />
          <Block width="55%" height={12} />
        </View>
      </View>
    </View>
  );
}

/** Two-up vital tiles. */
export function TilePairSkeleton() {
  return (
    <View style={styles.tileRow}>
      {[0, 1].map((i) => (
        <View key={i} style={[styles.card, styles.tile]}>
          <Block width={96} height={14} />
          <View style={{ height: 10 }} />
          <Block width={64} height={26} radius={6} />
          <View style={{ height: 10 }} />
          <Block width="100%" height={44} radius={10} />
        </View>
      ))}
    </View>
  );
}

/** Stacked list rows (appointments, labs, notifications…). */
export function RowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.card, styles.row]}>
          <Circle size={44} />
          <View style={{ flex: 1, gap: 8 }}>
            <Block width="75%" height={14} />
            <Block width="50%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Profile header: avatar, name, id line. */
export function ProfileHeadSkeleton() {
  return (
    <View style={[styles.card, { alignItems: "center", paddingVertical: spacing.lg }]}>
      <Block width={84} height={84} radius={42} />
      <View style={{ height: 12 }} />
      <Block width={140} height={18} />
      <View style={{ height: 8 }} />
      <Block width={100} height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(226,236,231,0.9)",
    padding: spacing.md,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  tileRow: { flexDirection: "row", gap: spacing.sm },
  tile: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
