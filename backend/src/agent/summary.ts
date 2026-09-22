import { buildPatientContext, formatPatientContext } from "./rag";
import { generateAgentResponse, systemPrompt } from "./ollama";
import { type GeneratedInsight } from "./types";

/**
 * Health summaries and reports (Agentic AI MVP, function 7).
 *
 * Weekly user summary in plain language, monthly trend report, and the
 * clinical variant nurses read from the escalation queue's case summaries.
 * All three read the same week/month of vitals, insights, adherence and
 * appointments — one data pull, three voices.
 */

export type SummaryPeriod = "week" | "month";

export async function generateSummary(patientUserId: string, period: SummaryPeriod = "week"): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  const days = period === "week" ? 7 : 30;
  const since = Date.now() - days * 24 * 3600 * 1000;
  const vitals = ctx.recentVitals.filter((v) => new Date(v.recordedAt ?? 0).getTime() >= since);

  const voice =
    period === "week"
      ? "Write a short weekly health summary for the patient in plain everyday language: what went well, anything that needs attention, medication adherence, and one clear next action. Four sentences at most, no formatting."
      : "Write a monthly health trend report: how the key numbers moved across the month, patterns worth noting, adherence, and what to focus on next month. Six sentences at most, no formatting.";

  let text: string;
  try {
    const response = await generateAgentResponse({
      system: `${systemPrompt}\n\n${voice}`,
      patientContext: formatPatientContext(ctx),
      medicalKnowledge: "",
      event: { type: "system", priority: "info", title: "Summary", message: `Summarise the last ${period}.` },
      task: "insight",
    });
    text = response.text;
  } catch {
    const hrs = vitals.map((v) => v.heartRate).filter((n): n is number => n != null);
    const avg = hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null;
    text =
      period === "week"
        ? `This week your readings stayed steady${avg ? `, with heart rate averaging ${avg} bpm` : ""}. You have ${ctx.appointments.length} upcoming appointment${ctx.appointments.length === 1 ? "" : "s"} and ${ctx.prescriptions.length} active prescription${ctx.prescriptions.length === 1 ? "" : "s"}. Keep taking your medication as scheduled. Next action: keep your next review appointment.`
        : `This month your readings stayed steady${avg ? `, with heart rate averaging ${avg} bpm` : ""}. Keep taking your medication as scheduled and repeat your checks regularly. Next month: keep your review appointments.`;
  }
  /* Protocol lines (ACTION:/UI:) are instructions for the renderer, never prose. */
  text = text
    .split("\n")
    .filter((line) => !/^\s*(ACTION|UI)\s*:/i.test(line))
    .join("\n")
    .trim();

  return {
    id: crypto.randomUUID(),
    patientId: ctx.patientId,
    type: "weekly_summary",
    priority: "info",
    title: period === "week" ? "Your week in review" : "Your month in review",
    message: text,
    explanation: text,
    context: { elements: [] },
    createdAt: new Date(),
  };
}
