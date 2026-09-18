import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { semantic, spacing } from "@tokens";
import { font } from "@rn/theme";

import { ChevronRightIcon } from "@/icons";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  /** The route the action opens. */
  actionTo?: string;
  right?: React.ReactNode;
}

/**
 * The heading that opens a block of a screen, with the one action that belongs
 * to it. Web reaches for `useNavigate` here; native pushes the same route.
 */
export function SectionHeader({ title, actionLabel, onAction, actionTo, right }: SectionHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right ??
        (actionLabel && (actionTo || onAction) ? (
          <Pressable
            onPress={() => (actionTo ? router.push(actionTo as any) : onAction?.())}
            accessibilityRole="button"
            style={styles.action}
          >
            <Text style={styles.actionLabel}>{actionLabel}</Text>
            {/* The chevron promises the action leaves this screen, so it is
                drawn only when there is a destination behind the label. */}
            {actionTo ? <ChevronRightIcon size={14} color={semantic.accent} /> : null}
          </Pressable>
        ) : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  /* `text-base font-semibold` — 16px on Tailwind's 1.5 line box. */
  title: { fontSize: 16, ...font(600), lineHeight: 24, color: semantic.textPrimary },
  action: { flexDirection: "row", alignItems: "center", gap: 2 },
  /* `text-[13px] font-medium` */
  actionLabel: { fontSize: 13, ...font(500), lineHeight: 19.5, color: semantic.accent },
});
