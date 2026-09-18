import { Image, Text, View, type ViewStyle } from "react-native";
import { colors, semantic } from "@tokens";
import { font } from "@rn/theme";
import { avatarFor, type AvatarKey, type AvatarVariant } from "@app/patient/lib/avatars";

/**
 * Metro needs literal `require` calls — it resolves these at build time, so the
 * paths cannot be assembled from a variable. Keeping them in one table means
 * the only thing that differs from the web build's Avatar is this object.
 */
const SRC: Record<AvatarKey, number> = {
  "man-1": require("@assets/avatars/man-1.jpg"),
  "man-2": require("@assets/avatars/man-2.jpg"),
  "man-3": require("@assets/avatars/man-3.jpg"),
  "man-4": require("@assets/avatars/man-4.jpg"),
  "woman-1": require("@assets/avatars/woman-1.jpg"),
  "woman-2": require("@assets/avatars/woman-2.jpg"),
  "woman-3": require("@assets/avatars/woman-3.jpg"),
  "woman-4": require("@assets/avatars/woman-4.jpg"),
};

interface AvatarProps {
  /** Something stable about the person — an id, an email, a full name. */
  seed?: string | null;
  /** Only when the person's gender is actually known. See `avatarFor`. */
  variant?: AvatarVariant;
  /** Full name, used for the initials fallback and the accessibility label. */
  name?: string;
  size?: number;
  style?: ViewStyle;
}

function initialsOf(name?: string) {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * A person's portrait.
 *
 * Falls back to their initials on a tinted disc rather than showing a stranger's
 * face — an unknown record getting someone else's photo is worse than no photo.
 * Both states are the same size and carry the same raised treatment, so a row
 * of avatars stays even when one of them has no portrait.
 */
export function Avatar({ seed, variant, name, size = 46, style }: AvatarProps) {
  const key = avatarFor(seed ?? name, variant);

  const frame: ViewStyle = {
    width: size,
    height: size,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green50,
    borderWidth: 1,
    borderColor: "rgba(196,224,233,0.9)",
  };

  if (!key) {
    return (
      <View style={[frame, style]} accessible={false}>
        <Text style={{ fontSize: size * 0.33, ...font(600), color: semantic.accentDeep }}>
          {initialsOf(name) || "?"}
        </Text>
      </View>
    );
  }

  return (
    <View style={[frame, { overflow: "hidden" }, style]} accessible={false}>
      <Image
        source={SRC[key]}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
        accessibilityLabel={name ? `${name}'s photo` : undefined}
      />
    </View>
  );
}
