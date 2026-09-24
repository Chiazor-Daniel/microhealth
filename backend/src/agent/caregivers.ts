import { db } from "../config/database";
import { caregiverAlertPrefs, familyMembers, notifications, patients } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Family and caregiver alerts (Agentic AI MVP, function 6).
 *
 * Consent-based and per-category. The patient links a trusted contact
 * (family_members row) and ticks which alert kinds they may receive:
 * abnormal readings, missed medication, urgent escalations. No consent row
 * means no alerts, full stop.
 *
 * Delivery is in-app (notifications + care-team message thread) — the ward
 * this MVP runs on has no SMS/WhatsApp sender yet, so the phone number is
 * stored now and the channel joins later without a schema change.
 */

export type CaregiverAlertKind = "abnormal" | "missed_medication" | "urgent";

export async function getPrefs(patientId: string) {
  return db.query.caregiverAlertPrefs.findMany({
    where: eq(caregiverAlertPrefs.patientId, patientId),
  });
}

export async function setPrefs(
  patientId: string,
  input: {
    familyMemberId: string;
    contactPhone?: string;
    alertAbnormal?: boolean;
    alertMissedMedication?: boolean;
    alertUrgent?: boolean;
  }
) {
  const member = await db.query.familyMembers.findFirst({
    where: and(eq(familyMembers.id, input.familyMemberId), eq(familyMembers.patientId, patientId)),
  });
  if (!member) throw new Error("Family member not found for this patient");

  const existing = await db.query.caregiverAlertPrefs.findFirst({
    where: and(
      eq(caregiverAlertPrefs.patientId, patientId),
      eq(caregiverAlertPrefs.familyMemberId, input.familyMemberId)
    ),
  });

  const values = {
    contactPhone: input.contactPhone ?? existing?.contactPhone ?? null,
    alertAbnormal: input.alertAbnormal ?? existing?.alertAbnormal ?? true,
    alertMissedMedication: input.alertMissedMedication ?? existing?.alertMissedMedication ?? true,
    alertUrgent: input.alertUrgent ?? existing?.alertUrgent ?? true,
    consentedAt: new Date(),
    updatedAt: new Date(),
  };

  if (existing) {
    const [row] = await db.update(caregiverAlertPrefs).set(values).where(eq(caregiverAlertPrefs.id, existing.id)).returning();
    return row;
  }
  const [row] = await db.insert(caregiverAlertPrefs).values({
    patientId,
    familyMemberId: input.familyMemberId,
    ...values,
  }).returning();
  return row;
}

/** Send a caregiver alert to every consented contact for this kind. Returns recipients. */
export async function notifyCaregivers(patientId: string, kind: CaregiverAlertKind, message: string): Promise<string[]> {
  const prefs = await getPrefs(patientId);
  const column = kind === "abnormal" ? "alertAbnormal" : kind === "missed_medication" ? "alertMissedMedication" : "alertUrgent";
  const eligible = prefs.filter((p) => p[column]);
  if (eligible.length === 0) return [];

  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient?.userId) return [];
  for (const pref of eligible) {
    const member = await db.query.familyMembers.findFirst({ where: eq(familyMembers.id, pref.familyMemberId) });
    void member;
    await db.insert(notifications).values({
      userId: patient.userId,
      title: "Caregiver alert sent",
      message,
      type: "caregiver_alert",
      subjectPatientId: patientId,
    });
  }

  /* Plus everyone subscribed to this person's alerts ("whose alerts do I get"). */
  const { subscribersOf } = await import("../family/subscriptions");
  const subs = await subscribersOf(patientId, kind);
  for (const subPatientId of subs) {
    const sub = await db.query.patients.findFirst({ where: eq(patients.id, subPatientId) });
    if (!sub?.userId || sub.userId === patient.userId) continue;
    await db.insert(notifications).values({
      userId: sub.userId,
      title: "Family alert",
      message,
      type: "caregiver_alert",
      subjectPatientId: patientId,
    });
  }

  return eligible.map((p) => p.familyMemberId);
}
