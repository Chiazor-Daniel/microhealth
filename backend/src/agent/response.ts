import { type InsightPriority } from "./types";

export type GenUIElementType =
  | "text"
  | "vital_card"
  | "appointment_card"
  | "appointment_selector"
  | "medication_card"
  | "lab_card"
  | "quick_actions"
  | "triage_question"
  | "confirmation"
  | "trend_chart";

export interface GenUIElement {
  type: GenUIElementType;
  content?: string;
  data?: Record<string, unknown>;
  options?: { label: string; value: string; metadata?: Record<string, unknown> }[];
  actions?: { label: string; action: string; payload?: Record<string, unknown> }[];
}

export interface AgentStructuredResponse {
  text: string;
  priority?: InsightPriority;
  elements?: GenUIElement[];
  suggestedActions?: string[];
}

/**
 * Strip the inline markdown a model reaches for out of habit.
 *
 * The reply is rendered as plain text in both apps — there is no markdown
 * renderer on either side — so `**115/74**` reaches the patient as literal
 * asterisks. Prompting for plain text reduces this but does not prevent it,
 * so the markers are removed on the way out too.
 *
 * Deliberately narrow: bold, italics, inline code and heading marks only.
 * Dashes and slashes are left alone because the clinical vocabulary is full of
 * them — "115-121/73-78 mmHg" must survive intact.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\W)\*(?!\s)(.+?)(?<!\s)\*(?=\W|$)/g, "$1$2")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "");
}

export function parseAgentOutput(raw: string): AgentStructuredResponse {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const elements: GenUIElement[] = [];
  const suggestedActions: string[] = [];
  let textLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("ACTION:")) {
      suggestedActions.push(stripMarkdown(line.replace("ACTION:", "").trim()));
      continue;
    }
    if (line.startsWith("UI:")) {
      try {
        const payload = JSON.parse(line.replace("UI:", "").trim());
        elements.push(payload);
      } catch {
        // ignore malformed UI lines
      }
      continue;
    }
    textLines.push(line);
  }

  return {
    text: stripMarkdown(textLines.join("\n")),
    elements,
    suggestedActions,
  };
}

export function buildStructuredPrompt(system: string, data: string): string {
  return `${system}\n\n${data}\n\n## Response format\nRespond in plain text first. You may optionally include ONE structured UI block per response by appending a line starting with UI: followed by compact JSON. Allowed UI types: text, vital_card, appointment_card, appointment_selector, medication_card, lab_card, quick_actions, triage_question, confirmation, trend_chart.\n\nYou may add at most 2 suggested patient actions, as lines starting with ACTION:. Only add them when the patient would plausibly want to do something next — often none are needed, and an empty list is better than padding.`;
}

/**
 * Appended to the system prompt when the output is going to be stored as an
 * insight rather than shown as a chat turn.
 *
 * An insight is rendered on a small card, so it has to open with the finding.
 * Left to its own devices the model opens with "Okay Ada, let's take a look at
 * your recent readings…", which reads fine in a conversation and wrong on a
 * card. This asks for the card-shaped version explicitly.
 */
export const insightFormatPrompt = `## This response is an INSIGHT, not a chat reply
It will be shown on a card with the finding as the headline. Therefore:
- Begin with ONE sentence (max 20 words) that states the finding and any number that matters. No greeting, no "let's take a look", no addressing the patient by name.
- After that first sentence you may add up to two sentences of context or advice.
- Do not restate the title.
Example: "Your resting heart rate has risen 6 bpm over three days. That is still inside your normal range, so keep an eye on it rather than worrying."`;

/**
 * Reduce a model response to the one sentence a card can lead with.
 *
 * Defensive by design: prompt instructions are a request, not a guarantee, so
 * a conversational opener is stripped here even when the model ignores them.
 */
export function summariseInsight(text: string, fallback: string): string {
  const cleaned = (text || "")
    .replace(/\s+/g, " ")
    .replace(/^(okay|ok|sure|alright|hi|hello|hey)\b[^.!?]*[,!.:]\s*/i, "")
    .replace(/^(let'?s|let me|i'?ll|i will|i'?ve|i have|looking at)\b[^.!?]*[.!?]\s*/i, "")
    .replace(/^(so|well|now)\b[,:]\s*/i, "")
    .trim();

  const sentences = cleaned.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  /* A sentence that opens on a connective was mid-thought; drop the
     connective so the card never leads with "Specifically, …". */
  const lead = (s: string) => s.replace(/^(specifically|in particular|that said|however|also|additionally|overall)\b[,:]\s*/i, "");
  /* The finding usually carries a number, and failing that a direction word.
     "I'm keeping an eye on this" is neither, so it never leads. */
  const pick =
    sentences.find((s) => /\d/.test(s)) ??
    sentences.find((s) => /\b(rising|rose|increased|increasing|elevated|higher|falling|dropped|decreased|lower|stable|steady|within|outside|normal range)\b/i.test(s)) ??
    sentences[0] ??
    fallback;
  const out = lead(pick);
  return out.length > 180 ? `${out.slice(0, 177).trimEnd()}…` : out;
}
