import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, semantic, spacing } from "@tokens";
import { linearGradient, text, font } from "@rn/theme";
import { useInsights } from "@app/patient/hooks/useInsights";
import { aiService, type Insight } from "@app/services/ai.service";

import { AgentOrb } from "@/ui/AgentOrb";
import { InsightCard } from "@/ui/InsightCard";
import { GenUI, type GenUIElement } from "@/ui/GenUI";
import { Atmosphere } from "@/ui/Atmosphere";
import { SoftIn, TapScale } from "@/ui/motion";
import { card } from "@/ui/styles";
import {
  CalendarIcon,
  CapsuleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  HeartIcon,
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
 * Openers, in the patient's words rather than the system's.
 *
 * Four of them read as a menu to be studied; two read as an invitation. These
 * are the questions someone actually arrives with — and the agent can reach
 * everything else from a plain sentence, so the chips only need to start the
 * conversation, not enumerate it.
 */
const suggestions = [
  { key: "how", icon: HeartIcon, label: "How am I doing?", send: "How am I doing?" },
  { key: "book", icon: CalendarIcon, label: "Book a visit", send: "I'd like to book a visit" },
  { key: "meds", icon: CapsuleIcon, label: "My medications", send: "What am I taking at the moment?" },
] as const;

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
  const scrollRef = useRef<ScrollView | null>(null);
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

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
    (action: string, payload?: any) => {
      if (action === "select_appointment" && payload?.metadata) {
        send(`slot:${JSON.stringify(payload.metadata)}`, `Book: ${payload.label}`);
      } else if (action === "triage_answer") {
        send(`Severity: ${payload?.value}`, payload?.label ?? `Severity: ${payload?.value}`);
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
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12) + spacing.pageY,
          paddingBottom: spacing.lg,
          paddingHorizontal: spacing.pageX,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header — the agent introduces itself rather than being labelled */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/home")} accessibilityLabel="Back to home" style={styles.back}>
          <ChevronLeftIcon size={22} color={semantic.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Health Agent</Text>
        <Text style={styles.subtitle}>Always here for you</Text>
        <View style={{ marginTop: spacing.xs }}>
          <AgentOrb size={92} active={typing} />
        </View>
      </View>

      {/* Suggestion chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: spacing.md }}
        contentContainerStyle={styles.chipRow}
      >
        {suggestions.map(({ key, icon: Icon, label, send }) => (
          <Pressable key={key} onPress={() => send(send)} style={styles.suggestion}>
            <Icon size={15} color={colors.green600} />
            <Text style={styles.suggestionLabel}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

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
          <Text style={styles.empty}>Start a conversation, or tap a suggestion above.</Text>
        ) : null}

        {messages.map((msg) => (
          <SoftIn key={msg.id}>
            <View style={[styles.msgRow, msg.role === "user" ? styles.msgRowUser : null]}>
            {msg.role === "agent" ? (
              <View style={{ flexShrink: 0, marginTop: -4 }}>
                <AgentOrb size={30} />
              </View>
            ) : null}

            {msg.role === "user" ? (
              <LinearGradient
                colors={["#22C55E", "#16A34A"]}
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
            <AgentOrb size={30} active />
            <ThinkingPulse />
          </View>
        ) : null}
      </View>

      </ScrollView>

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

  chipRow: { gap: spacing.xs, paddingHorizontal: 4 },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(134,202,158,0.65)",
    flexShrink: 0,
  },
  suggestionLabel: { fontSize: 13, ...font(500), lineHeight: 20, color: semantic.textPrimary },

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
