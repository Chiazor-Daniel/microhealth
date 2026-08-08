import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { vitals } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { emitToAdmins } from "../websocket/server";

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = String(req.params.patientId);
    const result = await db.query.vitals.findMany({
      where: eq(vitals.patientId, patientId),
      orderBy: [desc(vitals.recordedAt)],
      limit: 30,
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function getTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = String(req.params.patientId);
    const result = await db.query.vitals.findMany({
      where: eq(vitals.patientId, patientId),
      orderBy: [desc(vitals.recordedAt)],
      limit: 50,
    });
    const trends = result.reverse();
    res.json(trends);
  } catch (e) { next(e); }
}

export async function record(req: Request, res: Response, next: NextFunction) {
  try {
    const [vital] = await db.insert(vitals).values({
      ...req.body,
      recordedBy: req.user!.userId,
    }).returning();
    emitToAdmins("vital:recorded", vital);
    res.status(201).json(vital);
  } catch (e) { next(e); }
}

export async function getAbnormal(_req: Request, res: Response, next: NextFunction) {
  try {
    const all = await db.query.vitals.findMany({
      orderBy: [desc(vitals.recordedAt)],
      limit: 100,
      with: { patient: { with: { user: true } } },
    });
    const abnormal = all.filter(v =>
      (v.bloodPressureSystolic && v.bloodPressureSystolic > 140) ||
      (v.bloodPressureDiastolic && v.bloodPressureDiastolic > 90) ||
      (v.heartRate && (v.heartRate > 100 || v.heartRate < 60)) ||
      (v.spo2 && v.spo2 < 94) ||
      (v.temperature && Number(v.temperature) > 37.5)
    );
    res.json(abnormal);
  } catch (e) { next(e); }
}
