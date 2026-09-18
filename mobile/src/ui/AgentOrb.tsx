import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";

/**
 * The Health Agent's presence.
 *
 * A soft orb with a face, sitting in a pale mint aura — the agent reads as
 * someone rather than as a labelled feature. Drawn with local gradients only,
 * so it lifts into the native build unchanged.
 *
 * It breathes while the agent is thinking. That is doing real work: a cloud
 * reasoning model takes the better part of twenty seconds to answer, and a
 * still orb next to the word "Thinking…" reads as a hung app.
 */
export function AgentOrb({ size = 92, active = false }: { size?: number; active?: boolean }) {
  const lift = useSharedValue(1);

  useEffect(() => {
    if (active) {
      lift.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 620, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      /* Settle rather than snap — the agent calming down is part of the same
         gesture. */
      lift.value = withSpring(1, { damping: 14, stiffness: 220 });
    }
  }, [active, lift]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: lift.value }] }));

  return (
    <Animated.View style={animated}>
      <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
        <Defs>
          <RadialGradient id="mhOrbAura" cx="0.5" cy="0.5" r="0.5">
            <Stop offset={0.42} stopColor="#85C0CE" stopOpacity={0.55} />
            <Stop offset={0.72} stopColor="#85C0CE" stopOpacity={0.22} />
            <Stop offset={1} stopColor="#85C0CE" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="mhOrbBody" x1="0.3" y1="0.1" x2="0.72" y2="0.96">
            <Stop offset={0} stopColor="#4C9FB3" />
            <Stop offset={0.45} stopColor="#005F73" />
            <Stop offset={1} stopColor="#08546C" />
          </LinearGradient>
        </Defs>

        {/* Aura — seats the orb on the surface instead of pasting it on */}
        <Circle cx={48} cy={48} r={47} fill="url(#mhOrbAura)" />

        {/* Body, and the light catching its top edge */}
        <Circle cx={48} cy={48} r={34} fill="url(#mhOrbBody)" />
        <Ellipse cx={39} cy={31} rx={15} ry={9} fill="#FFFFFF" fillOpacity={0.2} />

        {/* Face */}
        <Circle cx={39.5} cy={45} r={3.1} fill="#032B35" fillOpacity={0.55} />
        <Circle cx={56.5} cy={45} r={3.1} fill="#032B35" fillOpacity={0.55} />
        <Path
          d="M39.5 56.5c2.4 3.4 5.4 5 8.5 5s6.1-1.6 8.5-5"
          stroke="#032B35"
          strokeOpacity={0.55}
          strokeWidth={3.1}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}
