import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { patients, appointments, staff, vitals, prescriptions, familyMembers, labTests } from "../db/schema";
import { eq, sql, and } from "drizzle-orm";

function today() { return new Date().toISOString().split("T")[0]; }

export async function getKpi(_req: Request, res: Response, next: NextFunction) {
  try {
    const [totalPatients] = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(patients);
    const t = today();
    const [apptsToday] = await db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(appointments).where(eq(appointments.scheduledDate, t));
    const [critical] = await db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(patients).where(eq(patients.status, "critical"));
    const [onDuty] = await db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(staff).where(eq(staff.status, "on-duty"));

    res.json({
      totalPatients: totalPatients?.count || 0,
      appointmentsToday: apptsToday?.count || 0,
      criticalCases: critical?.count || 0,
      staffOnDuty: onDuty?.count || 0,
    });
  } catch (e) { next(e); }
}

export async function getAlerts(_req: Request, res: Response, next: NextFunction) {
  try {
    const abnormalVitals = await db.query.vitals.findMany({
      with: { patient: { with: { user: true } } },
      limit: 20,
    });
    const alerts = abnormalVitals
      .filter(v => (v.bloodPressureSystolic && v.bloodPressureSystolic > 160) || (v.spo2 && v.spo2 < 92))
      .map(v => ({
        patient: v.patient?.user ? `${v.patient.user.firstName} ${v.patient.user.lastName}` : "Unknown",
        patientId: v.patientId,
        alert: v.bloodPressureSystolic && v.bloodPressureSystolic > 160
          ? `BP elevated — ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic} mmHg`
          : `Low SpO₂ — ${v.spo2}%`,
        severity: "high",
        time: v.recordedAt,
      }));
    res.json(alerts);
  } catch (e) { next(e); }
}

export async function getWardOccupancy(_req: Request, res: Response, next: NextFunction) {
  try {
    const allPatients = await db.query.patients.findMany({
      where: and(eq(patients.status, "active"), sql`${patients.ward} IS NOT NULL`),
    });
    const wardMap: Record<string, { occupied: number; capacity: number }> = {};
    allPatients.forEach(p => {
      const ward = p.ward?.split("-")[0] || p.ward || "Other";
      if (!wardMap[ward]) wardMap[ward] = { occupied: 0, capacity: 30 };
      wardMap[ward].occupied++;
    });
    const result = Object.entries(wardMap).map(([ward, data]) => ({
      ward,
      capacity: data.capacity,
      occupied: data.occupied,
    }));
    res.json(result);
  } catch (e) { next(e); }
}

export async function getShiftSummary(_req: Request, res: Response, next: NextFunction) {
  try {
    const [onDutyNurses] = await db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(staff).where(and(eq(staff.status, "on-duty"), sql`lower(${staff.role}) like '%nurse%'`));
    const [pendingLabs] = await db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(labTests).where(eq(labTests.status, "pending"));

    res.json({
      nursesOnDuty: onDutyNurses?.count || 0,
      pendingLabs: pendingLabs?.count || 0,
    });
  } catch (e) { next(e); }
}

export async function getPatientDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const patient = await db.query.patients.findFirst({
      where: eq(patients.userId, userId),
    });
    if (!patient) return res.json({ nextAppointment: null, vitals: [], prescriptions: [] });

    const t = today();
    const nextAppt = await db.query.appointments.findFirst({
      where: and(eq(appointments.patientId, patient.id), sql`${appointments.scheduledDate} >= ${t}`),
      with: { doctor: { with: { user: true } } },
      orderBy: (appts, { asc }) => [asc(appts.scheduledDate)],
    });

    const latestVitals = await db.query.vitals.findMany({
      where: eq(vitals.patientId, patient.id),
      orderBy: (v, { desc }) => [desc(v.recordedAt)],
      limit: 3,
    });

    const activePrescriptions = await db.query.prescriptions.findMany({
      where: and(eq(prescriptions.patientId, patient.id), eq(prescriptions.status, "pending")),
      limit: 5,
    });

    const family = await db.query.familyMembers.findMany({
      where: eq(familyMembers.patientId, patient.id),
    });

    res.json({ nextAppointment: nextAppt, vitals: latestVitals, prescriptions: activePrescriptions, family });
  } catch (e) { next(e); }
}
