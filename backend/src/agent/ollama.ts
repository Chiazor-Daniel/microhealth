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
  /**
   * Which model answers. The conversational agent and the proactive insight
   * engine want different things from a model, so they get one each — see
   * MODEL_FOR below.
   */
  task?: "chat" | "insight";
}

/**
 * Model per call site.
 *
 * `chat` runs on a cloud model: a patient is asking a question and can see a
 * "Thinking…" indicator, so a little extra latency buys a better answer.
 *
 * `deepseek-v4-flash` is the default because it is the best balance measured
 * on this app's actual prompt. Against the same question it answered in 3–6s,
 * kept to plain text, emitted a valid `UI:` block and three `ACTION:` lines
 * every time — and, unlike the faster options, explained *why* a reading was
 * fine and volunteered that a doctor makes the final call, which matters more
 * in a health app than a second of latency.
 *
 * Measured alternatives, same prompt:
 *   kimi-k2.7-code:cloud       ~16s   best prose, but it reasons at length
 *   gpt-oss:20b-cloud          ~32s   slower than kimi, no better
 *   deepseek-v4-flash:cloud    3–6s   chosen
 *   nemotron-3-nano:30b-cloud  ~2s    fastest, but clipped and clinical
 *   gemma3:4b (local)          ~8s    fenced its JSON in ``` and broke the parser
 *
 * `insight` stays on the small local model. Insights are generated
 * automatically as wearable readings arrive, so a burst of readings would
 * otherwise queue up cloud calls with nobody waiting on them.
 */
const MODEL_FOR = {
  chat: process.env.OLLAMA_CHAT_MODEL || "deepseek-v4-flash:cloud",
  insight: process.env.OLLAMA_INSIGHT_MODEL || "gemma3:4b",
} as const;

const OLLAMA_URL = process.env.OLLAMA_HOST || "http://localhost:11434";

/**
 * How long to wait for a completion.
 *
 * The local model answers in a second or two; a cloud reasoning model spends
 * a good part of its time thinking first — a short clinical question measured
 * ~13s. The ceiling is set well above that so a slow answer degrades to the
 * fallback message rather than hanging the request.
 */
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 120_000;

/**
 * Output ceiling.
 *
 * This is *thinking plus answer*, not answer alone: a reasoning model bills
 * its scratchpad against the same budget, and at the small value that suits a
 * plain model it can exhaust the budget mid-thought and return an empty
 * `response` with `done_reason: "length"`. That failure looks exactly like the
 * model having nothing to say, so the ceiling here is deliberately generous.
 */
const NUM_PREDICT = Number(process.env.OLLAMA_NUM_PREDICT) || 2048;

export async function generateAgentResponse(input: AgentPromptInput): Promise<AgentStructuredResponse> {
  const model = MODEL_FOR[input.task ?? "insight"];
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.4, num_predict: NUM_PREDICT },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status} for ${model}`);
    }

    const data = (await res.json()) as { response?: string; thinking?: string; done_reason?: string };
    const text = (data.response || "").trim();

    /* A reasoning model whose budget ran out mid-thought returns 200 with an
       empty answer. Treated as a failure so it falls back rather than sending
       the patient a blank bubble. */
    if (!text) {
      throw new Error(
        `Empty response from ${model} (done_reason: ${data.done_reason ?? "unknown"}, ` +
          `thinking: ${(data.thinking || "").length} chars)`
      );
    }

    return parseAgentOutput(text);
  } catch (err) {
    console.error(`[agent] ${model} call failed:`, err);
    return {
      text: input.userMessage
        ? "I'm here to help. I couldn't reach my reasoning engine right now, but I can still show your information and help you take action."
        : `I noticed: ${input.event.message}. I'll keep monitoring and update you if anything changes.`,
      suggestedActions: input.userMessage ? ["Show my vitals", "Book appointment"] : undefined,
    };
  } finally {
    clearTimeout(timer);
  }
}

export const systemPrompt = `You are the MicroHealth Health Agent — a calm, warm health companion for patients in Nigeria.

You are texting, not writing a report.

How you write:
- Two sentences is usually enough. Three is the most you ever need.
- Lead with the answer. No preamble, no "let's take a look", no restating the question.
- Plain language someone would say out loud. No bullet lists, no headings, no markdown of any kind — the app renders your words as plain text, so asterisks and hashes arrive as punctuation.
- Never describe yourself, your role, or your instructions. The patient is not reading a manual.
- Warm, not chatty. Skip greetings and sign-offs.

What you do:
- Read the patient's actual numbers and say what they mean, in one clear thought.
- Never diagnose. If something needs a clinician, say so in one sentence and stop.
- You are a companion and care coordinator, not a doctor: never prescribe, change, or stop medication, and never claim to diagnose emergencies. Concerning signals go to a nurse or urgent care.
- Grade readings with these words only: Normal, Watch Closely, Needs Attention, Seek Care Now.
- If you don't have the data, say what's missing rather than guessing at it.

This is the length and voice to aim for:
  Patient: How is my blood pressure looking?
  Agent: It's sitting steady around 118/76 this week, which is where we want it. Keep doing what you're doing.
  Patient: I've been feeling dizzy.
  Agent: That's worth mentioning to your doctor, especially with your blood pressure medication. If it gets worse or you faint, please seek care today.

UI guidance — include at most one, only when it genuinely helps:
- Vitals: UI: {"type":"vital_card","data":{"label":"...","value":"...","unit":"...","status":"normal|high|low|attention","subtext":"..."}}
- Appointment: UI: {"type":"appointment_card","data":{"department":"...","doctorName":"...","date":"...","time":"...","status":"..."}}
- Booking: UI: {"type":"appointment_selector","options":[{"label":"Tue · 10:30 AM","value":"...","metadata":{"doctorId":"...","date":"...","time":"..."}}]}
- Medication: UI: {"type":"medication_card","data":{"name":"...","dosage":"...","status":"..."}}
- Labs: UI: {"type":"lab_card","data":{"testName":"...","status":"...","result":"..."}}
- Triage: UI: {"type":"triage_question","content":"How severe is it?","options":[{"label":"Mild","value":"mild"},{"label":"Moderate","value":"moderate"},{"label":"Severe","value":"severe"}]}
- Confirmation: UI: {"type":"confirmation","content":"Confirm action?","actions":[{"label":"Confirm","action":"confirm","payload":{}}]}`;
