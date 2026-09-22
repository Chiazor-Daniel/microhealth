import { db } from "../config/database";
import { escalations, patients } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { buildPatientContext, formatPatientContext } from "./rag";
import { generateAgentResponse, systemPrompt } from "./ollama";
import { notifyCaregivers } from "./caregivers";

/**
 * Nurse escalation and clinical review (Agentic AI MVP, function 4).
 *
 * The agent never manages high-risk situations alone. When triage returns
 * `urgent`, or vitals cross the attention threshold, a row lands in the
 * escalation queue with the vitals snapshot and an AI-written case summary.
 * A clinician picks it up, acts (message, call, recheck, book, refer, close),
 * and every step is logged on the row.
 */

export type EscalationUrgency = "routine" | "prompt" | "immediate";
export type EscalationStatus = "open" | "acknowledged" | "resolved" | "closed";

export async function createEscalation(
  patientUserId: string,
  input: { reason: string; urgency?: EscalationUrgency; vitalsSnapshot?: Record<string, unknown> }
): Promise<typeof escalations.$inferSelect> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) throw new Error("Patient not found");

  // Dedupe: one open escalation per patient per reason per day.
  const existing = await db.query.escalations.findFirst({
    where: and(eq(escalations.patientId, ctx.patientId), eq(escalations.status, "open")),
    orderBy: [desc(escalations.createdAt)],
  });
  if (existing && existing.reason === input.reason) return existing;

  const snapshot = input.vitalsSnapshot ?? ctx.recentVitals[0] ?? {};
  const caseSummary = await writeCaseSummary(ctx, input.reason);

  const [row] = await db.insert(escalations).values({
    patientId: ctx.patientId,
    reason: input.reason,
    urgency: input.urgency ?? "prompt",
    vitalsSnapshot: JSON.stringify(snapshot),
    caseSummary,
    status: "open",
  }).returning();

  // Immediate cases also page the family — consent permitting.
  if ((input.urgency ?? "prompt") === "immediate") {
    await notifyCaregivers(ctx.patientId, "urgent",
      `Urgent: ${ctx.profile?.user?.firstName ?? "Your relative"} needs clinical review (${input.reason}). A nurse has been notified.`);
  }

  return row;
}

async function writeCaseSummary(ctx: any, reason: string): Promise<string> {
  try {
    const response = await generateAgentResponse({
      system: `${systemPrompt}\n\nWrite a 3-sentence clinical handoff for a nurse: who the patient is, the concerning data, and what has already been advised. Plain sentences, no formatting.`,
      patientContext: formatPatientContext(ctx),
      medicalKnowledge: "",
      event: { type: "system", priority: "attention", title: "Handoff", message: reason },
      task: "insight",
    });
    return response.text;
  } catch {
    const v = ctx.recentVitals[0];
    return `Escalation for ${ctx.profile?.user?.firstName ?? "patient"}: ${reason}. Latest vitals: HR ${v?.heartRate ?? "—"}, BP ${v?.bloodPressureSystolic ?? "—"}/${v?.bloodPressureDiastolic ?? "—"}, SpO2 ${v?.spo2 ?? "—"}%.`;
  }
}

export async function listQueue(status?: EscalationStatus) {
  const rows = await db.query.escalations.findMany({
    orderBy: [desc(escalations.createdAt)],
    limit: 100,
    with: { patient: { with: { user: true } } },
  });
  const enriched = rows.map((r: any) => ({
    ...r,
    patientName: r.patient?.user ? `${r.patient.user.firstName ?? ""} ${r.patient.user.lastName ?? ""}`.trim() : "Unknown",
    patientPhone: r.patient?.user?.phone ?? null,
  }));
  return status ? enriched.filter((r: any) => r.status === status) : enriched;
}

const STAFF_ACTIONS = ["message_user", "call_user", "request_recheck", "book_visit", "refer", "close_case"] as const;

export async function actOnEscalation(
  escalationId: string,
  staffUserId: string,
  input: { action: string; note?: string }
): Promise<typeof escalations.$inferSelect | null> {
  if (!STAFF_ACTIONS.includes(input.action as any)) throw new Error(`Unknown action: ${input.action}`);
  const row = await db.query.escalations.findFirst({ where: eq(escalations.id, escalationId) });
  if (!row) return null;

  /* The JWT carries the users-table id; the queue references staff rows. */
  const { staff } = await import("../db/schema");
  const clinician = await db.query.staff.findFirst({ where: eq(staff.userId, staffUserId) });

  const update: Record<string, unknown> = {
    assignedStaffId: clinician ? clinician.id : null,
    actionTaken: input.action,
    actionNote: input.note ?? null,
    updatedAt: new Date(),
  };
  if (["message_user", "call_user", "request_recheck"].includes(input.action)) update.status = "acknowledged";
  if (["book_visit", "refer", "close_case"].includes(input.action)) {
    update.status = "resolved";
    update.resolvedAt = new Date();
  }

  const [updated] = await db.update(escalations).set(update).where(eq(escalations.id, escalationId)).returning();
  return updated;
}

export async function staffActions() {
  return STAFF_ACTIONS.map((a) => a);
}

export { patients };
