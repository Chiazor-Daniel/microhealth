import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { patients } from "../db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "./errorHandler";
import { requireViewer } from "../family/authorization";

/**
 * Guards `:patientId`-scoped reads (vitals, trends, labs, prescriptions,
 * appointments). Staff/admin keep clinical access; patients pass through
 * family authorization: self or an active shared group, nothing else.
 */
export async function authorizePatientParam(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    if (req.user.role === "staff" || req.user.role === "admin") {
      next();
      return;
    }
    const subjectId = String(req.params.patientId);
    const viewer = await db.query.patients.findFirst({ where: eq(patients.userId, req.user.userId) });
    if (!viewer) throw new AppError("Patient not found", 404);
    await requireViewer(viewer.id, subjectId);
    next();
  } catch (e) { next(e); }
}
