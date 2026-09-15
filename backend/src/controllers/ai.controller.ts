import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { aiInsights, patients } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";
import { listInsights as listAgentInsights, markRead as markInsightRead, dismiss as dismissInsight } from "../agent/insights";
import { respondToChat } from "../agent/engine";

export async function listInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await db.query.patients.findFirst({
      where: eq(patients.userId, req.user!.userId),
    });
    if (!patient) throw new AppError("Patient not found", 404);
    const insights = await listAgentInsights(patient.id);
    res.json(insights);
  } catch (e) { next(e); }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await markInsightRead(String(req.params.id));
    res.json(record);
  } catch (e) { next(e); }
}

export async function dismiss(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await dismissInsight(String(req.params.id));
    res.json(record);
  } catch (e) { next(e); }
}

export async function chat(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, history } = req.body;
    if (!message) throw new AppError("message is required", 400);
    const reply = await respondToChat(req.user!.userId, String(message), history ? String(history) : undefined);
    res.json(reply);
  } catch (e) { next(e); }
}
