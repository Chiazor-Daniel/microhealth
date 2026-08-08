import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { inventory } from "../db/schema";
import { eq, desc, lt } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";
import { emitToAdmins } from "../websocket/server";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await db.query.inventory.findMany({
      orderBy: [desc(inventory.createdAt)],
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function getLowStock(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await db.query.inventory.findMany({
      where: lt(inventory.stock, inventory.minStock),
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.body.stock < req.body.minStock ? "low" : "ok";
    const [item] = await db.insert(inventory).values({ ...req.body, status }).returning();
    emitToAdmins("inventory:created", item);
    res.status(201).json(item);
  } catch (e) { next(e); }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const item = await db.query.inventory.findFirst({ where: eq(inventory.id, id) });
    if (!item) throw new AppError("Item not found", 404);
    const delta = req.body.delta || 0;
    const newStock = (item.stock || 0) + delta;
    const minStock = item.minStock || 0;
    const status = newStock < minStock ? "low" : newStock === 0 ? "critical" : "ok";
    const [updated] = await db.update(inventory)
      .set({ stock: newStock, status, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    if (status === "low" || status === "critical") {
      emitToAdmins("inventory:low-stock", updated);
    }
    emitToAdmins("inventory:updated", updated);
    res.json(updated);
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await db.delete(inventory).where(eq(inventory.id, id));
    res.json({ message: "Item deleted" });
  } catch (e) { next(e); }
}
