import { useEffect } from "react";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The Health Agent's living presence.
 *
 * The same calm teal orb — now with a face that works: it blinks, its eyes
 * follow the mood, its mouth changes shape, and the body sways and tilts.
 * Moods arrive from the conversation, not from a timer: the parent maps the
 * agent's state (thinking, reply priority) onto `mood`, and the face morphs.
 *
 * Moods:
 *   idle      resting, slow blink, faint sway
 *   thinking  eyes glance side to side, body lifts (the loader-with-a-face)
 *   happy     lifted eyes, open smile, warm bounce
 *   unsure    one eye narrowed, small tilt, flat mouth
 *   scared    small converged eyes, open mouth, quick tremor
 *   speaking  mouth opens and closes while a fresh reply lands
 */

export type OrbMood = "idle" | "thinking" | "happy" | "unsure" | "scared" | "speaking";

const MOUTH: Record<OrbMood, string> = {
  idle: "M39.5 57c2.4 2.2 5.4 3.2 8.5 3.2s6.1-1 8.5-3.2",
  thinking: "M41 57.5h13",
  happy: "M38 55.5c2 4.6 5.6 7 10 7s8-2.4 10-7c-3 1.2-6.4 1.8-10 1.8s-7-.6-10-1.8z",
  unsure: "M41 58.5c2.8-1.2 6-1.2 9 0",
  scared: "M43.5 55.5c0 3.4 2 5.5 4.5 5.5s4.5-2.1 4.5-5.5c0-2-2-3-4.5-3s-4.5 1-4.5 3z",
  speaking: "M43 55.5c0 3.4 2.2 5.5 5 5.5s5-2.1 5-5.5c0-2-2.2-3-5-3s-5 1-5 3z",
};

