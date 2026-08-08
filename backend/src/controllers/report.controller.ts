import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { patients, payments, appointments } from "../db/schema";
import { eq, sql, count } from "drizzle-orm";

export async function getDemographics(_req: Request, res: Response, next: NextFunction) {
  try {
    const all = await db.query.patients.findMany();
    const ageGroups = [
      { age: "0–12", count: all.filter(p => (p.age || 0) <= 12).length },
      { age: "13–25", count: all.filter(p => (p.age || 0) > 12 && (p.age || 0) <= 25).length },
      { age: "26–40", count: all.filter(p => (p.age || 0) > 25 && (p.age || 0) <= 40).length },
      { age: "41–60", count: all.filter(p => (p.age || 0) > 40 && (p.age || 0) <= 60).length },
      { age: "61+", count: all.filter(p => (p.age || 0) > 60).length },
    ];
    const gender = { M: all.filter(p => p.gender === "M").length, F: all.filter(p => p.gender === "F").length };
    res.json({ ageGroups, gender, total: all.length });
  } catch (e) { next(e); }
}

export async function getRevenue(_req: Request, res: Response, next: NextFunction) {
  try {
    const [stats] = await db.select({
      total: sql`sum(amount)::float`.mapWith(Number),
      count: sql`count(*)`.mapWith(Number),
    }).from(payments).where(eq(payments.status, "paid"));
    const dailyRevenue = await db.select({
      day: sql`date(paid_at)::text`,
      revenue: sql`sum(amount)::float`.mapWith(Number),
      transactions: sql`count(*)`.mapWith(Number),
    }).from(payments).where(eq(payments.status, "paid")).groupBy(sql`date(paid_at)`).orderBy(sql`date(paid_at)`);
    res.json({ totalRevenue: stats?.total || 0, totalTransactions: stats?.count || 0, dailyRevenue });
  } catch (e) { next(e); }
}

export async function getPatientTrends(_req: Request, res: Response, next: NextFunction) {
  try {
    const monthly = await db.select({
      month: sql`to_char(created_at, 'Mon')::text`,
      count: sql`count(*)`.mapWith(Number),
    }).from(patients).groupBy(sql`to_char(created_at, 'Mon'), date_trunc('month', created_at)`).orderBy(sql`date_trunc('month', created_at)`);
    res.json(monthly);
  } catch (e) { next(e); }
}

export async function getDepartmentRevenue(_req: Request, res: Response, next: NextFunction) {
  try {
    const all = await db.query.payments.findMany({ where: eq(payments.status, "paid") });
    const deptMap: Record<string, number> = {};
    all.forEach(p => {
      const dept = p.service?.split(" ")[0] || "Other";
      deptMap[dept] = (deptMap[dept] || 0) + (Number(p.amount) || 0);
    });
    const total = Object.values(deptMap).reduce((a, b) => a + b, 0);
    const result = Object.entries(deptMap).map(([dept, value]) => ({ dept, value: total ? Math.round((value / total) * 100) : 0 }));
    res.json(result);
  } catch (e) { next(e); }
}
