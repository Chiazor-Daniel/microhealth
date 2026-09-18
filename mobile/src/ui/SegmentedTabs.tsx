import { Pressable, ScrollView, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, semantic, spacing } from "@tokens";
import { linearGradient, font } from "@rn/theme";
import { track, tabActive } from "./styles";

interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Stretch to fill the width. Off when the labels are long enough to scroll. */
  fill?: boolean;
}

/**
 * Segmented switch: recessed track, solid green capsule for the active tab.
 * The green fill — not a raised white thumb — is what marks selection, so the
 * eye reads it at a glance the way the design system specifies.
 *
 * The strip fits its labels rather than truncating them: a long set
 * ("Appointments, Prescriptions, Labs, Messages") scrolls instead of becoming
 * "Appoint…". Short sets stretch to fill the width instead.
 */
export function SegmentedTabs<T extends string>({ options, value, onChange, fill = false }: SegmentedTabsProps<T>) {
  const content = options.map((opt) => {
    const active = value === opt.value;

    const label = (
      <Text
        numberOfLines={1}
        style={{
          fontSize: 11.5,
          /* The web tab's label inherits a 1.5 line-height; without matching it
             the whole switch renders ~4px shorter than the web build's. */
          lineHeight: 17,
          ...font(active ? 600 : 500),
          color: active ? colors.onGreen : semantic.textSecondary,
        }}
      >
        {opt.label}
      </Text>
    );

    if (active) {
      return (
        <Pressable key={opt.value} onPress={() => onChange(opt.value)} style={fill ? { flex: 1 } : undefined}>
          <LinearGradient
            {...linearGradient("tabActive")}
            style={[tabActive, { paddingHorizontal: 10, paddingVertical: 8, alignItems: "center" }]}
          >
            {label}
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <Pressable
        key={opt.value}
        onPress={() => onChange(opt.value)}
        style={[{ paddingHorizontal: 10, paddingVertical: 8, alignItems: "center" }, fill ? { flex: 1 } : undefined]}
      >
        {label}
      </Pressable>
    );
  });

  const rail = (
    <LinearGradient
      colors={[gradients.tile.colors[1], gradients.tile.colors[0]]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[track, fill ? undefined : { alignSelf: "flex-start" }]}
    >
      {content}
    </LinearGradient>
  );

  /* Not filling means the labels can outgrow the width — let them scroll. */
  if (fill) return rail;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.xs }}>
      {rail}
    </ScrollView>
  );
}
