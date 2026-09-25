import { db } from "../config/database";
import { aiInsights, staff } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { type InsightType, type InsightPriority, type GeneratedInsight } from "./types";
import { buildPatientContext, formatPatientContext } from "./rag";
import { retrieveKnowledge } from "./medicalRag";
import { generateAgentResponse, systemPrompt } from "./ollama";
import { summariseInsight, insightFormatPrompt } from "./response";
import { detectTrend, checkVitalRanges, careLabel } from "./rules";
import { findAvailableAppointments, bookAppointment, prepareCareTeamMessage } from "./tools";
import { matchPathway, parseTriageAnswer, TRIAGE_PATHWAYS } from "./triage";
import { resolveChatSubject } from "./familyContext";
import { createEscalation } from "./escalation";
import { remindDueDose, confirmDose, sweepMissedDoses } from "./adherence";

// Re-exported for backwards compatibility (canonical definition lives in ./types)
export type { GeneratedInsight } from "./types";

/**
 * Run every proactive processor and return what fired. Vitals arrival calls
 * this (via the wearable controller); the evaluate endpoint exposes it for
 * scheduled runs. Each branch dedupes against recent insights of its type,
 * so a cycle never double-emits.
 */
export async function evaluateAll(patientUserId: string): Promise<GeneratedInsight[]> {
  const out: GeneratedInsight[] = [];
  const runners = [processVitalEvent, sweepMissedDoses, remindDueDose, processAppointmentReminder, processLabResult];
  for (const run of runners) {
    try {
      const insight = await run(patientUserId);
      if (insight) out.push(insight);
    } catch (err) {
      console.error(`[agent] ${run.name} failed:`, err);
    }
  }
  return out;
}

export async function processVitalEvent(patientUserId: string): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  const latest = ctx.recentVitals[0];
  if (latest) {
    const checks = checkVitalRanges(latest);
    const urgent = checks.find((c) => c.status === "attention");
    if (urgent) {
      /* Guarded like the other branches — without it, every reading that is
         out of range raises its own identical alert. */
      if (await recentSimilarInsight(ctx.patientId, "vital_trend")) return null;
      /* Attention vitals page a nurse as well as the patient. */
      try {
        await createEscalation(patientUserId, {
          reason: `${urgent.metric} outside usual range (${urgent.value})`,
          urgency: "prompt",
          vitalsSnapshot: latest as unknown as Record<string, unknown>,
        });
      } catch (err) {
        console.error("[agent] auto-escalation failed:", err);
      }
      const label = careLabel(urgent.status, "attention");
      return await generateInsight(ctx, {
        type: "vital_trend",
        priority: "attention",
        title: `${label}: ${metricName(urgent.metric)}`,
        message: `Latest ${metricName(urgent.metric)} is ${urgent.value}, which ${label === "Needs Attention" ? "needs attention" : "is outside the usual range"}. A nurse has been asked to review — if you feel unwell, seek care now.`,
        context: { metric: urgent.metric, value: urgent.value, status: urgent.status, latest },
      }, { lockMessage: true });
    }
  }

  const hrTrend = detectTrend(ctx.recentVitals, "heartRate");
  if (hrTrend.direction === "rising" && hrTrend.change >= 5) {
    if (await recentSimilarInsight(ctx.patientId, "vital_trend")) return null;
    return await generateInsight(ctx, {
      type: "vital_trend",
      priority: "watch",
      title: "Resting heart rate trending up",
      message: `Your resting heart rate has risen from around ${Math.round(hrTrend.prior)} to ${Math.round(hrTrend.recent)} bpm over recent readings — worth watching.`,
      context: { direction: hrTrend.direction, change: hrTrend.change, recent: hrTrend.recent, prior: hrTrend.prior },
    }, { lockMessage: true });
  }

  if (hrTrend.direction === "falling" && hrTrend.change <= -5) {
    if (await recentSimilarInsight(ctx.patientId, "vital_recovery")) return null;
    return await generateInsight(ctx, {
      type: "vital_recovery",
      priority: "info",
      title: "Heart rate returning toward baseline",
      message: `Your heart rate is settling back down toward your usual range.`,
      context: { direction: hrTrend.direction, change: hrTrend.change, recent: hrTrend.recent, prior: hrTrend.prior },
    }, { lockMessage: true });
  }

  return null;
}

