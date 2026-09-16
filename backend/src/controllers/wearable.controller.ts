import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { vitals } from "../db/schema";
import { emitToPatient } from "../websocket/server";
import { AppError } from "../middleware/errorHandler";
import { processVitalEvent } from "../agent/engine";
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
      recordedAt: body.timestamp ? new Date(body.timestamp) : new Date(),
    }).returning();

    // Notify the patient's connected devices in real time
    emitToPatient(req.user!.userId, "vital:updated", record);

    // Run the agent on the new reading and emit any proactive insight
    try {
      const insight = await processVitalEvent(req.user!.userId);
      if (insight) {
        await persistAndEmit(insight, req.user!.userId);
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
