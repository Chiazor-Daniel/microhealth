import { db } from "../config/database";
import { familyMemberships, patients, vitals, familyViews } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { activeGroupIds } from "../family/authorization";
import { relationshipWord } from "../family/relationships";
import type { FamilyRole as Role } from "../db/schema";

/**
 * Family context for the agent (Stage 4 core).
 *
 * Viewer + subject, resolved server-side:
 *   - visible members: everyone sharing an active group with the viewer
 *     (self included), with roles and names
 *   - subject resolution: explicit id > name/role mention in the message >
 *     the viewer themselves
 *   - relationship words come from the ONE map in family/relationships
 *   - cross-member reads are audit-logged to family_views
 */

export interface VisibleMember {
  patientId: string;
  firstName: string;
  lastName: string;
  role: Role | null;
}

export async function visibleMembers(viewerPatientId: string): Promise<VisibleMember[]> {
  const groups = await activeGroupIds(viewerPatientId);
  const out = new Map<string, VisibleMember>();

  const viewer = await db.query.patients.findFirst({
    where: eq(patients.id, viewerPatientId),
    with: { user: true },
  });
  if (viewer) {
    const role = await roleInGroups(viewerPatientId, groups);
    out.set(viewerPatientId, {
      patientId: viewerPatientId,
      firstName: (viewer as any).user?.firstName ?? "You",
      lastName: (viewer as any).user?.lastName ?? "",
      role,
    });
  }

  for (const g of groups) {
    const rows = await db.query.familyMemberships.findMany({
      where: and(eq(familyMemberships.groupId, g), eq(familyMemberships.status, "active")),
      with: { patient: { with: { user: true } } },
    });
    for (const r of rows as any[]) {
      if (!r.patientId || out.has(r.patientId)) continue;
      out.set(r.patientId, {
        patientId: r.patientId,
        firstName: r.patient?.user?.firstName ?? "Family member",
        lastName: r.patient?.user?.lastName ?? "",
        role: (r.role as Role) ?? null,
      });
    }
  }
  return [...out.values()];
}

async function roleInGroups(patientId: string, groups: string[]): Promise<Role | null> {
  for (const g of groups) {
    const m = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.groupId, g),
        eq(familyMemberships.patientId, patientId),
        eq(familyMemberships.status, "active")
      ),
    });
    if (m) return (m.role as Role) ?? null;
  }
  return null;
}

export async function viewerRole(viewerPatientId: string): Promise<Role | null> {
  return roleInGroups(viewerPatientId, await activeGroupIds(viewerPatientId));
}

/** "Mum", "dad", "my wife", "daniel" → the member being talked about. */
export function resolveMention(message: string, members: VisibleMember[], viewerPatientId: string): VisibleMember | null {
  const lower = message.toLowerCase();
  // 1. First names win ("How is Daniel doing?")
  for (const m of members) {
    if (m.patientId === viewerPatientId) continue;
    const first = m.firstName.toLowerCase();
    if (first.length >= 3 && lower.includes(first)) return m;
  }
  // 2. Role nouns ("my wife", "mum", "dad", "my son")
  const roleWords: { re: RegExp; role: Role }[] = [
    { re: /\bmum\b|\bmother\b|\bmom\b/, role: "Mum" },
    { re: /\bdad\b|\bfather\b|\bpop\b/, role: "Dad" },
    { re: /\bwife\b|\bmy spouse\b/, role: "Spouse" },
    { re: /\bhusband\b/, role: "Spouse" },
    { re: /\bmy son\b|\bmy daughter\b|\bmy kid\b|\bmy child\b/, role: "Child" },
    { re: /\bgrandma\b|\bgrandpa\b|\bgrandmother\b|\bgrandfather\b/, role: "Grandparent" },
  ];
  for (const { re, role } of roleWords) {
    if (re.test(lower)) {
      const hit = members.find((m) => m.role === role && m.patientId !== viewerPatientId);
      if (hit) return hit;
    }
  }
  return null;
}

