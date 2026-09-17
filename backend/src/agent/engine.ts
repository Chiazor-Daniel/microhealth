import { db } from "../config/database";
import { aiInsights, staff } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { type InsightType, type InsightPriority, type GeneratedInsight } from "./types";
import { buildPatientContext, formatPatientContext } from "./rag";
import { retrieveKnowledge } from "./medicalRag";
import { generateAgentResponse, systemPrompt } from "./ollama";
import { summariseInsight, insightFormatPrompt } from "./response";
import { detectTrend, checkVitalRanges } from "./rules";
import { findAvailableAppointments, bookAppointment, prepareCareTeamMessage } from "./tools";

// Re-exported for backwards compatibility (canonical definition lives in ./types)
export type { GeneratedInsight } from "./types";

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
      return await generateInsight(ctx, {
        type: "vital_trend",
        priority: "attention",
        title: "Vital outside usual range",
        message: `Latest ${urgent.metric} is ${urgent.value}, which is outside the usual range.`,
        context: { metric: urgent.metric, value: urgent.value, status: urgent.status, latest },
      });
    }
  }

  const hrTrend = detectTrend(ctx.recentVitals, "heartRate");
  if (hrTrend.direction === "rising" && hrTrend.change >= 5) {
    if (await recentSimilarInsight(ctx.patientId, "vital_trend")) return null;
    return await generateInsight(ctx, {
      type: "vital_trend",
      priority: "watch",
      title: "Resting heart rate trending up",
      message: `Your resting heart rate has been rising over recent readings.`,
      context: { direction: hrTrend.direction, change: hrTrend.change, recent: hrTrend.recent, prior: hrTrend.prior },
    });
  }

  if (hrTrend.direction === "falling" && hrTrend.change <= -5) {
    if (await recentSimilarInsight(ctx.patientId, "vital_recovery")) return null;
    return await generateInsight(ctx, {
      type: "vital_recovery",
      priority: "info",
      title: "Heart rate returning toward baseline",
      message: `Your heart rate appears to be settling back down.`,
      context: { direction: hrTrend.direction, change: hrTrend.change, recent: hrTrend.recent, prior: hrTrend.prior },
    });
  }

  return null;
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
  conversationHistory?: string
): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  const patientContext = formatPatientContext(ctx);
  const medicalKnowledge = retrieveKnowledge(userMessage, 2);

  const lower = userMessage.toLowerCase();

  // Booking flow: agent shows available slots
  if (lower.includes("book") && lower.includes("appointment")) {
    const slots = await findAvailableAppointments(ctx.patientId);
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
      const slots = await findAvailableAppointments(ctx.patientId);
      const idx = lower.includes("second") ? 1 : lower.includes("third") ? 2 : 0;
      const s = slots[idx];
      if (s) selected = { doctorId: s.doctorId, date: s.date, time: s.time };
    }
    if (selected) {
      const appt = await bookAppointment(ctx.patientId, selected);
      const doctorName = await getDoctorName(selected.doctorId);
      return await generateInsight(ctx, {
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
    return await generateInsight(ctx, {
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
      return await generateInsight(ctx, {
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

    return await generateInsight(ctx, {
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
    system: systemPrompt,
    patientContext,
    medicalKnowledge,
    event: { type: "chat", priority: "info", title: "Chat", message: userMessage },
    conversationHistory,
    userMessage,
  });

  return {
    id: crypto.randomUUID(),
    patientId: ctx.patientId,
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

async function generateInsight(ctx: any, event: { type: InsightType; priority: InsightPriority; title: string; message: string; context?: Record<string, unknown> }): Promise<GeneratedInsight> {
  const patientContext = formatPatientContext(ctx);
  const medicalKnowledge = retrieveKnowledge(event.type, 2);

  const response = await generateAgentResponse({
    system: `${systemPrompt}\n\n${insightFormatPrompt}`,
    patientContext,
    medicalKnowledge,
    event,
  });

  const elements = response.elements || [];
  if (event.context?.elements) {
    elements.unshift(...(event.context.elements as any[]));
  }

  return {
    id: crypto.randomUUID(),
    patientId: ctx.patientId,
    type: event.type,
    priority: response.priority || event.priority,
    title: event.title,
    /* The card leads with the finding. The model's full reply is kept as the
       explanation behind it, so nothing the agent said is lost. */
    message: summariseInsight(response.text, event.message),
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
