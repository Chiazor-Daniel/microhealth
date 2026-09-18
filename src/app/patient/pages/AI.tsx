import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { patientTheme } from "../theme";
import { InsightCard } from "../components/InsightCard";
import { AgentOrb } from "../components/AgentOrb";
import { CheckCircleIcon, HeartIcon, CalendarIcon, CapsuleIcon, FlaskIcon, SendIcon, ChevronLeftIcon } from "../icons";
import { GenUI, type GenUIElement } from "../components/GenUI";
import { useInsights } from "../hooks/useInsights";
import { aiService, type Insight } from "../../services/ai.service";

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

const suggestions = [
  { icon: <HeartIcon size={15} />, label: "Analyze my vitals" },
  { icon: <CalendarIcon size={15} />, label: "Book appointment" },
  { icon: <CapsuleIcon size={15} />, label: "My medications" },
  { icon: <FlaskIcon size={15} />, label: "My latest labs" },
];

export default function AI() {
  const navigate = useNavigate();
  const { insights, refresh } = useInsights();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const send = async (text: string, display?: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text, display };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "agent")
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Patient" : "Agent"}: ${m.display ?? m.text}`)
      .join("\n");

    try {
      const reply = await aiService.chat(text, history);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "agent", text: reply.message, insight: reply }]);
      refresh();
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: "I'm having trouble reaching my reasoning engine right now, but I'm still here. You can try again or view your vitals and care details.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || typing) return;
    send(input.trim());
  };

  const handleGenUIAction = (action: string, payload?: any) => {
    if (action === "select_appointment" && payload?.metadata) {
      send(`slot:${JSON.stringify(payload.metadata)}`, `Book: ${payload.label}`);
    } else if (action === "triage_answer") {
      send(`Severity: ${payload?.value}`, payload?.label ?? `Severity: ${payload?.value}`);
    } else if (action === "message_team") {
      navigate("/patient/care/messages");
    } else if (action === "book_appointment") {
      navigate("/patient/book");
    } else if (action === "call_emergency") {
      window.location.href = "tel:112";
    }
  };

  const topUnread = insights.find((i) => !i.isRead);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col flex-1 space-y-4"
    >
      {/* Header — the agent introduces itself rather than being labelled */}
      <div className="relative flex flex-col items-center pt-1">
        <button
          onClick={() => navigate("/patient/home")}
          aria-label="Back to home"
          className="absolute left-0 top-0 flex items-center justify-center w-9 h-9 -ml-2"
          style={{ color: patientTheme.colors.textPrimary }}
        >
          <ChevronLeftIcon size={22} />
        </button>
        <h1 className="text-[17px] font-semibold" style={{ color: patientTheme.colors.textPrimary, letterSpacing: "-0.02em" }}>
          Health Agent
        </h1>
        <p className="text-[13px] font-medium mt-0.5" style={{ color: patientTheme.colors.primaryDark }}>
          Always here for you
        </p>
        <div className="mt-2 -mb-1">
          <AgentOrb size={92} active={typing} />
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => {
              if (s.label === "Book appointment") send("Book me an appointment");
              else if (s.label === "Analyze my vitals") send("Analyze my latest vitals and tell me what you see");
              else setInput(s.label);
            }}
            className="mh-btn-secondary flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap flex-shrink-0"
            style={{ color: patientTheme.colors.textPrimary }}
          >
            <span style={{ color: patientTheme.colors.primaryGreen }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Pinned unread insight */}
      {topUnread && messages.length === 0 && (
        <InsightCard
          priority={topUnread.priority}
          title={topUnread.title}
          message={topUnread.message}
          type={topUnread.type as any}
          actions={[
            { label: "Ask about this", onClick: () => send(`Tell me about my ${topUnread.title.toLowerCase()}`) },
          ]}
        />
      )}

      {/* Conversation */}
      <div className="space-y-3 pb-2">
        {messages.length === 0 && !topUnread && (
          <p className="text-[13px] text-center py-6" style={{ color: patientTheme.colors.textMuted }}>
            Start a conversation, or tap a suggestion above.
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "agent" && (
              <div className="flex-shrink-0 -mt-1">
                <AgentOrb size={30} />
              </div>
            )}
            <div
              className={msg.role === "agent" ? "mh-card" : ""}
              style={{
                maxWidth: "85%",
                background: msg.role === "user"
                  ? "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)"
                  : undefined,
                color: msg.role === "user" ? "#fff" : patientTheme.colors.textPrimary,
                borderRadius: 16,
                borderBottomRightRadius: msg.role === "user" ? 5 : 16,
                borderBottomLeftRadius: msg.role === "user" ? 16 : 5,
                boxShadow: msg.role === "user"
                  ? "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(22,163,74,0.3)"
                  : undefined,
                padding: "12px 14px",
              }}
            >
              <p className="text-sm leading-relaxed">{msg.display ?? msg.text}</p>
              {msg.role === "agent" && msg.insight?.context?.elements && (
                <GenUI elements={msg.insight.context.elements as GenUIElement[]} onAction={handleGenUIAction} />
              )}
              {msg.role === "agent" && msg.insight?.suggestedActions && (
                <ul className="space-y-2 mt-3.5">
                  {(Array.isArray(msg.insight.suggestedActions) ? msg.insight.suggestedActions : []).map((action: string) => (
                    <li key={action} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 mt-0.5" style={{ color: patientTheme.colors.primaryGreen }}>
                        <CheckCircleIcon size={17} />
                      </span>
                      <button
                        onClick={() => send(action)}
                        className="text-[13px] text-left leading-snug"
                        style={{ color: patientTheme.colors.textPrimary }}
                      >
                        {action}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2.5">
            <AgentOrb size={30} />
            <span className="text-[12.5px]" style={{ color: patientTheme.colors.textMuted }}>
              Thinking…
            </span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input bar — stuck to the bottom of the scroll container rather than
          sitting at the end of the conversation, so it never drifts off-screen
          behind a long reply. The tint is the page's own bottom colour, so the
          messages scroll under it rather than into it. */}
      <div
        className="flex items-center gap-2 pt-2 pb-2 -mx-5 px-5"
        style={{
          position: "sticky",
          bottom: 0,
          marginTop: "auto",
          background: "linear-gradient(180deg, rgba(242,248,244,0) 0%, rgba(242,248,244,0.92) 22%, rgba(242,248,244,0.98) 100%)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask your health assistant..."
          aria-label="Message your AI health assistant"
          className="mh-field flex-1 px-4 py-3 rounded-full text-sm outline-none"
          style={{
            color: patientTheme.colors.textPrimary,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || typing}
          aria-label="Send message"
          className="mh-btn-primary w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          style={{ color: "#fff" }}
        >
          <SendIcon size={18} />
        </button>
      </div>
    </motion.div>
  );
}