function metricName(metric: string): string {
  switch (metric) {
    case "heartRate": return "heart rate";
    case "systolic": return "systolic blood pressure";
    case "diastolic": return "diastolic blood pressure";
    case "spo2": return "blood oxygen";
    case "temperature": return "temperature";
    default: return metric;
  }
}

/** One triage question card; the option values carry answers so far. */
function triageQuestion(pathwayId: string, answered: string[], q: { content: string; options: { label: string; value: string }[] }) {
  const prefix = answered.length ? `${answered.join("+")}+` : "";
  return {
    type: "triage_question",
    content: q.content,
    options: q.options.map((o) => ({ label: o.label, value: `triage:${pathwayId}:${prefix}${o.value}` })),
  };
}

/**
 * Advance a pathway: more questions remain → ask the next; all answered →
 * recommend. An `urgent` outcome pages a nurse immediately and says so.
 */
async function answerTriage(ctx: any, patientUserId: string, pathway: any, values: string[]): Promise<GeneratedInsight> {
  const nextIndex = values.length;
  if (nextIndex < pathway.questions.length) {
    return {
      id: crypto.randomUUID(),
      patientId: ctx.patientId,
      type: "triage_pathway",
      priority: "watch",
      title: "One more check",
      message: "Noted. Next:",
      context: {
        pathwayId: pathway.id,
        elements: [triageQuestion(pathway.id, values, pathway.questions[nextIndex])],
      },
      createdAt: new Date(),
    };
  }

  const { outcome, advice } = pathway.recommend(values, ctx);

  if (outcome === "urgent") {
    try {
      await createEscalation(patientUserId, { reason: `Triage (${pathway.id}): ${values.join(", ")}`, urgency: "immediate" });
    } catch (err) {
      console.error("[agent] triage escalation failed:", err);
    }
    return {
      id: crypto.randomUUID(),
      patientId: ctx.patientId,
      type: "escalation_created",
      priority: "urgent",
      title: "Seek Care Now — nurse notified",
      message: `${advice} I've alerted the care team with your details.`,
      context: {
        pathwayId: pathway.id,
        elements: [
          { type: "quick_actions", actions: [{ label: "Call emergency", action: "call_emergency" }, { label: "Message care team", action: "message_team" }] },
        ],
      },
      createdAt: new Date(),
    };
  }

  const review = outcome === "review";
  return {
    id: crypto.randomUUID(),
    patientId: ctx.patientId,
    type: "triage_pathway",
    priority: review ? "watch" : "info",
    title: review ? "Nurse review recommended" : "Monitoring is fine for now",
    message: advice,
    context: {
      pathwayId: pathway.id,
      outcome,
      elements: review
        ? [{ type: "quick_actions", actions: [{ label: "Book nurse review", action: "book_appointment" }, { label: "Message care team", action: "message_team" }] }]
        : [],
    },
    createdAt: new Date(),
  };
}

export async function processAppointmentReminder(patientUserId: string): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tStr = tomorrow.toISOString().split("T")[0];

  const upcoming = ctx.appointments.find((a) => a.scheduledDate === tStr && a.status !== "cancelled");
  if (!upcoming) return null;

  const existing = await recentSimilarInsight(ctx.patientId, "appointment_reminder", upcoming.id);
  if (existing) return null;

  const doctorName = await getDoctorName(upcoming.doctorId);

  return await generateInsight(ctx, {
    type: "appointment_reminder",
    priority: "info",
    title: "Appointment tomorrow",
    message: `Your appointment with ${doctorName} is tomorrow at ${upcoming.scheduledTime?.slice(0, 5)}.`,
    context: { appointmentId: upcoming.id, doctorName, scheduledDate: upcoming.scheduledDate, scheduledTime: upcoming.scheduledTime },
  });
}

