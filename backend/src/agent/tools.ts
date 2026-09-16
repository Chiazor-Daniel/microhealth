import { db } from "../config/database";
import { appointments, prescriptions, labTests, messages, staff } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { type GeneratedInsight } from "./engine";
import { persistAndEmit } from "./insights";

export async function findAvailableAppointments(patientId: string, doctorId?: string) {
  const today = new Date().toISOString().split("T")[0];
  const slots: { date: string; time: string; doctorId: string; doctorName: string }[] = [];

  let doctors: any[] = [];
  if (doctorId) {
    const d = await db.query.staff.findFirst({ where: eq(staff.id, doctorId), with: { user: true } });
    if (d) doctors = [d];
  } else {
    doctors = await db.query.staff.findMany({ with: { user: true } });
  }

  const times = ["09:00", "10:30", "14:00", "15:30"];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    for (const doc of doctors.slice(0, 3)) {
      for (const t of times) {
        slots.push({
          date: dateStr,
          time: t,
          doctorId: doc.id,
          doctorName: `Dr. ${doc.user?.firstName ?? ""} ${doc.user?.lastName ?? ""}`.trim(),
        });
      }
    }
  }

  // Remove already-booked slots for this patient
  const existing = await db.query.appointments.findMany({
    where: eq(appointments.patientId, patientId),
  });
  const bookedKeys = new Set(existing.map((a) => `${a.scheduledDate}|${a.scheduledTime}`));
  return slots.filter((s) => s.date >= today && !bookedKeys.has(`${s.date}|${s.time}`)).slice(0, 6);
}

export async function bookAppointment(patientId: string, slot: { doctorId: string; date: string; time: string; department?: string }) {
  const [appt] = await db.insert(appointments).values({
    patientId,
    doctorId: slot.doctorId,
    department: slot.department || "General Practice",
    scheduledDate: slot.date,
    scheduledTime: slot.time,
    status: "confirmed",
  }).returning();
  return appt;
}

export async function prepareCareTeamMessage(senderId: string, patientId: string, content: string) {
  // Find the patient's doctor
  const patient = await db.query.patients.findFirst({ where: eq(require("../db/schema").patients.id, patientId) });
  const recipientId = patient?.doctorId || senderId;
  const [msg] = await db.insert(messages).values({
    senderId,
    recipientId,
    content,
  }).returning();
  return msg;
}
