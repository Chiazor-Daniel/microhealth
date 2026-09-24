import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { visitSessions, appointments, patients } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";

/**
 * Visit sessions — the consultation room around the call.
 *
 * Joining opens (or reuses) the session for an appointment; leaving writes
 * the summary. Chat inside the visit rides the existing messages table with
 * subject `visit:<appointmentId>`, so no new chat protocol was needed.
 */

async function patientOf(userId: string) {
  const patient = await db.query.patients.findFirst({ where: eq(patients.userId, userId) });
  if (!patient) throw new AppError("Patient not found", 404);
  return patient;
}

async function appointmentOf(id: string) {
  const appt = await db.query.appointments.findFirst({ where: eq(appointments.id, id) });
  if (!appt) throw new AppError("Appointment not found", 404);
  return appt;
}

export async function join(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await patientOf(req.user!.userId);
    const appt = await appointmentOf(String(req.params.id));
    if (appt.patientId !== patient.id) throw new AppError("Not your appointment", 403);

    const open = await db.query.visitSessions.findFirst({
      where: and(eq(visitSessions.appointmentId, appt.id), eq(visitSessions.status, "in_visit")),
      orderBy: [desc(visitSessions.createdAt)],
    });
    if (open) {
      res.json(open);
      return;
    }

    const [session] = await db.insert(visitSessions).values({
      appointmentId: appt.id,
      patientId: patient.id,
      status: "in_visit",
      joinedAt: new Date(),
    }).returning();
    res.status(201).json(session);
  } catch (e) { next(e); }
}

export async function current(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await db.query.visitSessions.findFirst({
      where: eq(visitSessions.appointmentId, String(req.params.id)),
      orderBy: [desc(visitSessions.createdAt)],
    });
    res.json(session ?? null);
  } catch (e) { next(e); }
}

export async function end(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await patientOf(req.user!.userId);
    const session = await db.query.visitSessions.findFirst({
      where: and(
        eq(visitSessions.appointmentId, String(req.params.id)),
        eq(visitSessions.patientId, patient.id),
        eq(visitSessions.status, "in_visit")
      ),
      orderBy: [desc(visitSessions.createdAt)],
    });
    if (!session) throw new AppError("No active visit", 404);
    const { summary } = req.body;
    const [updated] = await db.update(visitSessions).set({
      status: "ended",
      endedAt: new Date(),
      summary: summary ? String(summary) : null,
      updatedAt: new Date(),
    }).where(eq(visitSessions.id, session.id)).returning();
    res.json(updated);
  } catch (e) { next(e); }
}