export async function processLabResult(patientUserId: string): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  const latestLab = ctx.labs.find((l) => l.status === "completed" && l.result);
  if (!latestLab) return null;

  const existing = await recentSimilarInsight(ctx.patientId, "lab_result", latestLab.id);
  if (existing) return null;

  return await generateInsight(ctx, {
    type: "lab_result",
    priority: "info",
    title: "Lab result available",
    message: `Your ${latestLab.testName} result is ready.`,
    context: { labId: latestLab.id, testName: latestLab.testName, result: latestLab.result },
  });
}

export async function processMedicationDue(patientUserId: string): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  const active = ctx.prescriptions.filter((p) => p.status !== "expired");
  if (active.length === 0) return null;

  const existing = await recentSimilarInsight(ctx.patientId, "medication_due", active[0].id);
  if (existing) return null;

  return await generateInsight(ctx, {
    type: "medication_due",
    priority: "info",
    title: "Medication reminder",
    message: `Your ${active[0].medicine} (${active[0].dosage}) is due soon.`,
    context: { prescriptionId: active[0].id, medicine: active[0].medicine, dosage: active[0].dosage },
  });
}

export async function respondToChat(
  patientUserId: string,
  userMessage: string,
  conversationHistory?: string,
  subjectPatientId?: string
): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  /* Family subject resolution: explicit subject > name/role mention in the
     message > the viewer. Runs before every branch so triage, booking and
     chat alike read the SUBJECT's numbers, never the viewer's by accident. */
  const fam = await resolveChatSubject(ctx, patientUserId, userMessage, subjectPatientId);
  const subjectCtx = fam.subjectCtx ?? ctx;
  const familyLine = fam.familyLine;

  const patientContext = formatPatientContext(subjectCtx);
  const medicalKnowledge = retrieveKnowledge(userMessage, 2);

  const lower = userMessage.toLowerCase();

  // Medication confirmation from the reminder button ("confirm_med:<logId>")
  if (lower.startsWith("confirm_med:")) {
    const logId = userMessage.slice("confirm_med:".length).trim();
    const done = await confirmDose(patientUserId, logId);
    if (done) return done;
  }

  // "Summarise my week" — weekly/monthly summary without a chat turn.
  if (/summaris| summariz|week in review|month in review/.test(lower)) {
    const { generateSummary } = await import("./summary");
    const period = lower.includes("month") ? "month" : "week";
    const summaryReply = await generateSummary(patientUserId, period);
    if (summaryReply) return summaryReply;
  }

  /* From here the turn belongs to the subject: every branch below reads
     the subject's numbers. confirm_med/summary above stay viewer-own. */
  const actx = subjectCtx ?? ctx;
  const actId = fam.subjectPatientId;

  // Triage pathway answers ("triage:<pathway>:<value+value>")
  const triageAnswer = parseTriageAnswer(userMessage);
  if (triageAnswer) {
    const pathway = TRIAGE_PATHWAYS.find((p) => p.id === triageAnswer.pathwayId);
    if (pathway) return await answerTriage(actx, actId, pathway, triageAnswer.values);
  }

  // A pathway owns this message: ask its first question; answers chain
  // question-by-question (each option value carries the answers so far).
  const pathway = matchPathway(userMessage, actx, { aboutSomeoneElse: fam.subjectPatientId !== ctx.patientId });
  if (pathway) {
    const q = pathway.questions[0];
    return {
      id: crypto.randomUUID(),
      patientId: actId,
      type: "triage_pathway",
      priority: "watch",
      title: "Let's check this properly",
      message: "A couple of quick questions so I can point you at the safest next step.",
      context: {
        pathwayId: pathway.id,
        elements: [triageQuestion(pathway.id, [], q)],
      },
      createdAt: new Date(),
    };
  }

  // Booking flow: agent shows available slots
  if (lower.includes("book") && lower.includes("appointment")) {
    const slots = await findAvailableAppointments(actId);
    return await generateInsight(ctx, {
      type: "system",
      priority: "info",
      title: "Available appointments",
      message: "Here are available appointments. Pick one and I'll confirm it with you.",
      context: {
        elements: [
          {
            type: "appointment_selector",
            options: slots.map((s) => ({
              label: `${s.date} · ${s.time} · ${s.doctorName}`,
              value: JSON.stringify({ doctorId: s.doctorId, date: s.date, time: s.time }),
              metadata: { doctorId: s.doctorId, date: s.date, time: s.time },
            })),
          },
        ],
      },
    });
  }

  // If user selected an appointment slot
  if (lower.startsWith("slot:") || lower.includes("the second") || lower.includes("the first") || lower.includes("the third")) {
    let selected: { doctorId: string; date: string; time: string } | null = null;
    if (lower.startsWith("slot:")) {
      try {
        selected = JSON.parse(userMessage.replace("slot:", "").trim());
      } catch {
        selected = null;
      }
    }
    if (!selected) {
      const slots = await findAvailableAppointments(actId);
      const idx = lower.includes("second") ? 1 : lower.includes("third") ? 2 : 0;
      const s = slots[idx];
      if (s) selected = { doctorId: s.doctorId, date: s.date, time: s.time };
    }
    if (selected) {
      const appt = await bookAppointment(actId, selected);
      const doctorName = await getDoctorName(selected.doctorId);
      return await generateInsight(actx, {
        type: "appointment_reminder",
        priority: "info",
        title: "Appointment confirmed",
        message: `Your appointment is booked with ${doctorName} on ${selected.date} at ${selected.time}.`,
        context: {
          appointmentId: appt.id,
          elements: [
            {
              type: "appointment_card",
              data: {
                department: appt.department,
                doctorName,
                date: appt.scheduledDate,
                time: appt.scheduledTime?.slice(0, 5),
                status: appt.status,
              },
            },
          ],
        },
      });
    }
  }

  // "I can't see a doctor yet" triage flow
  if ((lower.includes("can't") || lower.includes("cannot") || lower.includes("unable")) && lower.includes("doctor")) {
    return await generateInsight(actx, {
      type: "system",
      priority: "watch",
      title: "Let's figure out next steps",
      message: "I understand you can't get to a clinician right now. Let's quickly check how urgent this feels so I can guide you safely.",
      context: {
        elements: [
          {
            type: "triage_question",
            content: "How are you feeling right now?",
            options: [
              { label: "Mild", value: "mild" },
              { label: "Moderate", value: "moderate" },
              { label: "Severe", value: "severe" },
            ],
          },
        ],
      },
    });
  }

  if (["mild", "moderate", "severe"].some((s) => lower.includes(s))) {
    const severity = ["mild", "moderate", "severe"].find((s) => lower.includes(s));
    const urgentSymptoms = ["chest", "breathing", "faint", "unconscious", "severe", "stroke", "bleeding"];
    const hasUrgent = urgentSymptoms.some((sym) => lower.includes(sym));

    if (severity === "severe" || hasUrgent) {
      return await generateInsight(actx, {
        type: "system",
        priority: "urgent",
        title: "Please seek care now",
        message: "Based on what you've shared, this may need prompt in-person care. If you cannot reach your doctor quickly, consider an urgent care facility or emergency services.",
        context: {
          elements: [
            { type: "quick_actions", actions: [{ label: "Call emergency", action: "call_emergency" }, { label: "Message care team", action: "message_team" }] },
          ],
        },
      });
    }

    return await generateInsight(actx, {
      type: "system",
      priority: "watch",
      title: "Self-care while you arrange follow-up",
      message: "I'm sorry you're not feeling well. Rest, hydrate, and monitor your symptoms. If anything worsens — trouble breathing, chest discomfort, fainting, confusion, or severe pain — please seek urgent care.",
      context: {
        elements: [
          { type: "quick_actions", actions: [{ label: "Message care team", action: "message_team" }, { label: "Book appointment", action: "book_appointment" }] },
        ],
      },
    });
  }

  // Default LLM response
  const response = await generateAgentResponse({
    system: `${systemPrompt}${familyLine}`,
    patientContext,
    medicalKnowledge,
    event: { type: "chat", priority: "info", title: "Chat", message: userMessage },
    conversationHistory,
    userMessage,
    task: "chat",
  });

  return {
    id: crypto.randomUUID(),
    patientId: actId,
    type: "system",
    priority: response.priority || "info",
    title: "Health Agent",
    message: response.text,
    explanation: response.text,
    suggestedActions: response.suggestedActions,
    context: { elements: response.elements },
    createdAt: new Date(),
  };
}

