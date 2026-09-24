import { db } from "../config/database";
import { familyGroups, familyMemberships, familyInvites, patients, users, type FamilyRole } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { AppError } from "../middleware/errorHandler";
import { authorizeViewer } from "./authorization";

/**
 * Family groups and invitations (Stage 1).
 *
 * Linking rule: a membership becomes `active` ONLY when attached to a real
 * patient account. Invites hold an `invitedContact` (email or phone) and sit
 * as `invited` until the owner of that contact registers or logs in, at
 * which point `claimInvites` activates them. Typed names never create rows
 * here — onboarding's member list is a contact sheet, not an account creator.
 */

const ROLES: FamilyRole[] = ["Mum", "Dad", "Spouse", "Child", "Grandparent", "Other"];

function assertRole(role: unknown): asserts role is FamilyRole {
  if (!ROLES.includes(role as FamilyRole)) throw new AppError(`Unknown role: ${String(role)}`, 400);
}

async function patientOfUser(userId: string) {
  const patient = await db.query.patients.findFirst({ where: eq(patients.userId, userId) });
  if (!patient) throw new AppError("Patient not found", 404);
  return patient;
}

export async function myGroups(patientId: string) {
  const memberships = await db.query.familyMemberships.findMany({
    where: and(eq(familyMemberships.patientId, patientId), eq(familyMemberships.status, "active")),
    with: { group: true },
  });
  return memberships;
}

/** Create a group; the creator joins as active with their role. */
export async function createGroup(userId: string, role: FamilyRole) {
  assertRole(role);
  const patient = await patientOfUser(userId);
  const [group] = await db.insert(familyGroups).values({ plan: "family", createdBy: patient.id }).returning();
  const [membership] = await db.insert(familyMemberships).values({
    groupId: group.id,
    patientId: patient.id,
    role,
    status: "active",
  }).returning();
  await claimInvites(patient.id).catch(() => {});
  return { group, membership };
}

/** Group members the viewer may see (active only, roles attached). */
export async function listMembers(viewerUserId: string, groupId: string) {
  const viewer = await patientOfUser(viewerUserId);
  const memberships = await db.query.familyMemberships.findMany({
    where: and(eq(familyMemberships.groupId, groupId), eq(familyMemberships.status, "active")),
    with: { patient: { with: { user: true } } },
  });
  if (memberships.length === 0) throw new AppError("Group not found", 404);
  const first = memberships[0];
  if (!(await authorizeViewer(viewer.id, first.patientId!))) throw new AppError("Not your family", 403);
  return memberships.map((m: any) => ({
    membershipId: m.id,
    patientId: m.patientId,
    role: m.role,
    status: m.status,
    firstName: m.patient?.user?.firstName ?? null,
    lastName: m.patient?.user?.lastName ?? null,
  }));
}

/** Only the group creator (family head) may invite or remove. */
async function requireHead(groupId: string, patientId: string) {
  const group = await db.query.familyGroups.findFirst({ where: eq(familyGroups.id, groupId) });
  if (!group) throw new AppError("Group not found", 404);
  if (group.createdBy !== patientId) throw new AppError("Only the family head can do this", 403, "FORBIDDEN");
  return group;
}

/**
 * Invite by email or phone. If a matching account already exists it joins as
 * active immediately; otherwise an `invited` row holds the contact until the
 * person registers or logs in and `claimInvites` picks it up.
 */
export async function invite(userId: string, groupId: string, contact: string, role: FamilyRole) {
  assertRole(role);
  const inviter = await patientOfUser(userId);
  await requireHead(groupId, inviter.id);

  const clean = contact.trim().toLowerCase();
  if (!clean) throw new AppError("Contact is required", 400);

  const existingUser = await db.query.users.findFirst({
    where: or(eq(users.email, clean), eq(users.phone, contact.trim())),
  });
  const existingPatient = existingUser
    ? await db.query.patients.findFirst({ where: eq(patients.userId, existingUser.id) })
    : null;

  const [row] = await db.insert(familyMemberships).values({
    groupId,
    patientId: existingPatient ? existingPatient.id : null,
    role,
    status: existingPatient ? "active" : "invited",
    invitedContact: existingPatient ? null : clean,
  }).returning();
  return row;
}

