import { type InsightPriority } from "./types";
import { parseAgentOutput, type AgentStructuredResponse, buildStructuredPrompt } from "./response";

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

export async function generateAgentResponse(input: AgentPromptInput): Promise<AgentStructuredResponse> {
  const conversationBlock = input.conversationHistory
    ? `## Conversation so far\n${input.conversationHistory}\n\n`
    : "";
  const userBlock = input.userMessage
    ? `## Patient question\n${input.userMessage}\n\n`
    : `## Health event to explain\nType: ${input.event.type}\nPriority: ${input.event.priority}\nTitle: ${input.event.title}\nMessage: ${input.event.message}\nContext: ${JSON.stringify(input.event.context ?? {})}\n\n`;

  const prompt = buildStructuredPrompt(
    input.system,
    `${input.patientContext}\n\n${input.medicalKnowledge}\n\n${conversationBlock}${userBlock}`
  );

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.4, num_predict: 600 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    const data = (await res.json()) as { response?: string };
    const text = data.response || "";
    return parseAgentOutput(text);
  } catch (err) {
    console.error("[agent] Ollama call failed:", err);
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
- If something may need prompt clinical attention, say so clearly and suggest how to reach care.

UI guidance:
- When showing vitals, use UI: {"type":"vital_card","data":{"label":"...","value":"...","unit":"...","status":"normal|high|low|attention","subtext":"..."}}
- When showing an appointment, use UI: {"type":"appointment_card","data":{"department":"...","doctorName":"...","date":"...","time":"...","status":"..."}}
- When the patient wants to book, use UI: {"type":"appointment_selector","options":[{"label":"Tue · 10:30 AM","value":"...","metadata":{"doctorId":"...","date":"...","time":"..."}}]}
- For medication, use UI: {"type":"medication_card","data":{"name":"...","dosage":"...","status":"..."}}
- For labs, use UI: {"type":"lab_card","data":{"testName":"...","status":"...","result":"..."}}
- For triage, use UI: {"type":"triage_question","content":"How severe is it?","options":[{"label":"Mild","value":"mild"},{"label":"Moderate","value":"moderate"},{"label":"Severe","value":"severe"}]}
- For confirmation, use UI: {"type":"confirmation","content":"Confirm action?","actions":[{"label":"Confirm","action":"confirm","payload":{}}]}
- Do not include more than one UI block unless necessary.`;
