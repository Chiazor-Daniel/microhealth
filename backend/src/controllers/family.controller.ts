import { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/errorHandler";
import * as groups from "../family/groups";
import type { FamilyRole } from "../db/schema";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;
    if (!role) throw new AppError("role is required", 400);
    res.status(201).json(await groups.createGroup(req.user!.userId, role as FamilyRole));
  } catch (e) { next(e); }
}

export async function mine(req: Request, res: Response, next: NextFunction) {
  try {
    const { db } = await import("../config/database");
    const { patients } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");
    const patient = await db.query.patients.findFirst({ where: eq(patients.userId, req.user!.userId) });
    if (!patient) {
      res.json([]);
      return;
    }
    res.json(await groups.myGroups(patient.id));
  } catch (e) { next(e); }
}

export async function members(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await groups.listMembers(req.user!.userId, String(req.params.id)));
  } catch (e) { next(e); }
}

export async function invite(req: Request, res: Response, next: NextFunction) {
  try {
    const { contact, role } = req.body;
    if (!contact || !role) throw new AppError("contact and role are required", 400);
    res.status(201).json(await groups.invite(req.user!.userId, String(req.params.id), String(contact), role as FamilyRole));
  } catch (e) { next(e); }
}

export async function accept(req: Request, res: Response, next: NextFunction) {
  try {
    const { db } = await import("../config/database");
    const { patients } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");
    const patient = await db.query.patients.findFirst({ where: eq(patients.userId, req.user!.userId) });
    if (!patient) throw new AppError("Patient not found", 404);
    res.json({ claimed: await groups.claimInvites(patient.id) });
  } catch (e) { next(e); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await groups.removeMembership(req.user!.userId, String(req.params.membershipId)));
  } catch (e) { next(e); }
}
