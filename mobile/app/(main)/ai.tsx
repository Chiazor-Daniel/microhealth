import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, semantic, spacing } from "@tokens";
import { linearGradient, text, font } from "@rn/theme";
import { useInsights } from "@app/patient/hooks/useInsights";
import { aiService, type Insight } from "@app/services/ai.service";

import { AgentOrb, type OrbMood } from "@/ui/AgentOrb";
import { InsightCard } from "@/ui/InsightCard";
import { GenUI, type GenUIElement } from "@/ui/GenUI";
import { Atmosphere } from "@/ui/Atmosphere";
import { SoftIn, TapScale } from "@/ui/motion";
import { card } from "@/ui/styles";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  SendIcon,
} from "@/icons";

interface Message {
  id: string;
  role: "agent" | "user";
  /** What goes on the wire to the backend. */
  text: string;
  /**
   * What the bubble shows, when the two differ.
   *
   * Tapping a card sends a machine-readable payload — `slot:{"doctorId":…}` —
   * because that is what the agent engine parses. Showing that back to the
   * patient as their own message is not a sentence anyone wrote.
   */
  display?: string;
  insight?: Insight;
}

/**
/* Hermes does not reliably expose `crypto.randomUUID`, and a message id only
   has to be unique within one mounted screen — so a counter is enough. */
let nextId = 0;
const newId = () => `m${++nextId}`;

