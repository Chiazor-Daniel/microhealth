import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles, Send, Heart, Calendar, Pill, FlaskConical, MessageSquare, ChevronRight } from "lucide-react";
import { patientTheme } from "../theme";
import { GlassCard } from "../components/GlassCard";
import { InsightCard } from "../components/InsightCard";
import { AIIndicator } from "../components/AIIndicator";
import { QuickActionButton } from "../components/QuickActionButton";

interface Message {
  id: string;
  role: "agent" | "user";
  text: string;
  cards?: any[];
}

const activeInsights = [
  {
    priority: "watch" as const,
    title: "Health trend",
    message: "Your resting heart rate has been slightly higher than usual for the last 3 days. Nothing urgent — I'm keeping an eye on it.",
    type: "trend" as const,
  },
  {
    priority: "info" as const,
    title: "Appointment",
    message: "Your appointment with Dr. Okonkwo is tomorrow at 10:30 AM.",
    type: "appointment" as const,
  },
];

const quickActions = [
  { icon: <Heart size={14} />, label: "Check my health" },
  { icon: <Calendar size={14} />, label: "Book appointment" },
  { icon: <Pill size={14} />, label: "My medications" },
  { icon: <FlaskConical size={14} />, label: "My latest labs" },
  { icon: <MessageSquare size={14} />, label: "Care team" },
];

export default function AI() {
  const navigate = useNavigate();
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

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    // Mock agent response — replace with backend agent call in Phase 3
    setTimeout(() => {
      let response = "";
      const q = input.toLowerCase();
      if (q.includes("appointment")) {
        response = "Your next appointment is tomorrow at 10:30 AM with Dr. Okonkwo. Would you like to set a reminder or prepare for it?";
      } else if (q.includes("heart rate") || q.includes("vitals")) {
        response = "Your latest heart rate is 72 BPM, which is within your usual range of 64–74 BPM. Your blood pressure and SpO₂ also look normal.";
      } else if (q.includes("medication") || q.includes("medicine")) {
        response = "You have Amlodipine 5mg due this evening. That's 1 tablet daily for 30 days.";
      } else {
        response = "I understand. Let me look at your health context and get back to you with something useful.";
      }
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "agent", text: response }]);
      setTyping(false);
    }, 800);
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
        {activeInsights.map((insight) => (
          <InsightCard
            key={insight.title}
            {...insight}
            actions={[
              { label: "Ask about this", onClick: () => setInput(`Tell me about my ${insight.title.toLowerCase()}`) },
            ]}
          />
        ))}
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
          disabled={!input.trim()}
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-50"
          style={{ background: patientTheme.colors.primaryGreen }}
        >
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}
