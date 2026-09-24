import { db } from "../config/database";
import { familyMemberships } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Family viewing authorization (Stage 1).
 *
 * Exactly one rule, in exactly one place:
 *   - viewer === subject → allowed (Individual unchanged)
 *   - viewer and subject share a group where BOTH memberships are active → allowed
 *   - otherwise → denied
 *
 * Status matters: `invited` rows confer nothing. UI hiding is not
 * authorization — every patient-data read must pass through here.
 */

export async function activeGroupIds(patientId: string): Promise<string[]> {
  const rows = await db.query.familyMemberships.findMany({
    where: and(eq(familyMemberships.patientId, patientId), eq(familyMemberships.status, "active")),
  });
  return rows.map((r) => r.groupId);
}

export async function authorizeViewer(viewerPatientId: string, subjectPatientId: string): Promise<boolean> {
  if (!viewerPatientId || !subjectPatientId) return false;
  if (viewerPatientId === subjectPatientId) return true;

  const viewerGroups = await activeGroupIds(viewerPatientId);
  if (viewerGroups.length === 0) return false;

  const subject = await db.query.familyMemberships.findMany({
    where: and(eq(familyMemberships.patientId, subjectPatientId), eq(familyMemberships.status, "active")),
  });
  return subject.some((m) => viewerGroups.includes(m.groupId));
}

/** Same check, throwing. Use at the top of patient-data handlers. */
export async function requireViewer(viewerPatientId: string, subjectPatientId: string): Promise<void> {
  const { AppError } = await import("../middleware/errorHandler");
  if (!(await authorizeViewer(viewerPatientId, subjectPatientId))) {
    throw new AppError("Not authorized to view this patient's data", 403, "FORBIDDEN");
  }
}
