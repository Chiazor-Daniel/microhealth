/**
 * Backfill episodic metric readings for the demo patient.
 *
 * The band simulator only produces the *wide packet* — heart rate, SpO2,
 * respiration, temperature, blood pressure, HRV, stress, fatigue, GSR. The
 * other half of the registry is recorded on its own schedule: a night of
 * sleep, a day's step rollup, a composition scan, a lipid panel. Nothing in
 * the app writes those yet, so on a fresh database the Sleep, Activity, Body
 * and Labs sections of the Vitals screen are empty and there is no way to see
 * whether they render.
 *
 * This writes a plausible history for one patient so those sections have
 * something to show. It is a *demo fixture*, not product behaviour — see
 * `src/metrics/registry.ts` for what each key means, and the `metric_readings`
 * table for the shape.
 *
 * Idempotent: it clears this patient's previously seeded keys first, so
 * running it twice does not double the history.
 *
 * Usage:  npm run db:seed-metrics
 */

import { db } from "../config/database";
import { metricReadings, patients, users } from "./schema";
import { eq, and, inArray } from "drizzle-orm";

/** Keys this script owns. Anything else in the table is left alone. */
const SEEDED_KEYS = [
  "sleep",
  "steps",
  "distance",
  "calories",
  "met",
  "bodyComposition",
  "bloodGlucose",
  "uricAcid",
  "cholesterol",
  "triglycerides",
  "hdl",
  "ldl",
];

const DAY = 24 * 3600_000;

function at(daysAgo: number, hour = 8, minute = 0): Date {
  const d = new Date(Date.now() - daysAgo * DAY);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * A night's sleep, as stages.
 *
 * The stages are stored in `meta` rather than in columns because a hypnogram
 * is a shape, not a number — and the sum to `value` is what makes the record
 * self-consistent.
 */
function sleepNight(daysAgo: number, total: number) {
  const deep = +(total * 0.21).toFixed(1);
  const rem = +(total * 0.22).toFixed(1);
  const awake = +(total * 0.04).toFixed(1);
  const light = +(total - deep - rem - awake).toFixed(1);
  return {
    metricKey: "sleep",
    value: total,
    unit: "h",
    source: "band",
    recordedAt: at(daysAgo, 6, 45),
    meta: JSON.stringify({ deep, light, rem, awake }),
  };
}

async function main() {
  const [row] = await db
    .select({ patientId: patients.id })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .where(eq(users.email, "ada.patient@example.com"));

  if (!row) {
    console.error("[seed-metrics] demo patient not found — run `npm run db:seed` first");
    process.exit(1);
  }
  const patientId = row.patientId;

  await db
    .delete(metricReadings)
    .where(and(eq(metricReadings.patientId, patientId), inArray(metricReadings.metricKey, SEEDED_KEYS)));

  const rows: (typeof metricReadings.$inferInsert)[] = [];

  /* ---- Sleep: five nights, so the trend has a shape ---- */
  const nights = [7.4, 6.8, 7.9, 6.2, 7.6];
  nights.forEach((h, i) => {
    rows.push({ patientId, ...sleepNight(i, h) } as any);
  });

  /* ---- Activity: five days of rollups, each internally consistent ----
     Distance follows from the step count and calories from the distance, so
     the three never contradict each other on screen. */
  const stepsPerDay = [8420, 11250, 6310, 9780, 5240];
  stepsPerDay.forEach((steps, i) => {
    const daysAgo = i + 1;
    const distance = +(steps * 0.00072).toFixed(2);
    const calories = Math.round(steps * 0.042);
    const met = +(1.5 + (steps / 10000) * 1.6).toFixed(1);
    rows.push(
      { patientId, metricKey: "steps", value: steps, unit: "", source: "band", recordedAt: at(daysAgo, 21, 0) },
      { patientId, metricKey: "distance", value: distance, unit: "km", source: "band", recordedAt: at(daysAgo, 21, 0) },
      { patientId, metricKey: "calories", value: calories, unit: "kcal", source: "band", recordedAt: at(daysAgo, 21, 0) },
      { patientId, metricKey: "met", value: met, unit: "MET", source: "band", recordedAt: at(daysAgo, 21, 0) }
    );
  });

  /* ---- Body: a composition scan. `value` is body fat; the rest rides in meta. */
  rows.push({
    patientId,
    metricKey: "bodyComposition",
    value: 22.4,
    unit: "%",
    source: "scale",
    recordedAt: at(6, 7, 30),
    meta: JSON.stringify({ bodyFat: 22.4, muscleMass: 38.1, water: 55.2, weight: 68.4 }),
  } as any);

  /* ---- Glucose: a fasting reading a few days running ---- */
  [96, 104, 99, 112].forEach((v, i) => {
    rows.push({
      patientId,
      metricKey: "bloodGlucose",
      value: v,
      unit: "mg/dL",
      source: "manual",
      recordedAt: at(i + 1, 7, 15),
    } as any);
  });

  /* ---- Lipid panel: five analytes from one draw, so one date for all ---- */
  const drawDate = at(16, 9, 0);
  const panel: [string, number, string][] = [
    ["cholesterol", 186, "mg/dL"],
    ["triglycerides", 132, "mg/dL"],
    ["hdl", 52, "mg/dL"],
    ["ldl", 108, "mg/dL"],
    ["uricAcid", 5.4, "mg/dL"],
  ];
  for (const [metricKey, value, unit] of panel) {
    rows.push({ patientId, metricKey, value, unit, source: "lab", recordedAt: drawDate } as any);
  }

  await db.insert(metricReadings).values(rows);

  const byKey = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.metricKey!] = (acc[r.metricKey!] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`[seed-metrics] wrote ${rows.length} readings for patient ${patientId.slice(0, 8)}…`);
  console.log("[seed-metrics]", Object.entries(byKey).map(([k, n]) => `${k}×${n}`).join("  "));
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-metrics] failed:", err);
  process.exit(1);
});
