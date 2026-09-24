import { db } from "../config/database";
import {
  patients,
  vitals,
  appointments,
  prescriptions,
  labTests,
  messages,
  users,
  staff,
} from "../db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { type PatientContext, type VitalBaseline } from "./types";
import { computeBaseline } from "./rules";

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

  const [recentVitals, appointmentsList, prescriptionsList, labsList, messagesList] = await Promise.all([
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
  ]);

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

  const full = [
    "## Patient context",
    profileText,
    baselineText,
    vitalText,
    apptText,
    rxText,
    labText,
  ]
    .filter(Boolean)
    .join("\n\n");

  return full.length > limit ? full.slice(0, limit) + "\n[context truncated]" : full;
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
