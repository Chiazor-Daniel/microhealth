import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles, Send, Heart, Calendar, Pill, FlaskConical, Settings } from "lucide-react";
import { patientTheme } from "../theme";
import { InsightCard } from "../components/InsightCard";
import { AIIndicator } from "../components/AIIndicator";
import { GenUI, type GenUIElement } from "../components/GenUI";
import { useInsights } from "../hooks/useInsights";
import { aiService, type Insight } from "../../services/ai.service";

interface Message {
  id: string;
  role: "agent" | "user";
  text: string;
  insight?: Insight;
}

const suggestions = [
  { icon: <Heart size={13} />, label: "Analyze my vitals" },
  { icon: <Calendar size={13} />, label: "Book appointment" },
  { icon: <Pill size={13} />, label: "My medications" },
  { icon: <FlaskConical size={13} />, label: "My latest labs" },
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

  const send = async (text: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "agent")
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Patient" : "Agent"}: ${m.text}`)
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
      send(`slot:${JSON.stringify(payload.metadata)}`);
    } else if (action === "triage_answer") {
      send(`Severity: ${payload?.value}`);
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
      className="flex flex-col space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AIIndicator size={36} active={typing} />
          <div>
            <h1 className="text-[18px] font-semibold leading-tight" style={{ color: patientTheme.colors.textPrimary }}>
              AI Health Assistant
            </h1>
            <p className="text-xs flex items-center gap-1.5" style={{ color: patientTheme.colors.textSecondary }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: patientTheme.colors.success }} />
              {typing ? "Thinking..." : "Online"}
            </p>
          </div>
        </div>
        <button
          aria-label="Assistant settings"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: patientTheme.colors.surface,
            border: `1px solid ${patientTheme.colors.border}`,
            color: patientTheme.colors.textSecondary,
          }}
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Hero greeting */}
      <div
        className="mh-green-card"
        style={{
          background: "linear-gradient(135deg, #16A34A 0%, #15803D 60%, #14532D 100%)",
          borderRadius: 20,
          padding: 18,
        }}
      >
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{ right: -20, top: -20, width: 110, height: 110, border: "1.5px solid rgba(255,255,255,0.18)" }}
        />
        <p className="text-lg font-semibold text-white">How can I help you today?</p>
        <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>
          Ask about your vitals, trends, medications or care.
        </p>
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
              <div className="flex-shrink-0 mt-1">
                <AIIndicator size={26} active={typing} />
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
              <p className="text-sm leading-relaxed">{msg.text}</p>
              {msg.role === "agent" && msg.insight?.context?.elements && (
                <GenUI elements={msg.insight.context.elements as GenUIElement[]} onAction={handleGenUIAction} />
              )}
              {msg.role === "agent" && msg.insight?.suggestedActions && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(Array.isArray(msg.insight.suggestedActions) ? msg.insight.suggestedActions : []).map((action: string) => (
                    <button
                      key={action}
                      onClick={() => send(action)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: patientTheme.colors.primaryPale, color: patientTheme.colors.primaryGreen }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2">
            <AIIndicator size={26} active />
            <span className="text-xs" style={{ color: patientTheme.colors.textMuted }}>Typing...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 pt-1 pb-2">
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
          <Send size={17} />
        </button>
      </div>
    </motion.div>
  );
}
