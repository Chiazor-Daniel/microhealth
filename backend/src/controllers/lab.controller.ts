import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { labTests } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";
import { emitToAdmins, emitToPatient } from "../websocket/server";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await db.query.labTests.findMany({
      with: { patient: { with: { user: true } }, doctor: { with: { user: true } } },
      orderBy: [desc(labTests.orderedAt)],
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = String(req.params.patientId);
    const result = await db.query.labTests.findMany({
      where: eq(labTests.patientId, patientId),
      with: { doctor: { with: { user: true } } },
      orderBy: [desc(labTests.orderedAt)],
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function order(req: Request, res: Response, next: NextFunction) {
  try {
    const [lab] = await db.insert(labTests).values(req.body).returning();
    emitToAdmins("lab:ordered", lab);
    if (lab.patientId) emitToPatient(lab.patientId, "lab:ordered", lab);
    res.status(201).json(lab);
  } catch (e) { next(e); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const [lab] = await db.update(labTests)
      .set({ status, updatedAt: new Date() })
      .where(eq(labTests.id, id))
      .returning();
    if (!lab) throw new AppError("Lab test not found", 404);
    emitToAdmins("lab:updated", lab);
    if (lab.patientId) emitToPatient(lab.patientId, "lab:updated", lab);
    res.json(lab);
  } catch (e) { next(e); }
}

export async function addResult(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { result, resultNotes } = req.body;
    const [lab] = await db.update(labTests)
      .set({ result, resultNotes, status: "completed", updatedAt: new Date() })
      .where(eq(labTests.id, id))
      .returning();
    if (!lab) throw new AppError("Lab test not found", 404);
    emitToAdmins("lab:result", lab);
    if (lab.patientId) emitToPatient(lab.patientId, "lab:result", lab);
    res.json(lab);
  } catch (e) { next(e); }
}
