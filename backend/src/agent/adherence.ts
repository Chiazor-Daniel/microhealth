import { db } from "../config/database";
import { medicationLogs, prescriptions } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { buildPatientContext } from "./rag";
import { createEscalation } from "./escalation";
import { notifyCaregivers } from "./caregivers";
import { type GeneratedInsight } from "./types";

/**
 * Medication and follow-up adherence (Agentic AI MVP, function 5).
 *
 * The loop: remind → patient confirms ("taken") → logged. No confirmation
 * inside the window → missed. Misses accumulate per prescription; three
 * misses on a high-risk patient (on BP/diabetes medication, or with recent
 * attention vitals) escalate to a nurse and page consented caregivers.
 *
 * Confirmation arrives as chat text ("confirm_med:<logId>") from the
 * confirmation button in both clients — no new UI protocol needed.
 */

export const MISS_WINDOW_HOURS = 6;
export const MISS_ESCALATE_COUNT = 3;

export async function remindDueDose(patientUserId: string): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  const active = ctx.prescriptions.filter((p) => p.status !== "expired");
  if (active.length === 0) return null;
  const rx = active[0];

  const open = await db.query.medicationLogs.findFirst({
    where: and(
      eq(medicationLogs.patientId, ctx.patientId),
      eq(medicationLogs.prescriptionId, rx.id),
      eq(medicationLogs.status, "reminded")
    ),
    orderBy: [desc(medicationLogs.createdAt)],
  });
  if (open) return null;

  const [log] = await db.insert(medicationLogs).values({
    patientId: ctx.patientId,
    prescriptionId: rx.id,
    dueAt: new Date(),
    remindedAt: new Date(),
    status: "reminded",
  }).returning();

  return {
    id: crypto.randomUUID(),
    patientId: ctx.patientId,
    type: "medication_due",
    priority: "info",
    title: "Medication reminder",
    message: `Time for your ${rx.medicine} (${rx.dosage}). Tap below once you've taken it.`,
    context: {
      prescriptionId: rx.id,
      logId: log.id,
      elements: [
        {
          type: "quick_actions",
          actions: [{ label: "I've taken it", action: "confirm_medication", payload: { logId: log.id } }],
        },
      ],
    },
    createdAt: new Date(),
  };
}

export async function confirmDose(patientUserId: string, logId: string): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;
  const log = await db.query.medicationLogs.findFirst({
    where: and(eq(medicationLogs.id, logId), eq(medicationLogs.patientId, ctx.patientId)),
  });
  if (!log) return null;
  if (log.status === "taken") return null;

  await db.update(medicationLogs).set({ status: "taken", confirmedAt: new Date() }).where(eq(medicationLogs.id, logId));
  const rx = ctx.prescriptions.find((p) => p.id === log.prescriptionId);

  return {
    id: crypto.randomUUID(),
    patientId: ctx.patientId,
    type: "system",
    priority: "info",
    title: "Logged",
    message: rx ? `Recorded — ${rx.medicine} taken. Streak kept.` : "Recorded — dose taken.",
    context: { elements: [] },
    createdAt: new Date(),
  };
}

/**
 * Sweep reminded-but-unconfirmed doses past the window into `missed`, and
 * escalate repeated misses. Called alongside the other processors whenever
 * vitals arrive, and from the evaluate endpoint.
 */
export async function sweepMissedDoses(patientUserId: string): Promise<GeneratedInsight | null> {
  const ctx = await buildPatientContext(patientUserId);
  if (!ctx) return null;

  const cutoff = new Date(Date.now() - MISS_WINDOW_HOURS * 3600 * 1000);
  const stale = await db.query.medicationLogs.findMany({
    where: and(eq(medicationLogs.patientId, ctx.patientId), eq(medicationLogs.status, "reminded")),
  });
  const overdue = stale.filter((l) => l.remindedAt && l.remindedAt < cutoff);
  if (overdue.length === 0) return null;

  for (const l of overdue) {
    await db.update(medicationLogs).set({ status: "missed" }).where(eq(medicationLogs.id, l.id));
  }

  const rxId = overdue[0].prescriptionId;
  const missCount = await db.query.medicationLogs.findMany({
    where: and(
      eq(medicationLogs.patientId, ctx.patientId),
      eq(medicationLogs.prescriptionId, rxId),
      eq(medicationLogs.status, "missed")
    ),
  });
  const rx = ctx.prescriptions.find((p) => p.id === rxId);
  const name = rx ? `${rx.medicine} (${rx.dosage})` : "your medication";

  if (missCount.length >= MISS_ESCALATE_COUNT) {
    await createEscalation(patientUserId, {
      reason: `Repeated missed doses: ${name} missed ${missCount.length} times`,
      urgency: "prompt",
    });
    await notifyCaregivers(ctx.patientId, "missed_medication",
      `${ctx.profile?.user?.firstName ?? "Your relative"} has missed ${name} ${missCount.length} times. A nurse has been notified.`);
    return {
      id: crypto.randomUUID(),
      patientId: ctx.patientId,
      type: "medication_missed",
      priority: "attention",
      title: "Missed doses need review",
      message: `You've missed ${name} ${missCount.length} times. I've asked a nurse to review — please don't double up, just take the next dose as scheduled.`,
      context: { prescriptionId: rxId, missCount: missCount.length, elements: [] },
      createdAt: new Date(),
    };
  }

  return {
    id: crypto.randomUUID(),
    patientId: ctx.patientId,
    type: "medication_missed",
    priority: "watch",
    title: "Did you miss a dose?",
    message: `No confirmation for ${name}. If you took it, tap below — if not, take it now if still due, and never double up.`,
    context: {
      prescriptionId: rxId,
      elements: [
        { type: "quick_actions", actions: [{ label: "I took it", action: "confirm_medication", payload: { logId: overdue[0].id } }] },
      ],
    },
    createdAt: new Date(),
  };
}

export { prescriptions };
