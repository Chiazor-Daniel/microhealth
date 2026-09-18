import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { semantic } from "@tokens";
import { font } from "@rn/theme";

import { Screen } from "@/ui/Screen";
import { MessagesPanel } from "@/patient/care/MessagesPanel";
import { ChevronLeftIcon } from "@/icons";

/**
 * Messages, reached directly.
 *
 * Messages is a tab on Care now — this route exists only so the places that
 * link straight to it still work: Profile's "Help & Support" and the agent's
 * "Message care team" action both mean *messages*, not "Care, on the messages
 * tab". The content is the same panel the tab renders, so there is nothing to
 * keep in step.
 */
export default function Messages() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/care"))}
          accessibilityLabel="Back"
          accessibilityRole="button"
          style={styles.back}
        >
          <ChevronLeftIcon size={22} color={semantic.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Messages</Text>
      </View>

      <MessagesPanel />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 36, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  back: { position: "absolute", left: -8, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, ...font(600), lineHeight: 25.5, letterSpacing: -0.02 * 17, color: semantic.textPrimary },
});