export default function AI() {
  const router = useRouter();
  const { insights, refresh } = useInsights();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  /* The orb's face follows the conversation: thinking while the reply
     brews, speaking the moment it lands, then settling into the mood the
     reply carries (priority + type decide the feeling). */
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (speaking) {
      const t = setTimeout(() => setSpeaking(false), 2600);
      return () => clearTimeout(t);
    }
  }, [speaking]);
  const lastAgent = [...messages].reverse().find((m) => m.role === "agent");
  /* Floating dock: once the header orb scrolls off, a mini orb fades into
     the top-right corner (tap = back to top); at the top it fades away. */
  const dockProgress = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      dockProgress.value = withTiming(e.contentOffset.y > 220 ? 1 : 0, { duration: 220 });
    },
  });
  const dockStyle = useAnimatedStyle(() => ({
    opacity: dockProgress.value,
    transform: [{ scale: 0.6 + dockProgress.value * 0.4 }, { translateY: (1 - dockProgress.value) * -12 }],
  }));  const mood: OrbMood = typing
    ? "thinking"
    : speaking
      ? "speaking"
      : lastAgent?.insight?.priority === "urgent" || lastAgent?.insight?.type === "escalation_created"
        ? "scared"
        : lastAgent?.insight?.priority === "attention"
          ? "scared"
          : lastAgent?.insight?.priority === "watch"
            ? "unsure"
            : lastAgent
              ? "happy"
              : "idle";

  const send = useCallback(
    async (value: string, display?: string) => {
      setMessages((m) => [...m, { id: newId(), role: "user", text: value, display }]);
      setInput("");
      setTyping(true);

      /* The last few turns go up as context, so the agent reads the exchange
         rather than answering the newest line in isolation. */
      const history = messages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "Patient" : "Agent"}: ${m.display ?? m.text}`)
        .join("\n");

      try {
        const reply = await aiService.chat(value, history);
        setMessages((m) => [...m, { id: newId(), role: "agent", text: reply.message, insight: reply }]);
        setSpeaking(true);
        refresh();
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: newId(),
            role: "agent",
            text: "I'm having trouble reaching my reasoning engine right now, but I'm still here. You can try again or view your vitals and care details.",
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [messages, refresh],
  );

  const handleSend = () => {
    if (!input.trim() || typing) return;
    send(input.trim());
  };

  const handleGenUIAction = useCallback(
    async (action: string, payload?: any) => {
      if (action === "select_appointment" && payload?.metadata) {
        send(`slot:${JSON.stringify(payload.metadata)}`, `Book: ${payload.label}`);
      } else if (action === "triage_answer") {
        send(`Severity: ${payload?.value}`, payload?.label ?? `Severity: ${payload?.value}`);
      } else if (action === "confirm_medication" && payload?.logId) {
        try {
          const reply = await aiService.confirmMedication(payload.logId);
          setMessages((m) => [...m, { id: newId(), role: "agent", text: reply.message, insight: reply }]);
          setSpeaking(true);
          refresh();
        } catch {
          send(`confirm_med:${payload.logId}`, "I took it");
        }
      } else if (action === "message_team") {
        router.push("/care/messages");
      } else if (action === "book_appointment") {
        router.push("/book");
      } else if (action === "call_emergency") {
        Linking.openURL("tel:112");
      }
    },
    [router, send],
  );

  const topUnread = insights.find((i) => !i.isRead);

  return (
    /* The chat does not use <Screen>: that is a single scrolling column, and
       this screen is two regions — a conversation that scrolls and a composer
       that must not. The composer sits outside the scroll view, so it stays on
       the bottom edge no matter how long the reply is.
     *
     * KeyboardAvoidingView is the avoidance that works without a native module
     * — `react-native-keyboard-controller` would be tidier but is not in Expo
     * Go, and adding it would break the app the same way the Reanimated
     * version mismatch did.
     *
     * The behaviour differs by platform on purpose. iOS overlays the keyboard
     * on the window, so the view shrinks by `padding`. Android resizes the
     * window itself (softwareKeyboardLayoutMode is "resize" in app.json), so
     * the layout has already been adjusted and adding padding here would
     * double-count it — hence no behaviour there. */
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      /* No header on this screen, so there is nothing above the composer for
         the keyboard to be measured against. */
      keyboardVerticalOffset={0}
    >
    <Atmosphere>
      <Animated.ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12) + spacing.pageY,
          paddingBottom: spacing.lg,
          paddingHorizontal: spacing.pageX,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header — scrolls with the conversation */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/home")} accessibilityLabel="Back to home" style={styles.back}>
          <ChevronLeftIcon size={22} color={semantic.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Health Agent</Text>
        <Text style={styles.subtitle}>Always here for you</Text>
        <View style={{ marginTop: spacing.xs }}>
          <AgentOrb size={92} mood={mood} />
        </View>
      </View>

      {/* Pinned unread insight — the agent's own news, until the conversation starts */}
      {topUnread && messages.length === 0 ? (
        <View style={{ marginTop: spacing.md }}>
          <InsightCard
            priority={topUnread.priority}
            title={topUnread.title}
            message={topUnread.message}
            type={topUnread.type as any}
            actions={[{ label: "Ask about this", onClick: () => send(`Tell me about my ${topUnread.title.toLowerCase()}`) }]}
          />
        </View>
      ) : null}

      {/* Conversation */}
      <View style={styles.conversation}>
        {messages.length === 0 && !topUnread ? (
          <Text style={styles.empty}>Start a conversation below.</Text>
        ) : null}

        {messages.map((msg) => (
          <SoftIn key={msg.id}>
            <View style={[styles.msgRow, msg.role === "user" ? styles.msgRowUser : null]}>
            {msg.role === "user" ? (
              <LinearGradient
                colors={["#0A7085", "#005F73"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[styles.bubble, styles.bubbleUser]}
              >
                <Text style={[styles.bubbleText, { color: colors.onGreen }]}>{msg.display ?? msg.text}</Text>
              </LinearGradient>
            ) : (
              <View style={[card, styles.bubble, styles.bubbleAgent]}>
                <Text style={styles.bubbleText}>{msg.text}</Text>

                {msg.insight?.context?.elements ? (
                  <GenUI elements={msg.insight.context.elements as GenUIElement[]} onAction={handleGenUIAction} />
                ) : null}

                {msg.insight?.suggestedActions ? (
                  <View style={{ gap: spacing.xs, marginTop: 14 }}>
                    {(Array.isArray(msg.insight.suggestedActions) ? msg.insight.suggestedActions : []).map(
                      (action: string) => (
                        <View key={action} style={styles.suggestedRow}>
                          <View style={{ flexShrink: 0, marginTop: 2 }}>
                            <CheckCircleIcon size={17} color={colors.green600} />
                          </View>
                          <Pressable onPress={() => send(action)} style={{ flex: 1 }}>
                            <Text style={styles.suggestedText}>{action}</Text>
                          </Pressable>
                        </View>
                      ),
                    )}
                  </View>
                ) : null}
              </View>
            )}
            </View>
          </SoftIn>
        ))}

        {typing ? (
          <View style={styles.typingRow}>
            <AgentOrb size={30} mood="thinking" />
            <ThinkingPulse />
          </View>
        ) : null}
      </View>

      </Animated.ScrollView>

      {/* Floating dock — the orb, shrunk to the corner once the header has
          scrolled off. Tap returns to the top. */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: Math.max(insets.top, 12),
            right: spacing.pageX,
            width: 52,
            height: 52,
            borderRadius: 26,
            overflow: "hidden",
          },
          dockStyle,
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          accessibilityLabel="Back to top"
        >
          <AgentOrb size={52} mood={mood} />
        </Pressable>
      </Animated.View>

      {/* Composer. The fade above it is the page's own bottom colour rising to
          opaque, so a long reply scrolls *under* the band rather than being cut
          off by a hard edge — the same treatment the web build uses. */}
      <LinearGradient
        colors={["rgba(242,248,244,0)", "rgba(242,248,244,0.92)", "rgba(242,248,244,0.98)"]}
        locations={[0, 0.24, 1]}
        style={[styles.composer, { paddingBottom: keyboardOpen ? spacing.xs : Math.max(insets.bottom, spacing.xs) }]}
      >
        {/* The gradient carries the fade and the page gutter; the row lays the
            field and the send control out side by side. */}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder="Ask your health assistant..."
            placeholderTextColor={semantic.textMuted}
            accessibilityLabel="Message your AI health assistant"
            returnKeyType="send"
            style={styles.input}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || typing}
            accessibilityLabel="Send message"
            style={{ opacity: !input.trim() || typing ? 0.4 : 1 }}
          >
            <LinearGradient {...linearGradient("buttonPrimary")} style={styles.sendButton}>
              <SendIcon size={18} color={colors.onGreen} />
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    </Atmosphere>
    </KeyboardAvoidingView>
  );
}

/**
 * Whether the software keyboard is up.
 *
 * The composer pads itself by the bottom safe-area inset so it clears the home
 * indicator. While the keyboard is open that inset is already covered by the
 * keyboard, so keeping it would leave a band of dead space between the field
 * and the keys.
 */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () =>
      setOpen(true),
    );
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () =>
      setOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return open;
}

/**
 * The word beside the orb, breathing.
 *
 * A cloud reasoning model takes ten to twenty seconds to answer, so the wait
 * is not brief — it needs to look like work in progress rather than a stalled
 * screen. The orb pulses in step; this is the label keeping time with it.
 */
function ThinkingPulse() {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.Text style={[styles.typingText, animated]}>Thinking…</Animated.Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", paddingTop: spacing.xxs },
  back: { position: "absolute", left: -8, top: 0, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, ...font(600), lineHeight: 26, letterSpacing: -0.02 * 17, color: semantic.textPrimary },
  subtitle: { fontSize: 13, ...font(500), lineHeight: 20, color: semantic.accentDeep, marginTop: 2 },

  conversation: { gap: spacing.sm, paddingBottom: spacing.xs, marginTop: spacing.md },
  empty: { fontSize: 13, lineHeight: 20, color: semantic.textMuted, textAlign: "center", paddingVertical: spacing.lg },

  msgRow: { flexDirection: "row", gap: spacing.xs, justifyContent: "flex-start" },
  msgRowUser: { justifyContent: "flex-end" },
  bubble: { maxWidth: "85%", paddingHorizontal: 14, paddingVertical: spacing.sm },
  /* The tail corner: the bubble points at whoever spoke. */
  bubbleAgent: { borderBottomLeftRadius: 5 },
  bubbleUser: { borderRadius: 16, borderBottomRightRadius: 5 },
  bubbleText: { fontSize: 14, lineHeight: 22, color: semantic.textPrimary },

  suggestedRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  suggestedText: { fontSize: 13, lineHeight: 18, color: semantic.textPrimary },

  typingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  typingText: { fontSize: 12.5, lineHeight: 19, color: semantic.textMuted },

  composer: { paddingHorizontal: spacing.pageX, paddingTop: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: semantic.textPrimary,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#E0E6EC",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButton: { width: 44, height: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
});
