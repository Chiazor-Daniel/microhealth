import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { db } from "../config/database";
import { users, patients, vitals, metricReadings, prescriptions, appointments, familyGroups, familyMemberships, staff } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Demo household + individual accounts with DIVERGENT health stories.
 *
 * Committed and re-runnable (skips whatever already exists): the Bakares and
 * Kola were previously hand-seeded into a gitignored database, which meant a
 * fresh DB — like a new cloud deploy — silently lost them. This script is the
 * fix: run `tsx src/db/seedDemo.ts` anywhere after `db:seed`.
 *
 * Stories (same engine, different people):
 *   Dad   (52) — pressure climbing 140→148, normal sugar, Lisinopril
 *   Mum   (48) — sugar creeping 130→158, steady pressure, Metformin
 *   Tunde (16) — athletic, clean across the board, no meds
 *   Kola  (34) — elevated resting pulse + short sleep, no meds
 *   Ada is the untouched reference (created by seed.ts).
 *
 * Units matter: glucose is mg/dL (the registry band is 70–140). Writing
 * mmol/L numbers once flattened every demo score to 42 — never again.
 */

const DAY = 86400;

interface Persona {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: "Mum" | "Dad" | "Spouse" | "Child" | "Grandparent" | "Other" | null;
  days: number;
  hours: number[];
  hr: [number, number];
  sys: [number, number];
  dia: [number, number];
  spo2: number;
  temp: number;
  resp: number;
  stress: [number, number];
  sleep: number;
  steps: number;
  gluc: [number, number];
  weight: number;
  chol: number;
  rx?: [string, string, string];
  appt?: [string, string];
}

const PEOPLE: Persona[] = [
  {
    email: "dad.demo@example.com", phone: "+2348032222222", firstName: "Femi", lastName: "Bakare", role: "Dad",
    days: 21, hours: [7, 13, 19, 22], hr: [76, 0.1], sys: [136, 0.6], dia: [84, 0.3],
    spo2: 96, temp: 36.7, resp: 15, stress: [62, 0.4], sleep: 5.6, steps: 4200, gluc: [94, 0], weight: 87, chol: 5.6,
    rx: ["Lisinopril 10mg", "1 tablet daily", "30 days"], appt: ["2026-09-25", "09:30"],
  },
  {
    email: "mum.demo@example.com", phone: "+2348033333333", firstName: "Ngozi", lastName: "Bakare", role: "Mum",
    days: 14, hours: [6, 12, 18, 21], hr: [72, 0], sys: [117, 0], dia: [75, 0],
    spo2: 97, temp: 36.5, resp: 14, stress: [50, 0], sleep: 6.8, steps: 6800, gluc: [130, 4], weight: 71, chol: 4.5,
    rx: ["Metformin 500mg", "1 tablet twice daily", "30 days"], appt: ["2026-09-26", "11:00"],
  },
  {
    email: "child.demo@example.com", phone: "+2348034444444", firstName: "Tunde", lastName: "Bakare", role: "Child",
    days: 10, hours: [7, 14, 17, 22], hr: [66, 0], sys: [106, 0], dia: [64, 0],
    spo2: 98, temp: 36.4, resp: 14, stress: [22, 0], sleep: 8.6, steps: 12400, gluc: [88, 0], weight: 57, chol: 4.2,
    appt: ["2026-09-27", "14:00"],
  },
  {
    email: "individual.demo@example.com", phone: "+2348031111111", firstName: "Kola", lastName: "Adeyemi", role: null,
    days: 12, hours: [8, 13, 18, 23], hr: [84, 0], sys: [124, 0], dia: [80, 0],
    spo2: 97, temp: 36.6, resp: 14, stress: [58, 0], sleep: 5.9, steps: 7900, gluc: [95, 0], weight: 79, chol: 4.5,
    appt: ["2026-09-25", "16:00"],
  },
];

const rnd = (seed: string) => {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 16777619);
    return ((h >>> 0) % 10000) / 10000;
  };
};
const j = (rand: () => number, v: number, a: number) => round2(v + (rand() - 0.5) * 2 * a);
const round2 = (v: number) => Math.round(v * 10) / 10;
const round0 = (v: number) => Math.round(v);

async function ensureAccount(p: Persona) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, p.email) });
  if (existing) {
    const pat = await db.query.patients.findFirst({ where: eq(patients.userId, existing.id) });
    return { userId: existing.id, patientId: pat!.id };
  }
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const [user] = await db.insert(users).values({
    email: p.email, phone: p.phone, passwordHash, role: "patient", firstName: p.firstName, lastName: p.lastName,
  }).returning();
  const [patient] = await db.insert(patients).values({
    userId: user.id, patientCode: `MH-${user.id.slice(0, 6).toUpperCase()}`, status: "active",
  }).returning();
  console.log(`[seed-demo] account ${p.email} / demo1234`);
  return { userId: user.id, patientId: patient.id };
}

