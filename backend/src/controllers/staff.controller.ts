import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { staff, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await db.query.staff.findMany({
      with: { user: true },
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const s = await db.query.staff.findFirst({
      where: eq(staff.id, id),
      with: { user: true },
    });
    if (!s) throw new AppError("Staff not found", 404);
    res.json(s);
  } catch (e) { next(e); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const [s] = await db.update(staff)
      .set({ status, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    if (!s) throw new AppError("Staff not found", 404);
    res.json(s);
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email, phone, ...staffData } = req.body;
    const [user] = await db.insert(users).values({
      firstName: firstName || "New",
      lastName: lastName || "Staff",
      email,
      phone,
      role: "staff",
    }).returning();
    const [s] = await db.insert(staff).values({
      ...staffData,
      userId: user.id,
      patientCount: 0,
    }).returning();
    res.status(201).json({ ...s, user });
  } catch (e) { next(e); }
}
