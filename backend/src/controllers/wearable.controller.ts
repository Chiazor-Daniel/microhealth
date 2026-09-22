import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { vitals } from "../db/schema";
import { emitToPatient } from "../websocket/server";
import { AppError } from "../middleware/errorHandler";
import { persistAndEmit } from "../agent/insights";

export interface WearableReadingBody {
  patientId: string;
  timestamp: string;
  heartRate?: number;
  spo2?: number;
  temperature?: number;
  systolic?: number;
  diastolic?: number;
  bloodSugar?: number;
  weight?: number;
  /* Wide-packet additions — the band reports these on the same tick, so they
     land on the same row. See the `vitals` table for why they share it. */
  respiratoryRate?: number;
  hrv?: number;
  stress?: number;
  fatigue?: number;
  gsr?: number;
}

export async function receiveReading(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as WearableReadingBody;
    const patientId = String(body.patientId);
    if (!patientId) throw new AppError("patientId is required", 400);

    const [record] = await db.insert(vitals).values({
      patientId,
      heartRate: body.heartRate,
      spo2: body.spo2,
      temperature: body.temperature,
      bloodPressureSystolic: body.systolic,
      bloodPressureDiastolic: body.diastolic,
      bloodSugar: body.bloodSugar,
      weight: body.weight,
      respiratoryRate: body.respiratoryRate,
      hrv: body.hrv,
      stress: body.stress,
      fatigue: body.fatigue,
      gsr: body.gsr,
      recordedAt: body.timestamp ? new Date(body.timestamp) : new Date(),
    }).returning();

    // Notify the patient's connected devices in real time
    emitToPatient(req.user!.userId, "vital:updated", record);

    // Run the agent on the new reading and emit any proactive insights
    try {
      const { evaluateAll } = await import("../agent/engine");
      const insights = await evaluateAll(req.user!.userId);
      for (const insight of insights) {
        try {
          await persistAndEmit(insight, req.user!.userId);
        } catch (e) {
          console.error("[wearable] insight persist failed:", e);
        }
      }
    } catch (err) {
      console.error("[wearable] agent processing failed:", err);
    }

    res.status(201).json(record);
  } catch (e) { next(e); }
}

export async function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = String(req.params.patientId);
    // MVP: return a mock status since there is no real device yet
    res.json({
      connected: true,
      deviceName: "MicroHealth Band",
      batteryLevel: 78,
      lastSynced: new Date().toISOString(),
    });
  } catch (e) { next(e); }
}
