import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { appointments } from "../db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";
import { emitToAdmins, emitToPatient } from "../websocket/server";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, date } = req.query;
    let result = await db.query.appointments.findMany({
      with: { patient: { with: { user: true } }, doctor: { with: { user: true } } },
      orderBy: (appts, { asc }) => [asc(appts.scheduledDate), asc(appts.scheduledTime)],
    });
    if (status) result = result.filter(a => a.status === status);
    if (date) result = result.filter(a => a.scheduledDate === date);
    res.json(result);
  } catch (e) { next(e); }
}

export async function listByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = String(req.params.patientId);
    const result = await db.query.appointments.findMany({
      where: eq(appointments.patientId, patientId),
      with: { patient: { with: { user: true } }, doctor: { with: { user: true } } },
      orderBy: (appts, { desc }) => [desc(appts.scheduledDate), desc(appts.scheduledTime)],
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const appt = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: { patient: { with: { user: true } }, doctor: { with: { user: true } } },
    });
    if (!appt) throw new AppError("Appointment not found", 404);
    res.json(appt);
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const [appt] = await db.insert(appointments).values(req.body).returning();
    emitToAdmins("appointment:created", appt);
    if (appt.patientId) emitToPatient(appt.patientId, "appointment:created", appt);
    res.status(201).json(appt);
  } catch (e) { next(e); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const [appt] = await db.update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    if (!appt) throw new AppError("Appointment not found", 404);
    emitToAdmins("appointment:updated", appt);
    if (appt.patientId) emitToPatient(appt.patientId, "appointment:updated", appt);
    res.json(appt);
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const [appt] = await db.update(appointments)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    if (!appt) throw new AppError("Appointment not found", 404);
    emitToAdmins("appointment:updated", appt);
    if (appt.patientId) emitToPatient(appt.patientId, "appointment:updated", appt);
    res.json(appt);
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const [appt] = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    if (!appt) throw new AppError("Appointment not found", 404);
    emitToAdmins("appointment:deleted", appt);
    res.json({ message: "Appointment deleted" });
  } catch (e) { next(e); }
}
