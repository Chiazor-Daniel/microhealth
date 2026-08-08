import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { referrals } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";
import { emitToAdmins } from "../websocket/server";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await db.query.referrals.findMany({
      with: { patient: { with: { user: true } }, fromDoctor: { with: { user: true } } },
      orderBy: [desc(referrals.referralDate)],
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const [ref] = await db.insert(referrals).values(req.body).returning();
    emitToAdmins("referral:created", ref);
    res.status(201).json(ref);
  } catch (e) { next(e); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const [ref] = await db.update(referrals)
      .set({ status, updatedAt: new Date() })
      .where(eq(referrals.id, id))
      .returning();
    if (!ref) throw new AppError("Referral not found", 404);
    emitToAdmins("referral:updated", ref);
    res.json(ref);
  } catch (e) { next(e); }
}
