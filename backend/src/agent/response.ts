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

export function parseAgentOutput(raw: string): AgentStructuredResponse {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const elements: GenUIElement[] = [];
  const suggestedActions: string[] = [];
  let textLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("ACTION:")) {
      suggestedActions.push(line.replace("ACTION:", "").trim());
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
    text: textLines.join("\n"),
    elements,
    suggestedActions,
  };
}

export function buildStructuredPrompt(system: string, data: string): string {
  return `${system}\n\n${data}\n\n## Response format\nRespond in plain text first. You may optionally include ONE structured UI block per response by appending a line starting with UI: followed by compact JSON. Allowed UI types: text, vital_card, appointment_card, appointment_selector, medication_card, lab_card, quick_actions, triage_question, confirmation, trend_chart.\n\nYou may also include up to 3 suggested patient actions as separate lines starting with ACTION:.`;
}