async function generateInsight(
  ctx: any,
  event: { type: InsightType; priority: InsightPriority; title: string; message: string; context?: Record<string, unknown> },
  opts?: { lockMessage?: boolean }
): Promise<GeneratedInsight> {
  const patientContext = formatPatientContext(ctx);
  const medicalKnowledge = retrieveKnowledge(event.type, 2);

  const response = await generateAgentResponse({
    system: `${systemPrompt}\n\n${insightFormatPrompt}`,
    patientContext,
    medicalKnowledge,
    event,
    task: "insight",
  });

  const elements = response.elements || [];
  if (event.context?.elements) {
    elements.unshift(...(event.context.elements as any[]));
  }

  /* Rule-based findings keep their exact wording: the title names the metric
     and the message describes it, so a summariser can never pair a heart-rate
     title with a blood-pressure sentence. The model's reply is still kept as
     the explanation behind the card. */
  const message = opts?.lockMessage ? event.message : summariseInsight(response.text, event.message);

  return {
    id: crypto.randomUUID(),
    patientId: ctx.patientId,
    type: event.type,
    priority: response.priority || event.priority,
    title: event.title,
    /* The card leads with the finding. The model's full reply is kept as the
       explanation behind it, so nothing the agent said is lost. */
    message,
    explanation: response.text,
    suggestedActions: response.suggestedActions,
    context: { ...event.context, elements },
    createdAt: new Date(),
  };
}

