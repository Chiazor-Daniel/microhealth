import { forwardRef, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
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
  /** Kept for call-site compatibility. Unused — see below. */
  index?: number;
  /** Kept for call-site compatibility. Unused — see below. */
  distance?: number;
  /** Kept for call-site compatibility. Unused — see below. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Renders its children. No entrance animation.
 *
 * This used to fade-and-rise each item with a stagger by `index`, so a screen
 * assembled itself as a column of cards arriving in order. It is gone on
 * purpose: navigating to a screen should show the screen, not a performance.
 * The stagger meant every tab switch and every drill-in cost a beat before the
 * content was readable, and on a screen the patient opens twenty times a day
 * that beat is the app feeling slow rather than feeling polished.
 *
 * The props are kept so the ~20 call sites do not have to change, but nothing
 * reads them. Motion in this app is now limited to what answers a *touch* —
 * `TapScale` below, and the switching of a control's own state.
 *
 * A plain `View` rather than `Animated.View`: with no animated style there is
 * nothing for a Reanimated node to do, and leaving one in the tree would keep
 * every card subscribed to the UI thread for no reason.
 */
export function Reveal({ children, style }: RevealProps) {
  return <View style={style}>{children}</View>;
}

/**
 * Renders its children. No entrance animation.
 *
 * Was a fade for things appearing inside an existing screen. Removed with
 * `Reveal` and for the same reason — an arriving chat bubble is not worth a
 * transition, and the fade fired on every load of every list.
 */
export function SoftIn({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
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
