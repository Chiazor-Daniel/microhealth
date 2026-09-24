import { db } from "../config/database";
import { alertSubscriptions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authorizeViewer } from "./authorization";

/**
 * Alert subscriptions — "whose alerts do I want?"
 *
 * The reverse of caregiver prefs (which say who gets MY alerts). A row means
 * the subscriber wants the target's abnormal / missed / urgent events. Both
 * sides must be viewable: you can only follow someone you are authorized to
 * see, and unfollowing is always one tap.
 */

export type SubscriptionKind = "abnormal" | "missed_medication" | "urgent";

export async function mySubscriptions(subscriberPatientId: string) {
  return db.query.alertSubscriptions.findMany({
    where: eq(alertSubscriptions.subscriberPatientId, subscriberPatientId),
  });
}

export async function setSubscription(
  subscriberPatientId: string,
  targetPatientId: string,
  input: { alertAbnormal?: boolean; alertMissedMedication?: boolean; alertUrgent?: boolean }
) {
  if (!(await authorizeViewer(subscriberPatientId, targetPatientId))) {
    throw new Error("Not authorized to follow this member");
  }
  const existing = await db.query.alertSubscriptions.findFirst({
    where: and(
      eq(alertSubscriptions.subscriberPatientId, subscriberPatientId),
      eq(alertSubscriptions.targetPatientId, targetPatientId)
    ),
  });
  const values = {
    alertAbnormal: input.alertAbnormal ?? existing?.alertAbnormal ?? true,
    alertMissedMedication: input.alertMissedMedication ?? existing?.alertMissedMedication ?? true,
    alertUrgent: input.alertUrgent ?? existing?.alertUrgent ?? true,
    updatedAt: new Date(),
  };
  if (existing) {
    const [row] = await db.update(alertSubscriptions).set(values).where(eq(alertSubscriptions.id, existing.id)).returning();
    return row;
  }
  const [row] = await db.insert(alertSubscriptions).values({
    subscriberPatientId,
    targetPatientId,
    ...values,
  }).returning();
  return row;
}

export async function removeSubscription(subscriberPatientId: string, targetPatientId: string) {
  await db.delete(alertSubscriptions).where(
    and(
      eq(alertSubscriptions.subscriberPatientId, subscriberPatientId),
      eq(alertSubscriptions.targetPatientId, targetPatientId)
    )
  );
  return { removed: true };
}

/** Patient ids subscribed to this target for this kind. */
export async function subscribersOf(targetPatientId: string, kind: SubscriptionKind): Promise<string[]> {
  const rows = await db.query.alertSubscriptions.findMany({
    where: eq(alertSubscriptions.targetPatientId, targetPatientId),
  });
  const column = kind === "abnormal" ? "alertAbnormal" : kind === "missed_medication" ? "alertMissedMedication" : "alertUrgent";
  return rows.filter((r) => r[column]).map((r) => r.subscriberPatientId);
}
