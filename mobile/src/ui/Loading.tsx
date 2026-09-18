import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * The list spinner.
 *
 * Web spins a `Loader2` glyph. React Native has its own indeterminate
 * indicator, which is the same affordance drawn by the platform, so the glyph
 * is not re-authored here.
 *
 * `#0F7D7A` is the colour the web build spins in. It is a shade off the teal
 * on the token ramp, and it is not worth inventing a token to hide the
 * difference — but it is the one value on this screen that a token does not
 * cover.
 */
export function Loading({ size = 32 }: { size?: number }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size={size > 20 ? "large" : "small"} color="#0F7D7A" />
    </View>
  );
}

const styles = StyleSheet.create({
  /* `py-20` — the spinner clears the header it replaces. */
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
});