/**
 * Activate every `invited` row whose contact matches this patient's email or
 * phone. Called after register and login — additive, never blocks auth.
 */
export async function claimInvites(patientId: string): Promise<number> {
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
    with: { user: true },
  });
  const user = (patient as any)?.user;
  if (!patient || !user) return 0;
  const contacts = [user.email?.toLowerCase(), user.phone].filter(Boolean) as string[];
  if (contacts.length === 0) return 0;

  let claimed = 0;
  for (const contact of contacts) {
    const rows = await db.query.familyMemberships.findMany({
      where: and(eq(familyMemberships.status, "invited"), eq(familyMemberships.invitedContact, contact.toLowerCase())),
    });
    for (const row of rows) {
      await db.update(familyMemberships).set({ patientId, invitedContact: null, status: "active" }).where(eq(familyMemberships.id, row.id));
      claimed += 1;
    }
  }
  return claimed;
}

/** Remove a membership. Only the family head may remove. */
export async function removeMembership(userId: string, membershipId: string) {
  const remover = await patientOfUser(userId);
  const row = await db.query.familyMemberships.findFirst({ where: eq(familyMemberships.id, membershipId) });
  if (!row) throw new AppError("Membership not found", 404);
  await requireHead(row.groupId, remover.id);
  await db.delete(familyMemberships).where(eq(familyMemberships.id, membershipId));
  return { removed: membershipId };
}

/**
 * Shareable invite link payload. The head generates one per role; anyone
 * opening it sees the family name and the offered role — never health data.
 */
export async function createInviteLink(userId: string, groupId: string, role: FamilyRole) {
  assertRole(role);
  const inviter = await patientOfUser(userId);
  await requireHead(groupId, inviter.id);
  const token = randomUUID().replace(/-/g, "").slice(0, 16);
  const [row] = await db.insert(familyInvites).values({
    token,
    groupId,
    role,
    createdBy: inviter.id,
  }).returning();
  return row;
}

export async function resolveInvite(token: string) {
  const row = await db.query.familyInvites.findFirst({ where: eq(familyInvites.token, token) });
  if (!row) throw new AppError("Invite not found", 404);
  const group = await db.query.familyGroups.findFirst({ where: eq(familyGroups.id, row.groupId) });
  const head = row.createdBy
    ? await db.query.patients.findFirst({ where: eq(patients.id, row.createdBy), with: { user: true } })
    : null;
  const headName = (head as any)?.user
    ? `${(head as any).user.firstName ?? ""} ${(head as any).user.lastName ?? ""}`.trim() || "Your family"
    : "Your family";
  return { token: row.token, role: row.role, used: !!row.usedBy, familyName: `${headName}'s family` };
}

/** Join via link token after registering/logging in. */
export async function joinByToken(userId: string, token: string) {
  const row = await db.query.familyInvites.findFirst({ where: eq(familyInvites.token, token) });
  if (!row) throw new AppError("Invite not found", 404);
  const patient = await patientOfUser(userId);
  const existing = await db.query.familyMemberships.findFirst({
    where: and(eq(familyMemberships.groupId, row.groupId), eq(familyMemberships.patientId, patient.id)),
  });
  if (existing) return existing;
  const [membership] = await db.insert(familyMemberships).values({
    groupId: row.groupId,
    patientId: patient.id,
    role: row.role as FamilyRole,
    status: "active",
  }).returning();
  await db.update(familyInvites).set({ usedBy: patient.id }).where(eq(familyInvites.id, row.id));
  await claimInvites(patient.id).catch(() => {});
  return membership;
}