export function AgentOrb({ size = 92, mood = "idle" }: { size?: number; mood?: OrbMood }) {
  const blink = useSharedValue(1);
  const sway = useSharedValue(0);
  const tilt = useSharedValue(0);
  const lift = useSharedValue(1);
  const mouthMix = useSharedValue(0);
  const mouthMood = useSharedValue<OrbMood>("idle");
  const lookX = useSharedValue(0);
  const eyeNarrow = useSharedValue(0);

  /* Blink forever — the single cheapest "alive" signal. Faster when scared. */
  useEffect(() => {
    cancelAnimation(blink);
    const base = mood === "scared" ? 1400 : mood === "thinking" ? 2000 : 3200;
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: base }),
        withTiming(0.08, { duration: 90 }),
        withTiming(1, { duration: 140 }),
      ),
      -1,
      false,
    );
  }, [mood, blink]);

  /* Sway + tilt: calm drift at rest, energy with mood. */
  useEffect(() => {
    cancelAnimation(sway);
    cancelAnimation(tilt);
    const amp = mood === "happy" ? 5 : mood === "scared" ? 1.6 : 3;
    const dur = mood === "scared" ? 320 : mood === "happy" ? 900 : 1600;
    sway.value = withRepeat(
      withSequence(withTiming(amp, { duration: dur, easing: Easing.inOut(Easing.quad) }), withTiming(-amp, { duration: dur, easing: Easing.inOut(Easing.quad) })),
      -1,
      true,
    );
    tilt.value = withSpring(mood === "unsure" ? -7 : mood === "happy" ? 3 : 0, { damping: 12, stiffness: 120 });
  }, [mood, sway, tilt]);

  /* Lift: thinking rises, scared tightens, everything else settles. */
  useEffect(() => {
    cancelAnimation(lift);
    if (mood === "thinking") {
      lift.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 620, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else if (mood === "speaking") {
      lift.value = withRepeat(
        withSequence(
          withTiming(1.025, { duration: 260 }),
          withTiming(1, { duration: 260 }),
        ),
        6,
        false,
      );
    } else {
      lift.value = withSpring(mood === "scared" ? 0.97 : 1, { damping: 14, stiffness: 220 });
    }
  }, [mood, lift]);

  /* Thinking eyes trade glances; unsure narrows one eye. */
  useEffect(() => {
    cancelAnimation(lookX);
    if (mood === "thinking") {
      lookX.value = withRepeat(
        withSequence(withTiming(4, { duration: 700 }), withTiming(-4, { duration: 700 })),
        -1,
        true,
      );
    } else {
      lookX.value = withTiming(0, { duration: 300 });
    }
    eyeNarrow.value = withTiming(mood === "unsure" ? 1 : 0, { duration: 300 });
  }, [mood, lookX, eyeNarrow]);

  /* Mouth cross-fades between shapes — paths differ, so opacity does the morph. */
  const prevMouth = useSharedValue<string>(MOUTH.idle);
  useEffect(() => {
    prevMouth.value = MOUTH[mouthMood.value] ?? MOUTH.idle;
    mouthMood.value = mood;
    mouthMix.value = 0;
    mouthMix.value = withTiming(1, { duration: 280 });
  }, [mood, mouthMix, mouthMood, prevMouth]);

  const body = useAnimatedStyle(() => ({
    transform: [{ scale: lift.value }, { rotate: `${tilt.value}deg` }, { translateY: sway.value * 0.6 }],
  }));

  const leftEye = useAnimatedProps(() => {
    const narrow = eyeNarrow.value * 0.45;
    const scaredShrink = mouthMood.value === "scared" ? 0.72 : 1;
    const happyLift = mouthMood.value === "happy" ? -1.5 : 0;
    return {
      ry: 3.1 * blink.value * scaredShrink * (1 - narrow),
      cx: 39.5 + lookX.value,
      cy: 45 + happyLift + (mouthMood.value === "scared" ? 1 : 0),
    };
  });

  const rightEye = useAnimatedProps(() => {
    const scaredShrink = mouthMood.value === "scared" ? 0.72 : 1;
    const happyLift = mouthMood.value === "happy" ? -1.5 : 0;
    return {
      ry: 3.1 * blink.value * scaredShrink,
      cx: 56.5 + lookX.value,
      cy: 45 + happyLift + (mouthMood.value === "scared" ? 1 : 0),
    };
  });

  const mouthA = useAnimatedProps(() => ({ opacity: 1 - mouthMix.value, d: prevMouth.value }));
  const mouthB = useAnimatedProps(() => {
    const happy = mouthMood.value === "happy";
    return {
      opacity: mouthMix.value,
      d: MOUTH[mouthMood.value] ?? MOUTH.idle,
      fillOpacity: happy ? 0.35 : 0,
    };
  });

  return (
    <Animated.View style={body}>
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
          <LinearGradient id="mhOrbMirror" x1="0" y1="0" x2="1" y2="1">
            <Stop offset={0} stopColor="#FFFFFF" />
            <Stop offset={0.5} stopColor="#CFE3EA" />
            <Stop offset={1} stopColor="#8FB3C1" />
          </LinearGradient>
        </Defs>

        <Circle cx={48} cy={48} r={47} fill="url(#mhOrbAura)" />

        {/* White coat shoulders behind the body. */}
        <Path
          d="M14 78c0-10 8-17 18-19l16-3 16 3c10 2 18 9 18 19v6H14v-6z"
          fill="#FFFFFF"
          fillOpacity={0.95}
        />
        <Circle cx={48} cy={48} r={34} fill="url(#mhOrbBody)" />
        <Ellipse cx={39} cy={31} rx={15} ry={9} fill="#FFFFFF" fillOpacity={0.2} />

        {/* Coat collar V over the lower body. */}
        <Path
          d="M38 74l10 8 10-8"
          stroke="#FFFFFF"
          strokeOpacity={0.85}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Head mirror — the doctor read. Band seats it, disc catches light. */}
        <Path
          d="M20 26c7-9 17-14 28-14s21 5 28 14"
          stroke="#FFFFFF"
          strokeOpacity={0.4}
          strokeWidth={4.5}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={48} cy={14} r={11} fill="url(#mhOrbMirror)" />
        <Circle cx={48} cy={14} r={11} fill="none" stroke="#FFFFFF" strokeOpacity={0.65} strokeWidth={1.5} />
        <Circle cx={48} cy={14} r={4} fill="#08546C" />
        <Circle cx={45.5} cy={11.5} r={1.8} fill="#FFFFFF" fillOpacity={0.9} />

        <AnimatedEllipse animatedProps={leftEye} rx={3.4} fill="#032B35" fillOpacity={0.6} />
        <AnimatedEllipse animatedProps={rightEye} rx={3.4} fill="#032B35" fillOpacity={0.6} />
        <AnimatedPath
          animatedProps={mouthA}
          stroke="#032B35"
          strokeOpacity={0.6}
          strokeWidth={3.1}
          strokeLinecap="round"
          fill="none"
        />
        <AnimatedPath
          animatedProps={mouthB}
          stroke="#032B35"
          strokeOpacity={0.6}
          strokeWidth={3.1}
          strokeLinecap="round"
          fill="#032B35"
          fillOpacity={0}
        />
      </Svg>
    </Animated.View>
  );
}