export function isAggregateQuestion(message: string): boolean {
  return /\beveryone\b|\bwhole family\b|\bwho has\b|\bcompare\b|\banyone(\u2019|')?s\b|\banybody\b|\bdropping\b|\bhighest\b|\blowest\b|\bhow are (they|we)\b/.test(message.toLowerCase());
}

/** One-line vitals snapshot per member for "how is everyone" questions. */
export async function familySnapshot(viewerPatientId: string): Promise<string> {
  const members = await visibleMembers(viewerPatientId);
  const lines: string[] = [];
  for (const m of members) {
    const latest = await db.query.vitals.findFirst({
      where: eq(vitals.patientId, m.patientId),
      orderBy: [desc(vitals.recordedAt)],
    });
    const name = `${m.firstName}${m.lastName ? ` ${m.lastName}` : ""}${m.patientId === viewerPatientId ? " (you)" : ""}`;
    if (!latest) {
      lines.push(`- ${name}${m.role ? ` [${m.role}]` : ""}: no readings yet`);
      continue;
    }
    lines.push(
      `- ${name}${m.role ? ` [${m.role}]` : ""}: HR ${latest.heartRate ?? "—"} bpm, BP ${latest.bloodPressureSystolic ?? "—"}/${latest.bloodPressureDiastolic ?? "—"}, SpO2 ${latest.spo2 ?? "—"}%, temp ${latest.temperature ?? "—"}°C`
    );
  }
  return lines.join("\n");
}

/** Roles of two patients inside the group they share (null when none). */
async function sharedRoles(viewerPatientId: string, subjectPatientId: string): Promise<{ v: Role | null; s: Role | null }> {
  const viewerGroups = await activeGroupIds(viewerPatientId);
  for (const g of viewerGroups) {
    const sub = await db.query.familyMemberships.findFirst({
      where: and(
        eq(familyMemberships.groupId, g),
        eq(familyMemberships.patientId, subjectPatientId),
        eq(familyMemberships.status, "active")
      ),
    });
    if (sub) {
      const own = await db.query.familyMemberships.findFirst({
        where: and(
          eq(familyMemberships.groupId, g),
          eq(familyMemberships.patientId, viewerPatientId),
          eq(familyMemberships.status, "active")
        ),
      });
      return { v: (own?.role as Role) ?? null, s: (sub.role as Role) ?? null };
    }
  }
  return { v: null, s: null };
}

/** Phrase the subject from the viewer's side ("your son or daughter"). */
export async function subjectPhrase(viewerPatientId: string, subjectPatientId: string): Promise<string> {
  if (viewerPatientId === subjectPatientId) return "you";
  const { v, s } = await sharedRoles(viewerPatientId, subjectPatientId);
  return relationshipWord(v, s);
}

export async function logFamilyView(viewerPatientId: string, subjectPatientId: string): Promise<void> {
  if (viewerPatientId === subjectPatientId) return;
  await db.insert(familyViews).values({ viewerPatientId, subjectPatientId }).catch(() => {});
}

/**
 * Resolve who the chat turn is about. Returns the subject context (or null
 * when the viewer is the subject — caller keeps its own) plus the prompt
 * line that teaches the model the relationship. Never throws: failures
 * resolve to the viewer, never to someone else's data.
 */
export async function resolveChatSubject(
  viewerCtx: { patientId: string },
  viewerUserId: string,
  userMessage: string,
  explicitSubjectId?: string
): Promise<{
  subjectPatientId: string;
  subjectCtx: any | null;
  familyLine: string;
}> {
  const none = { subjectPatientId: viewerCtx.patientId, subjectCtx: null as any, familyLine: "" };
  try {
    const { buildPatientContextById } = await import("./rag");
    const { authorizeViewer } = await import("../family/authorization");

    const members = await visibleMembers(viewerCtx.patientId);
    const mentioned = resolveMention(userMessage, members, viewerCtx.patientId);
    const aggregate = members.length > 1 && isAggregateQuestion(userMessage);

    let subjectId = viewerCtx.patientId;
    if (explicitSubjectId && explicitSubjectId !== viewerCtx.patientId) subjectId = explicitSubjectId;
    else if (mentioned) subjectId = mentioned.patientId;

    if (subjectId !== viewerCtx.patientId) {
      if (!(await authorizeViewer(viewerCtx.patientId, subjectId))) return none;
      const subjectCtx = await buildPatientContextById(subjectId);
      if (!subjectCtx) return none;
      await logFamilyView(viewerCtx.patientId, subjectId);
      const phrase = await subjectPhrase(viewerCtx.patientId, subjectId);
      const subjectName = `${subjectCtx.profile?.user?.firstName ?? "They"}`;
      const viewerName = ((viewerCtx as any).profile?.user?.firstName ?? "You");
      return {
        subjectPatientId: subjectId,
        subjectCtx,
        familyLine: `\nFamily context: you are talking to ${viewerName}. They are asking about ${subjectName}, who is ${phrase}. Answer about ${subjectName} using THEIR numbers below — never the asker's. Address the asker directly ("${phrase} ...").`,
      };
    }

    if (aggregate) {
      const snapshot = await familySnapshot(viewerCtx.patientId);
      return {
        subjectPatientId: viewerCtx.patientId,
        subjectCtx: null,
        familyLine: `\nFamily context: the asker wants a whole-family view. Every member below is visible to them. Answer ONLY from these readings:\n${snapshot}\nRefer to each person by first name and relationship where known.`,
      };
    }
    return none;
  } catch {
    return none;
  }
}
