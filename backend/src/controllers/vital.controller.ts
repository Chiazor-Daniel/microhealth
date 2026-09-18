import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { vitals, metricReadings } from "../db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
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
      (v.temperature && Number(v.temperature) > 37.5) ||
      /* The wide-packet measures are just as capable of flagging a patient,
         and an abnormal screen that ignored them would quietly miss a
         respiratory decline. Bands mirror the registry. */
      (v.respiratoryRate != null && (v.respiratoryRate < 12 || v.respiratoryRate > 20)) ||
      (v.spo2 != null && v.respiratoryRate != null && v.spo2 < 92) ||
      (v.stress != null && v.stress > 75) ||
      (v.fatigue != null && v.fatigue > 75)
    );
    res.json(abnormal);
  } catch (e) { next(e); }
}

/* ------------------------------------------------------------------ */
/* Metric readings — anything recorded on its own schedule             */
/* ------------------------------------------------------------------ */

/**
 * Readings for a patient, newest first.
 *
 * Optionally narrowed to specific metrics, so a screen showing one chart does
 * not pull the patient's whole history to draw it.
 */
export async function getMetricReadings(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = String(req.params.patientId);
    const keys = String(req.query.keys ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const where = keys.length
      ? and(eq(metricReadings.patientId, patientId), inArray(metricReadings.metricKey, keys))
      : eq(metricReadings.patientId, patientId);

    const result = await db.query.metricReadings.findMany({
      where,
      orderBy: [desc(metricReadings.recordedAt)],
      limit: Number(req.query.limit ?? 200),
    });
    res.json(result);
  } catch (e) { next(e); }
}

/**
 * The most recent reading of *each* requested metric.
 *
 * A dashboard wants one current value per metric, not the whole series — and
 * fetching the series and taking the first of each would grow with how long
 * the patient has been wearing the band.
 */
export async function getLatestMetricReadings(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = String(req.params.patientId);
    const keys = String(req.query.keys ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (!keys.length) return res.json({});

    const rows = await db.query.metricReadings.findMany({
      where: and(eq(metricReadings.patientId, patientId), inArray(metricReadings.metricKey, keys)),
      orderBy: [desc(metricReadings.recordedAt)],
    });

    const latest: Record<string, unknown> = {};
    for (const row of rows) {
      if (!latest[row.metricKey]) latest[row.metricKey] = row;
    }
    res.json(latest);
  } catch (e) { next(e); }
}

export async function recordMetricReading(req: Request, res: Response, next: NextFunction) {
  try {
    const [reading] = await db.insert(metricReadings).values({
      ...req.body,
      recordedAt: req.body.recordedAt ?? new Date(),
    }).returning();
    emitToAdmins("vital:recorded", reading);
    res.status(201).json(reading);
  } catch (e) { next(e); }
}
