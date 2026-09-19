import { Image, View, type ImageStyle, type StyleProp } from "react-native";

/**
 * The MicroHealth logo — the native twin of the web component.
 *
 * The real artwork, not a redrawing. Both platforms read the *same* files
 * from `src/assets/brand/`, reached here through the `@assets` alias, so a
 * logo can never differ between web and phone.
 *
 * Two things differ from web and both have to be handled explicitly:
 *
 * **React Native has no `width: auto`.** An `<Image>` given only a height
 * collapses to zero width, so the aspect ratio is written down here and the
 * width derived from it. `RATIO` must stay in step with the files; if an
 * asset is ever re-cut, these numbers are the thing that goes stale silently.
 *
 * **Metro needs literal `require` calls** — it resolves them at build time, so
 * a computed path would bundle nothing. Same constraint as the avatars.
 */

/** width / height of each lockup, measured from the files themselves. */
const RATIO = {
  horizontal: 1155 / 226, // ≈ 5.11
  stacked: 846 / 526, // ≈ 1.61
  mark: 669 / 687, // ≈ 0.97
} as const;

const SOURCE = {
  horizontal: require("@assets/brand/logo-horizontal.png"),
  stacked: require("@assets/brand/logo-stacked.png"),
  mark: require("@assets/brand/mark.png"),
} as const;

export function BrandLogo({
  variant = "horizontal",
  height = 30,
  onDark = false,
  style,
}: {
  variant?: keyof typeof SOURCE;
  /** Rendered height in points. The width follows the lockup's own aspect. */
  height?: number;
  /**
   * Seats the mark on a white tile, for use over a dark surface. A two-colour
   * logo cannot survive a dark ground: the teal cross sinks into a teal panel,
   * and the gap between cross and leaf is transparent rather than white.
   */
  onDark?: boolean;
  style?: StyleProp<ImageStyle>;
}) {
  const width = height * RATIO[variant];
  const image = (
    <Image
      source={SOURCE[variant]}
      style={[{ width, height }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="MicroHealth"
    />
  );

  if (!onDark) return image;

  /* Padding is proportional so the tile reads the same at any size. */
  const pad = height * 0.22;
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: height * 0.28,
        padding: pad,
        alignSelf: "flex-start",
      }}
    >
      {image}
    </View>
  );
}
