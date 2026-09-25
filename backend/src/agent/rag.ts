import { db } from "../config/database";
import {
  patients,
  vitals,
  appointments,
  prescriptions,
  labTests,
  messages,
  metricReadings,
  users,
  staff,
} from "../db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { type PatientContext, type VitalBaseline } from "./types";
import { computeBaseline, detectTrend } from "./rules";

export async function buildPatientContext(userId: string): Promise<PatientContext | null> {
  const patient = await db.query.patients.findFirst({
    where: eq(patients.userId, userId),
  });
  if (!patient) return null;
  return buildPatientContextById(patient.id, userId);
}

/** Same context for any patient id (family subject reads). Caller authorizes. */
export async function buildPatientContextById(patientId: string, userId?: string): Promise<PatientContext | null> {
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
  });
  if (!patient) return null;
  const ownerId = userId ?? patient.userId;
  if (!ownerId) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, ownerId),
    columns: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });

  const patientWithUser = { ...patient, user };

  const [recentVitals, appointmentsList, prescriptionsList, labsList, messagesList, metricRows] = await Promise.all([
    db.query.vitals.findMany({
      where: eq(vitals.patientId, patientId),
      orderBy: [desc(vitals.recordedAt)],
      limit: 50,
    }),
    db.query.appointments.findMany({
      where: eq(appointments.patientId, patientId),
      with: { doctor: { with: { user: true } } },
      orderBy: [asc(appointments.scheduledDate), asc(appointments.scheduledTime)],
      limit: 10,
    }),
    db.query.prescriptions.findMany({
      where: eq(prescriptions.patientId, patientId),
      orderBy: [desc(prescriptions.issuedAt)],
      limit: 10,
    }),
    db.query.labTests.findMany({
      where: eq(labTests.patientId, patientId),
      orderBy: [desc(labTests.orderedAt)],
      limit: 10,
    }),
    db.query.messages.findMany({
      where: eq(messages.recipientId, ownerId),
      orderBy: [desc(messages.sentAt)],
      limit: 10,
    }),
    db.query.metricReadings.findMany({
      where: eq(metricReadings.patientId, patientId),
      orderBy: [desc(metricReadings.recordedAt)],
      limit: 60,
    }),
  ]);

  const byKey = new Map<string, typeof metricRows>();
  for (const r of metricRows) {
    if (!byKey.has(r.metricKey)) byKey.set(r.metricKey, []);
    byKey.get(r.metricKey)!.push(r);
  }
  // Newest-first input: first is latest, last is oldest for that key.
  const episodicTrend = [...byKey.entries()]
    .map(([key, rows]) => {
      if (rows.length < 2) return null;
      const first = Number(rows[0].value);
      const last = Number(rows[rows.length - 1].value);
      if (!isFinite(first) || !isFinite(last) || last === 0) return null;
      const pct = ((first - last) / Math.abs(last)) * 100;
      if (Math.abs(pct) < 5) return null;
      return `${key} ${pct > 0 ? "rising" : "falling"} (${last} to ${first})`;
    })
    .filter(Boolean)
    .join("; ");
  const seen = new Set<string>();
  const episodic = metricRows.filter((r) => {
    if (seen.has(r.metricKey)) return false;
    seen.add(r.metricKey);
    return true;
  });

  const baseline = computeBaseline(recentVitals);

  return {
    patientId,
    userId: ownerId,
    profile: patientWithUser,
    recentVitals,
    baseline,
    appointments: appointmentsList,
    prescriptions: prescriptionsList,
    labs: labsList,
    messages: messagesList,
    episodic,
    episodicTrend: episodicTrend || undefined,
  };
}

