import { forwardRef, useEffect, type ReactNode } from "react";
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { motion } from "@tokens";

/**
 * Shared motion primitives.
 *
 * The web build expresses all of this with `motion/react` — a fade-and-rise on
 * mount, a spring on tap. The native port had neither, so the two platforms
 * felt different in the hand even where they looked the same. These are the
 * native equivalents, kept in one place so the app moves to a single tune.
 */

/** The standard ease-out, as a Reanimated easing function. */
const STANDARD = Easing.bezier(...motion.easing.standard);

export interface RevealProps {
  children: ReactNode;
  /** Position in a stack. Each step adds a beat, so a column arrives in order. */
  index?: number;
  /** Distance travelled, in points. */
  distance?: number;
  /** Turns the entrance off for an item that should already be on screen. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fade-and-rise on mount.
 *
 * Stagger by passing the item's `index`: a screen of five cards reads as a
 * column assembling itself rather than one flat sheet appearing. The cap keeps
 * a long list — a chat, say — from taking seconds to finish arriving.
 *
 * Deliberately driven by an animated `transform`/`opacity` rather than
 * Reanimated's `entering` prop. `entering` makes the view `position: absolute`
 * while it plays — on web it can stay that way — which takes it *out of the
 * flow*: the parent collapses to nothing and the scroll view's bottom padding
 * stops being trailing space, so the last content can never be scrolled clear
 * of the floating nav. Transform and opacity are painted, not laid out, so the
 * element keeps its place the whole time.
 */
export function Reveal({ children, index = 0, distance = 12, disabled = false, style }: RevealProps) {
  /* Starts settled when disabled, so the effect below is the only path that
     ever animates. */
  const progress = useSharedValue(disabled ? 1 : 0);

  useEffect(() => {
    if (disabled) return;
    progress.value = withDelay(
      Math.min(index, 8) * 45,
      withTiming(1, { duration: motion.duration.slow, easing: STANDARD }),
    );
  }, [disabled, index, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/**
 * A softer arrival for something that appears inside an existing screen —
 * a chat bubble, a newly loaded row. No travel, just a fade, because a message
 * sliding in from off-axis reads as an error rather than as a reply.
 *
 * A fade alone still animates `opacity` rather than using `entering`, for the
 * same layout reason as `Reveal`.
 */
export function SoftIn({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: motion.duration.base, easing: STANDARD });
  }, [progress]);

  const animated = useAnimatedStyle(() => ({ opacity: progress.value }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/**
 * A pressable that gives under the finger.
 *
 * Native has no hover, so the press *is* the feedback — without it a card that
 * opens a screen feels like nothing happened until the next screen appears.
 * The scale is small on purpose: this is a card being pressed, not a button
 * being slammed.
 *
 * The caller's `style` lands on the *outer* view, because that is the element
 * the parent lays out. Putting it on the inner Pressable instead means a
 * `flex: 1` never reaches the row it is in, and the component silently sizes
 * to its content — which is how one card in a row ends up eating the width and
 * squeezing its neighbour to a sliver.
 */
export const TapScale = forwardRef<React.ComponentRef<typeof Pressable>, PressableProps & { scaleTo?: number; children: ReactNode }>(
  function TapScale({ scaleTo = 0.98, children, style, disabled, ...rest }, ref) {
    const scale = useSharedValue(1);

    const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
      <Animated.View style={[style, animated]}>
        <Pressable
          ref={ref}
          disabled={disabled}
          onPressIn={() => {
            scale.value = withTiming(scaleTo, { duration: motion.duration.quick, easing: STANDARD });
          }}
          onPressOut={() => {
            /* Springy on the way back, so a cancelled press settles rather
               than snapping. */
            scale.value = withSpring(1, { damping: 16, stiffness: 320 });
          }}
          style={styles.fill}
          {...rest}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  /* The pressable fills whatever box the outer view was given, so a card's own
     padding stays on the card rather than being eaten by the touch target. */
  fill: { flex: 1 },
});
