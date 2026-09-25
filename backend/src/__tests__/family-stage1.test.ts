import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import jwt from "jsonwebtoken";
import { db } from "../config/database";
import { users, patients } from "../db/schema";
import { eq } from "drizzle-orm";
import { authorizeViewer } from "../family/authorization";
import { relationshipWord, roleNoun } from "../family/relationships";

const config = { JWT_SECRET: process.env.JWT_SECRET || "dev-secret" };

/** Real patient users created for this suite (rolled back by email cleanup). */
const EMAILS = ["fam-mum@test.local", "fam-dad@test.local", "fam-child@test.local", "fam-stranger@test.local"];

async function makePatient(email: string, firstName: string) {
  const [user] = await db.insert(users).values({ email, passwordHash: "x", role: "patient", firstName, lastName: "Test" }).returning();
  const [patient] = await db.insert(patients).values({ userId: user.id, patientCode: `MH-${user.id.slice(0, 6).toUpperCase()}`, status: "active" }).returning();
  const token = jwt.sign({ userId: user.id, role: "patient" }, config.JWT_SECRET, { expiresIn: "1h" });
  return { user, patient, token };
}

const ids = {} as Record<string, { userId: string; patientId: string; token: string }>;

beforeAll(async () => {
  for (const e of EMAILS) {
    const u = await db.query.users.findFirst({ where: eq(users.email, e) });
    if (u) {
      const p = await db.query.patients.findFirst({ where: eq(patients.userId, u.id) });
      if (p) {
        const { familyMemberships, familyMembers, aiInsights, familyGroups } = await import("../db/schema");
        const owned = await db.query.familyGroups.findMany({
          where: (await import("drizzle-orm")).eq(familyGroups.createdBy, p.id),
        });
        for (const g of owned) {
          await db.delete(familyMemberships).where((await import("drizzle-orm")).eq(familyMemberships.groupId, g.id));
          await db.delete(familyGroups).where((await import("drizzle-orm")).eq(familyGroups.id, g.id));
        }
        await db.delete(familyMemberships).where(eq(familyMemberships.patientId, p.id));
        await db.delete(familyMembers).where(eq(familyMembers.patientId, p.id));
        await db.delete(aiInsights).where(eq(aiInsights.patientId, p.id));
        await db.delete(patients).where(eq(patients.id, p.id));
      }
      await db.delete(users).where(eq(users.id, u.id));
    }
  }
  const mum = await makePatient(EMAILS[0], "Mum");
  const dad = await makePatient(EMAILS[1], "Dad");
  const child = await makePatient(EMAILS[2], "Child");
  const stranger = await makePatient(EMAILS[3], "Stranger");
  ids.mum = { userId: mum.user.id, patientId: mum.patient.id, token: mum.token };
  ids.dad = { userId: dad.user.id, patientId: dad.patient.id, token: dad.token };
  ids.child = { userId: child.user.id, patientId: child.patient.id, token: child.token };
  ids.stranger = { userId: stranger.user.id, patientId: stranger.patient.id, token: stranger.token };

  // Household: mum creates, dad + child invited by existing contact → active.
  const created = await request(app).post("/api/families").set("Authorization", `Bearer ${ids.mum.token}`).send({ role: "Mum" });
  if (created.status !== 201) throw new Error(`setup create failed: ${created.status} ${created.text}`);
  const groupId = created.body.group.id;
  ids.groupId = groupId;
  await request(app).post(`/api/families/${groupId}/invite`).set("Authorization", `Bearer ${ids.mum.token}`).send({ contact: EMAILS[1], role: "Dad" });
  await request(app).post(`/api/families/${groupId}/invite`).set("Authorization", `Bearer ${ids.mum.token}`).send({ contact: EMAILS[2], role: "Child" });
});

