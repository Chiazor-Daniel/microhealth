import { Request, Response, NextFunction } from "express";
import { listQueue, actOnEscalation, staffActions } from "../agent/escalation";
import { AppError } from "../middleware/errorHandler";

/** Staff escalation queue — nurses and admins only. */
export async function queue(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    res.json(await listQueue(status as any));
  } catch (e) { next(e); }
}

export async function actions(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await staffActions());
  } catch (e) { next(e); }
}

export async function act(req: Request, res: Response, next: NextFunction) {
  try {
    const { action, note } = req.body;
    if (!action) throw new AppError("action is required", 400);
    const row = await actOnEscalation(String(req.params.id), req.user!.userId, { action: String(action), note: note ? String(note) : undefined });
    if (!row) throw new AppError("Escalation not found", 404);
    res.json(row);
  } catch (e) { next(e); }
}