async function seedVitals(patientId: string, p: Persona) {
  const rand = rnd(p.email);
  const now = Math.floor(Date.now() / 1000);
  const N = p.days;
  for (let d = 0; d < N; d++) {
    const f = N - 1 - d; // 0 oldest .. N-1 today: stories rise INTO today
    for (const h of p.hours) {
      const ts = new Date((now - d * DAY - (23 - h) * 3600 - Math.floor(rand() * 1800)) * 1000);
      await db.insert(vitals).values({
        id: randomUUID(), patientId,
        heartRate: round0(j(rand, p.hr[0] + p.hr[1] * f, 2.5)),
        bloodPressureSystolic: round0(j(rand, p.sys[0] + p.sys[1] * f, 4)),
        bloodPressureDiastolic: round0(j(rand, p.dia[0] + p.dia[1] * f, 3)),
        spo2: round0(j(rand, p.spo2, 1)),
        temperature: j(rand, p.temp, 0.25),
        respiratoryRate: j(rand, p.resp, 1.2),
        stress: Math.max(5, round0(j(rand, p.stress[0] + p.stress[1] * f, 7))),
        fatigue: round0(j(rand, 45, 10)),
        recordedAt: ts,
      });
    }
  }
  const mets: [string, number, string, number][] = [
    ["sleep", p.sleep, "h", 0.6], ["steps", p.steps, "steps", 900],
    ["calories", Math.round(p.steps * 0.045), "kcal", 120],
    ["distance", round2(p.steps * 0.0007), "km", 0.8],
    ["met", p.email.startsWith("child") ? 30 : 22, "METs", 3],
    ["bloodGlucose", -1, "mg/dL", 3], ["cholesterol", p.chol, "mmol/L", 0.2],
    ["hdl", 1.2, "mmol/L", 0.12], ["ldl", p.chol > 5 ? 3.4 : 2.6, "mmol/L", 0.25],
    ["triglycerides", 1.7, "mmol/L", 0.2], ["uricAcid", 340, "umol/L", 20],
    ["bodyComposition", p.weight, "kg", 0.8],
  ];
  for (let d = 0; d < 5; d++) {
    for (const [key, val, unit, amp] of mets) {
      if (["cholesterol", "hdl", "ldl", "triglycerides", "uricAcid", "bodyComposition"].includes(key) && d > 0) continue;
      const v = key === "bloodGlucose" ? round2(j(rand, p.gluc[0] + p.gluc[1] * (4 - d), amp)) : (typeof val === "number" && !Number.isInteger(val) ? j(rand, val, amp) : round0(j(rand, val, amp)));
      await db.insert(metricReadings).values({
        id: randomUUID(), patientId, metricKey: key, value: v, unit, source: "seed",
        recordedAt: new Date((now - d * DAY) * 1000),
      });
    }
  }
}

async function main() {
  const ids: Record<string, string> = {};
  for (const p of PEOPLE) {
    const { patientId } = await ensureAccount(p);
    ids[p.email] = patientId;
    const n = await db.query.vitals.findMany({ where: eq(vitals.patientId, patientId), limit: 1 });
    if (n.length === 0) {
      await seedVitals(patientId, p);
      console.log(`[seed-demo] vitals+metrics for ${p.firstName}`);
    }
    if (p.rx) {
      const hasRx = await db.query.prescriptions.findMany({ where: eq(prescriptions.patientId, patientId), limit: 1 });
      if (hasRx.length === 0) {
        await db.insert(prescriptions).values({
          id: randomUUID(), patientId, medicine: p.rx[0], dosage: p.rx[1], duration: p.rx[2], status: "active",
          issuedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
        });
      }
    }
    if (p.appt) {
      const hasAp = await db.query.appointments.findMany({ where: eq(appointments.patientId, patientId), limit: 1 });
      if (hasAp.length === 0) {
        const docs = await db.query.staff.findMany({ limit: 1 });
        await db.insert(appointments).values({
          id: randomUUID(), patientId, doctorId: docs[0]?.id ?? null, department: "General Practice",
          scheduledDate: p.appt[0], scheduledTime: p.appt[1], status: "confirmed",
          createdAt: new Date(), updatedAt: new Date(),
        });
      }
    }
  }

  // Bakare household group (dad head, mum + child active).
  const dadPid = ids["dad.demo@example.com"];
  const existingGroups = await db.query.familyMemberships.findMany({ where: eq(familyMemberships.patientId, dadPid) });
  if (existingGroups.length === 0) {
    const [group] = await db.insert(familyGroups).values({ plan: "family", createdBy: dadPid }).returning();
    const link = async (email: string, role: "Mum" | "Dad" | "Child") => {
      await db.insert(familyMemberships).values({ id: randomUUID(), groupId: group.id, patientId: ids[email], role, status: "active" });
    };
    await db.insert(familyMemberships).values({ id: randomUUID(), groupId: group.id, patientId: dadPid, role: "Dad", status: "active" });
    await link("mum.demo@example.com", "Mum");
    await link("child.demo@example.com", "Child");
    console.log("[seed-demo] Bakare household linked");
  } else {
    console.log("[seed-demo] household already linked, skipping");
  }
  console.log("[seed-demo] Complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error("[seed-demo] failed:", e);
  process.exit(1);
});