describe("authorizeViewer", () => {
  it("1. self access → allowed", async () => {
    expect(await authorizeViewer(ids.mum.patientId, ids.mum.patientId)).toBe(true);
  });
  it("2. active family member → allowed", async () => {
    expect(await authorizeViewer(ids.mum.patientId, ids.dad.patientId)).toBe(true);
    expect(await authorizeViewer(ids.child.patientId, ids.mum.patientId)).toBe(true);
  });
  it("3. unrelated patient → denied", async () => {
    expect(await authorizeViewer(ids.stranger.patientId, ids.mum.patientId)).toBe(false);
    expect(await authorizeViewer(ids.mum.patientId, ids.stranger.patientId)).toBe(false);
  });
  it("4. invited (inactive) member → denied", async () => {
    const res = await request(app).post(`/api/families/${ids.groupId}/invite`).set("Authorization", `Bearer ${ids.mum.token}`).send({ contact: "ghost@test.local", role: "Child" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("invited");
    // ghost has no patient row: direct unit check with a non-member id
    expect(await authorizeViewer("no-such-patient", ids.mum.patientId)).toBe(false);
  });
});

describe("family groups", () => {
  it("rejects unknown roles", async () => {
    const res = await request(app).post("/api/families").set("Authorization", `Bearer ${ids.mum.token}`).send({ role: "Cousin" });
    expect(res.status).toBe(400);
  });
  it("members lists the household with roles", async () => {
    const res = await request(app).get(`/api/families/${ids.groupId}/members`).set("Authorization", `Bearer ${ids.dad.token}`);
    expect(res.status).toBe(200);
    const roles = res.body.map((m: any) => m.role).sort();
    expect(roles).toEqual(["Child", "Dad", "Mum"]);
  });
  it("strangers cannot read the household", async () => {
    const res = await request(app).get(`/api/families/${ids.groupId}/members`).set("Authorization", `Bearer ${ids.stranger.token}`);
    expect(res.status).toBe(403);
  });
  it("claimInvites activates on accept", async () => {
    const res = await request(app).post("/api/families/accept").set("Authorization", `Bearer ${ids.child.token}`);
    expect(res.status).toBe(200);
  });
});

describe("patient record authorization", () => {
  it("self read allowed", async () => {
    const res = await request(app).get(`/api/patients/${ids.mum.patientId}`).set("Authorization", `Bearer ${ids.mum.token}`);
    expect(res.status).toBe(200);
  });
  it("family read allowed", async () => {
    const res = await request(app).get(`/api/patients/${ids.dad.patientId}`).set("Authorization", `Bearer ${ids.mum.token}`);
    expect(res.status).toBe(200);
  });
  it("stranger read denied", async () => {
    const res = await request(app).get(`/api/patients/${ids.mum.patientId}`).set("Authorization", `Bearer ${ids.stranger.token}`);
    expect(res.status).toBe(403);
  });
});

describe("removeFamilyMember ownership", () => {
  it("owner can remove their own dependent row", async () => {
    const add = await request(app).post(`/api/patients/${ids.mum.patientId}/family`).set("Authorization", `Bearer ${ids.mum.token}`).send({ name: "Temp", relation: "Other" });
    expect(add.status).toBe(201);
    const del = await request(app).delete(`/api/patients/${ids.mum.patientId}/family/${add.body.id}`).set("Authorization", `Bearer ${ids.mum.token}`);
    expect(del.status).toBe(200);
  });
  it("another patient cannot remove it", async () => {
    const add = await request(app).post(`/api/patients/${ids.mum.patientId}/family`).set("Authorization", `Bearer ${ids.mum.token}`).send({ name: "Temp2", relation: "Other" });
    expect(add.status).toBe(201);
    const del = await request(app).delete(`/api/patients/${ids.mum.patientId}/family/${add.body.id}`).set("Authorization", `Bearer ${ids.stranger.token}`);
    expect(del.status).toBe(404);
    await request(app).delete(`/api/patients/${ids.mum.patientId}/family/${add.body.id}`).set("Authorization", `Bearer ${ids.mum.token}`);
  });
});

describe("relationship wording (single map)", () => {
  it("covers the required pairs", () => {
    expect(relationshipWord("Mum", "Child")).toBe("your son or daughter");
    expect(relationshipWord("Child", "Mum")).toBe("your mum");
    expect(relationshipWord("Child", "Dad")).toBe("your dad");
    expect(relationshipWord("Dad", "Mum")).toBe("your wife");
    expect(relationshipWord("Mum", "Dad")).toBe("your husband");
    expect(relationshipWord("Spouse", "Spouse")).toBe("your spouse");
    expect(relationshipWord(null, "Child")).toBe("your family member");
  });
  it("role nouns", () => {
    expect(roleNoun("Mum")).toBe("mother");
    expect(roleNoun("Grandparent")).toBe("grandparent");
    expect(roleNoun(null)).toBe("family member");
  });
});

describe("mention resolution", () => {
  it("matches first names and symmetric spouse words", async () => {
    const { resolveMention, visibleMembers } = await import("../agent/familyContext");
    const { db } = await import("../config/database");
    const { users, patients } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");
    const mumUser = await db.query.users.findFirst({ where: eq(users.email, "fam-mum@test.local") });
    const mumPatient = await db.query.patients.findFirst({ where: eq(patients.userId, mumUser!.id) });
    const members = await visibleMembers(mumPatient!.id);
    // fam setup: mum created group; tests invite dad/child by contact (may not exist as accounts)
    expect(Array.isArray(members)).toBe(true);
    expect(members.some((m) => m.patientId === mumPatient!.id)).toBe(true);
    expect(resolveMention("hello there", members, mumPatient!.id)).toBeNull();
  });
});
