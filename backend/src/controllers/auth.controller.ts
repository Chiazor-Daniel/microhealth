import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { db } from "../config/database";
import { users, staff, patients } from "../db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler";

function generateTokens(payload: { userId: string; role: string }) {
  const access = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions);
  const refresh = jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
  return { access, refresh };
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user || !user.passwordHash) throw new AppError("Invalid credentials", 401);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401);
    const tokens = generateTokens({ userId: user.id, role: user.role });
    res.cookie("token", tokens.access, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 86400000 });
    res.json({ token: tokens.access, refreshToken: tokens.refresh, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } });
  } catch (e) { next(e); }
}

export async function verifyOtp(_req: Request, _res: Response, _next: NextFunction) {
  throw new AppError("OTP flow is disabled", 400);
}

export async function patientLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const rawPhone = req.body.phone || "";
    const phone = String(rawPhone).replace(/\s+/g, "").replace(/^0/, "+234");
    const user = await db.query.users.findFirst({ where: eq(users.phone, phone) });
    if (!user) throw new AppError("No account found for this phone number", 404);
    const tokens = generateTokens({ userId: user.id, role: user.role });
    res.cookie("token", tokens.access, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 86400000 });
    res.json({ token: tokens.access, refreshToken: tokens.refresh, user: { id: user.id, role: user.role, firstName: user.firstName, lastName: user.lastName } });
  } catch (e) { next(e); }
}

export async function verifyPatientOtp(_req: Request, _res: Response, _next: NextFunction) {
  throw new AppError("OTP flow is disabled", 400);
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (user) {
      const resetToken = jwt.sign({ userId: user.id, purpose: "reset" }, config.JWT_SECRET, { expiresIn: "15m" } as jwt.SignOptions);
      // In production, email this token
      console.log(`[dev] Reset token for ${email}: ${resetToken}`);
    }
    res.json({ message: "If an account exists, a reset link has been sent" });
  } catch (e) { next(e); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;
    const payload = jwt.verify(token, config.JWT_SECRET) as { userId: string; purpose: string };
    if (payload.purpose !== "reset") throw new AppError("Invalid token", 400);
    const hash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, payload.userId));
    res.json({ message: "Password reset successful" });
  } catch (e) { next(e); }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.userId) });
    if (!user) throw new AppError("User not found", 404);
    let profile = null;
    if (user.role === "patient") {
      profile = await db.query.patients.findFirst({ where: eq(patients.userId, user.id) });
    } else if (user.role === "admin" || user.role === "staff") {
      profile = await db.query.staff.findFirst({ where: eq(staff.userId, user.id) });
    }
    res.json({ ...user, profile, passwordHash: undefined });
  } catch (e) { next(e); }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new AppError("No token", 401);
    const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as { userId: string; role: string };
    const tokens = generateTokens({ userId: payload.userId, role: payload.role });
    res.cookie("token", tokens.access, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 86400000 });
    res.json({ token: tokens.access });
  } catch (e) { next(e); }
}
