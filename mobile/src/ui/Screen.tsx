import { ScrollView, StyleSheet, type ScrollViewProps } from "react-native";
import type { RefObject } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "@tokens";
import { Atmosphere } from "./Atmosphere";
import { Reveal } from "./motion";
import { useNavClearance } from "./navClearance";

/**
 * The frame every patient screen sits in.
 *
 * Content scrolls *under* the floating nav — the bar is an elevated surface
 * laid over the page, not a row that steals height from it. So the scroll view
 * runs the full height and pays for the overlap with bottom padding instead.
 * The clearance lives here so no screen has to remember it.
 *
 * The page fades up as it mounts. That is the web build's behaviour on every
 * screen (`motion.div` with `initial={{ opacity: 0, y: 12 }}`), and it is what
 * makes a tab change read as a transition rather than a repaint. Screens that
 * want their cards to arrive in sequence wrap them in `Reveal index={n}`
 * individually — the two compose.
 */
export function Screen({
  children,
  contentContainerStyle,
  scrollRef,
  ...rest
}: ScrollViewProps & { children: React.ReactNode; scrollRef?: RefObject<ScrollView | null> }) {
  const insets = useSafeAreaInsets();
  const { height: navHeight } = useNavClearance();

  /* The nav's own height already includes the safe-area inset it pads itself
     by, so it is not added again here. Before the nav has measured (first
     frame) the token stands in, so content never starts flush to the edge. */
  const clearance = navHeight > 0 ? navHeight + spacing.xs : spacing.navClearance + insets.bottom;

  return (
    <Atmosphere>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12) + spacing.pageY,
            paddingBottom: clearance,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        {...rest}
      >
        <Reveal distance={8}>{children}</Reveal>
      </ScrollView>
    </Atmosphere>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.pageX },
});
