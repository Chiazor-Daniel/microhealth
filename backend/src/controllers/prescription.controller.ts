import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { prescriptions } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";
import { emitToAdmins, emitToPatient } from "../websocket/server";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await db.query.prescriptions.findMany({
      with: { patient: { with: { user: true } }, doctor: { with: { user: true } } },
      orderBy: [desc(prescriptions.issuedAt)],
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = String(req.params.patientId);
    const result = await db.query.prescriptions.findMany({
      where: eq(prescriptions.patientId, patientId),
      with: { doctor: { with: { user: true } } },
      orderBy: [desc(prescriptions.issuedAt)],
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const [rx] = await db.insert(prescriptions).values(req.body).returning();
    emitToAdmins("prescription:created", rx);
    if (rx.patientId) emitToPatient(rx.patientId, "prescription:created", rx);
    res.status(201).json(rx);
  } catch (e) { next(e); }
}

export async function dispense(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const [rx] = await db.update(prescriptions)
      .set({ status: "dispensed", updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    if (!rx) throw new AppError("Prescription not found", 404);
    emitToAdmins("prescription:dispensed", rx);
    if (rx.patientId) emitToPatient(rx.patientId, "prescription:dispensed", rx);
    res.json(rx);
  } catch (e) { next(e); }
}

export async function requestRefill(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const rx = await db.query.prescriptions.findFirst({ where: eq(prescriptions.id, id) });
    if (!rx) throw new AppError("Prescription not found", 404);
    emitToAdmins("prescription:refill-requested", rx);
    res.json({ message: "Refill requested", prescription: rx });
  } catch (e) { next(e); }
}
