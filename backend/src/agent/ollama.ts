import { config } from "../config/env";
import { type InsightPriority } from "./types";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AgentPromptInput {
  system: string;
  patientContext: string;
  medicalKnowledge: string;
  event: {
    type: string;
    priority: InsightPriority;
    title: string;
    message: string;
    context?: Record<string, unknown>;
  };
  conversationHistory?: string;
  userMessage?: string;
}

const DEFAULT_MODEL = "gemma3:4b";
const OLLAMA_URL = process.env.OLLAMA_HOST || "http://localhost:11434";

export async function generateAgentResponse(input: AgentPromptInput): Promise<{ text: string; suggestedActions?: string[] }> {
  const conversationBlock = input.conversationHistory
    ? `## Conversation so far\n${input.conversationHistory}\n\n`
    : "";
  const userBlock = input.userMessage
    ? `## Patient question\n${input.userMessage}\n\n`
    : `## Health event to explain\nType: ${input.event.type}\nPriority: ${input.event.priority}\nTitle: ${input.event.title}\nMessage: ${input.event.message}\nContext: ${JSON.stringify(input.event.context ?? {})}\n\n`;

  const prompt = `${input.system}\n\n${input.patientContext}\n\n${input.medicalKnowledge}\n\n${conversationBlock}${userBlock}\n## Instructions\nRespond as the calm, concise MicroHealth Health Agent. Use one short explanation plus clear next actions. Do not diagnose. Keep paragraphs short. If a vital is abnormal for the patient, mention it gently and suggest monitoring or contacting the care team. You may end with up to 3 one-line suggested patient actions prefixed with ACTION:.`;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.4, num_predict: 400 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    const data = (await res.json()) as { response?: string };
    const text = data.response || "";

    const lines = text.split("\n");
    const bodyLines: string[] = [];
    const actions: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("ACTION:")) {
        actions.push(trimmed.replace("ACTION:", "").trim());
      } else if (trimmed) {
        bodyLines.push(trimmed);
      }
    }

    return { text: bodyLines.join("\n"), suggestedActions: actions.length ? actions : undefined };
  } catch (err) {
    console.error("[agent] Ollama call failed:", err);
    // Graceful fallback so the app keeps working without the LLM
    return {
      text: input.userMessage
        ? "I'm here to help. I couldn't reach my reasoning engine right now, but I can still show your information and help you take action."
        : `I noticed: ${input.event.message}. I'll keep monitoring and update you if anything changes.`,
      suggestedActions: input.userMessage ? ["Show my vitals", "Book appointment"] : undefined,
    };
  }
}

export const systemPrompt = `You are the MicroHealth Health Agent, a calm and intelligent health companion for patients in Nigeria.

Your role:
- Observe patient information and surface useful, easy-to-understand guidance.
- Explain trends without diagnosing diseases.
- Be concise, warm, and reassuring.
- Never claim to replace a doctor or make a clinical diagnosis.
- Use the patient's actual data when it is provided.
- Reference the approved medical knowledge when it is relevant.

Tone rules:
- Use plain language.
- One short explanation is better than a long paragraph.
- Avoid alarmist phrasing. Use "I'm keeping an eye on this" rather than "ALERT".
- If something may need prompt clinical attention, say so clearly and suggest how to reach care.`;
