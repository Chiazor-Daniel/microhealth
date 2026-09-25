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
  // Spouse is symmetric: Mum's husband is Dad, Dad's wife is Mum.
  const viewerRole = members.find((m) => m.patientId === viewerPatientId)?.role ?? null;
  const roleWords: { re: RegExp; roles: Role[] }[] = [
    { re: /\bmum\b|\bmother\b|\bmom\b/, roles: ["Mum"] },
    { re: /\bdad\b|\bfather\b|\bpop\b/, roles: ["Dad"] },
    { re: /\bwife\b/, roles: viewerRole === "Dad" ? ["Mum"] : ["Spouse", "Mum"] },
    { re: /\bhusband\b/, roles: viewerRole === "Mum" ? ["Dad"] : ["Spouse", "Dad"] },
    { re: /\bmy spouse\b|\bpartner\b/, roles: ["Spouse", "Mum", "Dad"] },
    { re: /\bmy son\b|\bmy daughter\b|\bmy kid\b|\bmy child\b/, roles: ["Child"] },
    { re: /\bgrandma\b|\bgrandpa\b|\bgrandmother\b|\bgrandfather\b/, roles: ["Grandparent"] },
  ];
  for (const { re, roles } of roleWords) {
    if (re.test(lower)) {
      for (const role of roles) {
        const hit = members.find((m) => m.role === role && m.patientId !== viewerPatientId);
        if (hit) return hit;
      }
    }
  }
  return null;
}

export function isAggregateQuestion(message: string): boolean {
  return /\beveryone\b|\bwhole family\b|\bwho has\b|\bcompare\b|\banyone(\u2019|')?s\b|\banybody\b|\bdropping\b|\bhighest\b|\blowest\b|\bhow are (they|we)\b/.test(message.toLowerCase());
}

/** One-line vitals snapshot per member for "how is everyone" questions. */
export async function familySnapshot(viewerPatientId: string): Promise<string> {
  const { detectTrend } = await import("./rules");
  const members = await visibleMembers(viewerPatientId);
  const lines: string[] = [];
  for (const m of members) {
    const recent = await db.query.vitals.findMany({
      where: eq(vitals.patientId, m.patientId),
      orderBy: [desc(vitals.recordedAt)],
      limit: 30,
    });
    const { metricReadings } = await import("../db/schema");
    const gluc = await db.query.metricReadings.findMany({
      where: and(eq(metricReadings.patientId, m.patientId), eq(metricReadings.metricKey, "bloodGlucose")),
      orderBy: [desc(metricReadings.recordedAt)],
      limit: 5,
    });
    const glucTrend =
      gluc.length >= 2
        ? (() => {
            const first = Number(gluc[0].value);
            const last = Number(gluc[gluc.length - 1].value);
            if (!isFinite(first) || !isFinite(last) || last === 0) return "";
            const pct = ((first - last) / Math.abs(last)) * 100;
            return Math.abs(pct) >= 5 ? `, glucose ${pct > 0 ? "rising" : "falling"} (${last}→${first})` : "";
          })()
        : "";
    const latest = recent[0];
    const name = `${m.firstName}${m.lastName ? ` ${m.lastName}` : ""}${m.patientId === viewerPatientId ? " (you)" : ""}`;
    if (!latest) {
      lines.push(`- ${name}${m.role ? ` [${m.role}]` : ""}: no readings yet`);
      continue;
    }
    const sys = detectTrend(recent, "systolic");
    const hr = detectTrend(recent, "heartRate");
    const trendBits: string[] = [];
    if (sys.direction !== "stable") trendBits.push(`BP ${sys.direction} (${Math.round(sys.prior)}→${Math.round(sys.recent)})`);
    if (hr.direction !== "stable") trendBits.push(`HR ${hr.direction}`);
    lines.push(
      `- ${name}${m.role ? ` [${m.role}]` : ""}: HR ${latest.heartRate ?? "—"} bpm, BP ${latest.bloodPressureSystolic ?? "—"}/${latest.bloodPressureDiastolic ?? "—"}, SpO2 ${latest.spo2 ?? "—"}%, temp ${latest.temperature ?? "—"}°C` +
      (trendBits.length ? `; TRENDS: ${trendBits.join(", ")}` : "; steady") + glucTrend
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
    /* Aggregate questions ("compare us", "how is everyone") need the whole
       household in context — a mentioned name must not narrow it to one. */
    if (members.length > 1 && isAggregateQuestion(userMessage)) {
      const snapshot = await familySnapshot(viewerCtx.patientId);
      return {
        subjectPatientId: viewerCtx.patientId,
        subjectCtx: null,
        familyLine: `\nFamily context: the asker wants a whole-family view. Every member below is visible to them. Answer ONLY from these readings:\n${snapshot}\nRefer to each person by first name and relationship where known.`,
      };
    }
    const mentioned = resolveMention(userMessage, members, viewerCtx.patientId);

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

    return none;
  } catch {
    return none;
  }
}
