import { db } from "../config/database";
import { aiInsights } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { type HealthEvent, type PatientContext, type InsightType, type InsightPriority } from "./types";
import { buildPatientContext, formatPatientContext } from "./rag";
import { retrieveKnowledge } from "./medicalRag";
import { generateAgentResponse, systemPrompt } from "./ollama";
import { detectTrend, checkVitalRanges } from "./rules";

export interface GeneratedInsight {
  id: string;
  patientId: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  explanation?: string;
  suggestedActions?: string[];
  context?: Record<string, unknown>;
  createdAt: Date;
}

export async function processVitalEvent(patientUserId: string): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  // Look for an urgent/abnormal reading first
  const latest = ctx.recentVitals[0];
  if (latest) {
    const checks = checkVitalRanges(latest);
    const urgent = checks.find((c) => c.status === "attention");
    if (urgent) {
      return await generateInsight(ctx, {
        type: "vital_trend",
        priority: "attention",
        title: "Vital outside usual range",
        message: `Latest ${urgent.metric} is ${urgent.value}, which is outside the usual range.`,
        context: { metric: urgent.metric, value: urgent.value, status: urgent.status, latest },
      });
    }
  }

  // Then look for sustained trends
  const hrTrend = detectTrend(ctx.recentVitals, "heartRate");
  if (hrTrend.direction === "rising" && hrTrend.change >= 5) {
    return await generateInsight(ctx, {
      type: "vital_trend",
      priority: "watch",
      title: "Resting heart rate trending up",
      message: `Your resting heart rate has been rising over recent readings.`,
      context: { direction: hrTrend.direction, change: hrTrend.change, recent: hrTrend.recent, prior: hrTrend.prior },
    });
  }

  if (hrTrend.direction === "falling" && hrTrend.change <= -5) {
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

  // Avoid duplicate med reminders per day per patient
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
    priority: "info",
    title: "Health Agent",
    message: response.text,
    explanation: response.text,
    suggestedActions: response.suggestedActions,
    createdAt: new Date(),
  };
}

async function generateInsight(ctx: PatientContext, event: Omit<HealthEvent, "id" | "patientId" | "createdAt">): Promise<GeneratedInsight> {
  const patientContext = formatPatientContext(ctx);
  const medicalKnowledge = retrieveKnowledge(event.type, 2);

  const response = await generateAgentResponse({
    system: systemPrompt,
    patientContext,
    medicalKnowledge,
    event,
  });

  return {
    id: crypto.randomUUID(),
    patientId: ctx.patientId,
    type: event.type,
    priority: event.priority,
    title: event.title,
    message: response.text || event.message,
    explanation: response.text,
    suggestedActions: response.suggestedActions,
    context: event.context,
    createdAt: new Date(),
  };
}

async function recentSimilarInsight(patientId: string, type: string, sourceId?: string): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await db.query.aiInsights.findFirst({
    where: eq(aiInsights.patientId, patientId),
    orderBy: [desc(aiInsights.createdAt)],
  });
  if (!existing) return false;
  if (existing.createdAt < oneDayAgo) return false;
  if (existing.type === type) {
    const ctxSource = (existing.context as any)?.labId || (existing.context as any)?.appointmentId || (existing.context as any)?.prescriptionId;
    if (!sourceId || !ctxSource || ctxSource === sourceId) return true;
  }
  return false;
}

async function getDoctorName(staffId?: string | null): Promise<string> {
  if (!staffId) return "your doctor";
  const s = await db.query.staff.findFirst({
    where: eq(require("../db/schema").staff.id, staffId),
    with: { user: true },
  });
  if (!s?.user) return "your doctor";
  return `Dr. ${s.user.firstName} ${s.user.lastName}`;
}
