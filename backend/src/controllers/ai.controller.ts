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
    const { message, history, subjectPatientId } = req.body;
    if (!message) throw new AppError("message is required", 400);
    const reply = await respondToChat(
      req.user!.userId,
      String(message),
      history ? String(history) : undefined,
      subjectPatientId ? String(subjectPatientId) : undefined
    );
    res.json(reply);
  } catch (e) { next(e); }
}

export async function evaluate(req: Request, res: Response, next: NextFunction) {
  try {
    const { evaluateAll } = await import("../agent/engine");
    const { persistAndEmit } = await import("../agent/insights");
    const insights = await evaluateAll(req.user!.userId);
    for (const i of insights) {
      try { await persistAndEmit(i, req.user!.userId); } catch (e) { console.error("[ai] persist failed:", e); }
    }
    res.json(insights);
  } catch (e) { next(e); }
}

export async function confirmMedication(req: Request, res: Response, next: NextFunction) {
  try {
    const { confirmDose } = await import("../agent/adherence");
    const { persistAndEmit } = await import("../agent/insights");
    const reply = await confirmDose(req.user!.userId, String(req.params.logId));
    if (!reply) throw new AppError("Dose log not found", 404);
    try { await persistAndEmit(reply, req.user!.userId); } catch (e) { console.error("[ai] persist failed:", e); }
    res.json(reply);
  } catch (e) { next(e); }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const { generateSummary } = await import("../agent/summary");
    const period = (String(req.query.period ?? "week") === "month" ? "month" : "week") as "week" | "month";
    const { persistAndEmit } = await import("../agent/insights");
    const reply = await generateSummary(req.user!.userId, period);
    if (!reply) throw new AppError("Patient not found", 404);
    try { await persistAndEmit(reply, req.user!.userId); } catch (e) { console.error("[ai] persist failed:", e); }
    res.json(reply);
  } catch (e) { next(e); }
}

export async function caregiverPrefs(req: Request, res: Response, next: NextFunction) {
  try {
    const { getPrefs, setPrefs } = await import("../agent/caregivers");
    const patient = await db.query.patients.findFirst({ where: eq(patients.userId, req.user!.userId) });
    if (!patient) throw new AppError("Patient not found", 404);
    if (req.method === "GET") {
      res.json(await getPrefs(patient.id));
      return;
    }
    const { familyMemberId, contactPhone, alertAbnormal, alertMissedMedication, alertUrgent } = req.body;
    if (!familyMemberId) throw new AppError("familyMemberId is required", 400);
    res.json(await setPrefs(patient.id, { familyMemberId, contactPhone, alertAbnormal, alertMissedMedication, alertUrgent }));
  } catch (e) { next(e); }
}
