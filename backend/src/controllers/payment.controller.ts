import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { payments } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";
import { emitToAdmins } from "../websocket/server";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await db.query.payments.findMany({
      with: { patient: { with: { user: true } } },
      orderBy: [desc(payments.createdAt)],
      limit: 100,
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function getByPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = String(req.params.patientId);
    const result = await db.query.payments.findMany({
      where: eq(payments.patientId, patientId),
      orderBy: [desc(payments.createdAt)],
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [total] = await db.select({ count: sql`count(*)`.mapWith(Number), sum: sql`sum(amount)` })
      .from(payments)
      .where(eq(payments.status, "paid"));
    const [pending] = await db.select({ count: sql`count(*)`.mapWith(Number), sum: sql`sum(amount)` })
      .from(payments)
      .where(eq(payments.status, "pending"));
    res.json({ totalPaid: total, totalPending: pending });
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const [payment] = await db.insert(payments).values(req.body).returning();
    emitToAdmins("payment:created", payment);
    res.status(201).json(payment);
  } catch (e) { next(e); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const [payment] = await db.update(payments)
      .set({ status, paidAt: status === "paid" ? new Date() : null, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    if (!payment) throw new AppError("Payment not found", 404);
    emitToAdmins("payment:updated", payment);
    res.json(payment);
  } catch (e) { next(e); }
}
