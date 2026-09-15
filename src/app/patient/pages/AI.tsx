import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles, Send, Heart, Calendar, Pill, FlaskConical, MessageSquare } from "lucide-react";
import { patientTheme } from "../theme";
import { GlassCard } from "../components/GlassCard";
import { InsightCard } from "../components/InsightCard";
import { AIIndicator } from "../components/AIIndicator";
import { QuickActionButton } from "../components/QuickActionButton";
import { useInsights } from "../hooks/useInsights";
import { aiService, type Insight } from "../../services/ai.service";

interface Message {
  id: string;
  role: "agent" | "user";
  text: string;
  insight?: Insight;
}

const quickActions = [
  { icon: <Heart size={14} />, label: "Check my health" },
  { icon: <Calendar size={14} />, label: "Book appointment" },
  { icon: <Pill size={14} />, label: "My medications" },
  { icon: <FlaskConical size={14} />, label: "My latest labs" },
  { icon: <MessageSquare size={14} />, label: "Care team" },
];

export default function AI() {
  const navigate = useNavigate();
  const { insights, loading: insightsLoading, refresh } = useInsights();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Hi. I'm your Health Agent. I watch your health trends and care events so I can help you understand what's happening and what to do next.",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "agent")
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Patient" : "Agent"}: ${m.text}`)
      .join("\n");

    try {
      const reply = await aiService.chat(input, history);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col h-[calc(100dvh-180px)] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <AIIndicator size={36} active={typing} />
        <div>
          <h1 className="text-xl font-bold" style={{ color: patientTheme.colors.textPrimary }}>Your Health Agent</h1>
          <p className="text-xs" style={{ color: patientTheme.colors.textMuted }}>Watching your health</p>
        </div>
      </div>

      {/* Active insights */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: patientTheme.colors.textMuted }}>Active insights</p>
        {insightsLoading ? (
          <p className="text-sm" style={{ color: patientTheme.colors.textMuted }}>Loading insights...</p>
        ) : insights.length === 0 ? (
          <p className="text-sm" style={{ color: patientTheme.colors.textMuted }}>Nothing active right now. I'll let you know when I notice something.</p>
        ) : (
          insights.slice(0, 3).map((insight) => (
            <InsightCard
              key={insight.id}
              priority={insight.priority}
              title={insight.title}
              message={insight.message}
              type={insight.type as any}
              actions={[
                { label: "Ask about this", onClick: () => setInput(`Tell me about my ${insight.title.toLowerCase()}`) },
              ]}
            />
          ))
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quickActions.map((a) => (
          <QuickActionButton
            key={a.label}
            icon={a.icon}
            label={a.label}
            onClick={() => {
              if (a.label.includes("appointment")) navigate("/patient/book");
              else setInput(a.label);
            }}
          />
        ))}
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <GlassCard
              style={{
                maxWidth: "85%",
                background: msg.role === "user" ? patientTheme.colors.primaryGreen : patientTheme.colors.surface,
                color: msg.role === "user" ? "#fff" : patientTheme.colors.textPrimary,
                borderRadius: msg.role === "user" ? 20 : patientTheme.radius.card,
                borderBottomRightRadius: msg.role === "user" ? 6 : undefined,
                borderBottomLeftRadius: msg.role === "user" ? undefined : 6,
                padding: 14,
                boxShadow: patientTheme.shadows.soft,
              }}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              {msg.insight?.suggestedActions && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {Array.isArray(msg.insight.suggestedActions)
                    ? msg.insight.suggestedActions.map((action: string) => (
                        <button
                          key={action}
                          onClick={() => setInput(action)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: patientTheme.colors.primaryPale, color: patientTheme.colors.primaryGreen }}
                        >
                          {action}
                        </button>
                      ))
                    : null}
                </div>
              )}
            </GlassCard>
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2">
            <AIIndicator size={20} active />
            <span className="text-xs" style={{ color: patientTheme.colors.textMuted }}>Agent is thinking...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask your Health Agent..."
          className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
          style={{
            background: patientTheme.colors.surface,
            border: `1px solid ${patientTheme.colors.border}`,
            color: patientTheme.colors.textPrimary,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || typing}
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-50"
          style={{ background: patientTheme.colors.primaryGreen }}
        >
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}