/**
 * Has this same insight already been raised recently?
 *
 * Looked up by *type*, not by "whatever was written last" — an unrelated
 * insight landing in between would otherwise reset the window and let the
 * same finding be re-emitted on every evaluation cycle.
 */
async function recentSimilarInsight(patientId: string, type: string, sourceId?: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await db.query.aiInsights.findFirst({
    where: and(eq(aiInsights.patientId, patientId), eq(aiInsights.type, type as any)),
    orderBy: [desc(aiInsights.createdAt)],
  });
  if (!existing) return false;
  if (existing.createdAt < oneHourAgo) return false;
  const ctxSource =
    (existing.context as any)?.labId ||
    (existing.context as any)?.appointmentId ||
    (existing.context as any)?.prescriptionId;
  /* An insight with no source row (a trend, say) is deduped on type alone. */
  return !sourceId || !ctxSource || ctxSource === sourceId;
}

async function getDoctorName(staffId?: string | null): Promise<string> {
  if (!staffId) return "your doctor";
  const { staff } = await import("../db/schema");
  const s = await db.query.staff.findFirst({
    where: eq(staff.id, staffId),
    with: { user: true },
  });
  if (!s?.user) return "your doctor";
  return `Dr. ${s.user.firstName} ${s.user.lastName}`;
}
