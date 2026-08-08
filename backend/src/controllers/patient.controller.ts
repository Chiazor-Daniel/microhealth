import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { patients, users, familyMembers } from "../db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const all = await db.query.patients.findMany({
      with: { doctor: true, user: true },
    });
    res.json(all);
  } catch (e) { next(e); }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, status, bloodGroup, gender } = req.query;
    let result = await db.query.patients.findMany({
      with: { doctor: true, user: true },
    });
    if (q) {
      const term = String(q).toLowerCase();
      result = result.filter(p =>
        p.user?.firstName?.toLowerCase().includes(term) ||
        p.user?.lastName?.toLowerCase().includes(term) ||
        p.patientCode?.toLowerCase().includes(term) ||
        p.diagnosis?.toLowerCase().includes(term)
      );
    }
    if (status) result = result.filter(p => p.status === status);
    if (bloodGroup) result = result.filter(p => p.bloodGroup === bloodGroup);
    if (gender) result = result.filter(p => p.gender === gender);
    res.json(result);
  } catch (e) { next(e); }
}

export async function listFamily(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const patient = await db.query.patients.findFirst({ where: eq(patients.userId, userId) });
    if (!patient) return res.json([]);
    const result = await db.query.familyMembers.findMany({
      where: eq(familyMembers.patientId, patient.id),
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function addFamilyMember(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const patient = await db.query.patients.findFirst({ where: eq(patients.userId, userId) });
    if (!patient) throw new AppError("Patient not found", 404);
    const [member] = await db.insert(familyMembers).values({
      patientId: patient.id,
      name: req.body.name,
      relation: req.body.relation,
      age: req.body.age,
      status: req.body.status || "active",
    }).returning();
    res.status(201).json(member);
  } catch (e) { next(e); }
}

export async function removeFamilyMember(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await db.delete(familyMembers).where(eq(familyMembers.id, id));
    res.json({ message: "Family member removed" });
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const p = await db.query.patients.findFirst({
      where: eq(patients.id, id),
      with: { doctor: true, user: true },
    });
    if (!p) throw new AppError("Patient not found", 404);
    res.json(p);
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email, phone, ...patientData } = req.body;
    const [user] = await db.insert(users).values({
      firstName: firstName || "New",
      lastName: lastName || "Patient",
      email,
      phone,
      role: "patient",
    }).returning();
    const [p] = await db.insert(patients).values({
      ...patientData,
      userId: user.id,
      patientCode: `MH-${Math.floor(1000 + Math.random() * 9000)}`,
    }).returning();
    res.status(201).json({ ...p, user });
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const existing = await db.query.patients.findFirst({ where: eq(patients.id, id), with: { user: true } });
    if (!existing) throw new AppError("Patient not found", 404);
    const { firstName, lastName, email, phone, ...patientData } = req.body;
    if (firstName || lastName || email || phone) {
      await db.update(users)
        .set({
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
          ...(phone && { phone }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, String(existing.userId)));
    }
    const [p] = await db.update(patients)
      .set({ ...patientData, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    res.json({ ...p, user: existing.user });
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await db.delete(patients).where(eq(patients.id, id));
    res.json({ message: "Patient deleted" });
  } catch (e) { next(e); }
}