export function formatPatientContext(ctx: PatientContext, limit = 3000): string {
  const p = ctx.profile;
  const profileText = p
    ? [
        `Patient: ${p.user?.firstName ?? ""} ${p.user?.lastName ?? ""}`.trim(),
        p.age ? `Age: ${p.age}` : "",
        p.gender ? `Gender: ${p.gender}` : "",
        p.bloodGroup ? `Blood group: ${p.bloodGroup}` : "",
        p.diagnosis ? `Known diagnosis/follow-up: ${p.diagnosis}` : "",
      ].filter(Boolean).join("\n")
    : "Patient profile not available.";

  const vitalText = ctx.recentVitals.length
    ? `Recent vitals (newest first):\n${ctx.recentVitals
        .slice(0, 8)
        .map(
          (v) =>
            `  - ${v.recordedAt ? new Date(v.recordedAt).toLocaleString() : "?"}: HR ${v.heartRate ?? "?"}, BP ${v.bloodPressureSystolic ?? "?"}/${v.bloodPressureDiastolic ?? "?"}, SpO2 ${v.spo2 ?? "?"}, Temp ${v.temperature ?? "?"}`
        )
        .join("\n")}`
    : "No recent vitals available.";

  const baselineText = ctx.baseline
    ? `Patient baseline (from recent history):\n${Object.entries(ctx.baseline)
        .map(([k, v]) => `  - ${k}: ${v.min}–${v.max}`)
        .join("\n")}`
    : "";

  const apptText = ctx.appointments.length
    ? `Appointments:\n${ctx.appointments
        .map(
          (a) =>
            `  - ${a.scheduledDate} ${a.scheduledTime?.slice(0, 5)}: ${a.department || "General"} (${a.status})`
        )
        .join("\n")}`
    : "No upcoming appointments.";

  const rxText = ctx.prescriptions.length
    ? `Medications:\n${ctx.prescriptions
        .map((r) => `  - ${r.medicine}: ${r.dosage} [${r.status}]`)
        .join("\n")}`
    : "No active prescriptions.";

  const labText = ctx.labs.length
    ? `Lab results:\n${ctx.labs
        .map((l) => `  - ${l.testName} (${l.status}): ${l.result || "pending"}`)
        .join("\n")}`
    : "No lab results.";

  const episodicText = (ctx.episodic?.length || ctx.episodicTrend)
    ? [`Other measures (latest per metric):`,
      ...(ctx.episodic ?? []).map((r) => `  - ${r.metricKey}: ${r.value}${r.unit ? ` ${r.unit}` : ""}`),
      ...(ctx.episodicTrend ? [`TRENDS: ${ctx.episodicTrend}. Treat a rising trend as worth mentioning even when the latest number looks borderline.`] : []),
    ].join("\n")
    : "";

  const full = [
    "## Patient context",
    profileText,
    baselineText,
    trendText(ctx),
    vitalText,
    episodicText,
    apptText,
    rxText,
    labText,
  ]
    .filter(Boolean)
    .join("\n\n");

  return full.length > limit ? full.slice(0, limit) + "\n[context truncated]" : full;
}

/** Direction-of-travel per metric, so the model states trends instead of guessing. */
function trendText(ctx: PatientContext): string {
  const parts: string[] = [];
  const sys = detectTrend(ctx.recentVitals, "systolic");
  if (sys.direction !== "stable") parts.push(`systolic BP ${sys.direction} (${Math.round(sys.prior)} to ${Math.round(sys.recent)})`);
  const hr = detectTrend(ctx.recentVitals, "heartRate");
  if (hr.direction !== "stable") parts.push(`heart rate ${hr.direction} (${Math.round(hr.prior)} to ${Math.round(hr.recent)})`);
  const dia = detectTrend(ctx.recentVitals, "diastolic");
  if (dia.direction !== "stable") parts.push(`diastolic BP ${dia.direction} (${Math.round(dia.prior)} to ${Math.round(dia.recent)})`);
  if (!parts.length) return "";
  return `Trends (compare recent half vs prior half of readings):\n${parts.map((p) => `  - ${p}`).join("\n")}`;
}

export async function getClinicianName(staffId?: string | null): Promise<string> {
  if (!staffId) return "your clinician";
  const s = await db.query.staff.findFirst({
    where: eq(staff.id, staffId),
    with: { user: true },
  });
  if (!s?.user) return "your clinician";
  return `Dr. ${s.user.firstName} ${s.user.lastName}`;
}
