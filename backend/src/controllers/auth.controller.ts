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
    /* Invited family rows waiting on this contact activate here. Additive:
       auth never fails because of it. */
    if (user.role === "patient") {
      const { patients } = await import("../db/schema");
      const patient = await db.query.patients.findFirst({ where: eq(patients.userId, user.id) });
      if (patient) {
        const { claimInvites } = await import("../family/groups");
        await claimInvites(patient.id).catch(() => {});
      }
    }
    res.cookie("token", tokens.access, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 86400000 });
    res.json({ token: tokens.access, refreshToken: tokens.refresh, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } });
  } catch (e) { next(e); }
}

export async function verifyOtp(_req: Request, _res: Response, _next: NextFunction) {
  throw new AppError("OTP flow is disabled", 400);
}

/**
 * Create a patient account.
 *
 * A signed-up patient starts genuinely empty — no vitals, no appointments —
 * which is the state the app has to be able to present well, so nothing is
 * fabricated here to make the screen look busier.
 *
 * Tokens come back in the same shape as `login`, so the client can drop the
 * person straight into the app rather than bouncing them to a sign-in screen
 * to retype what they just chose.
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;
    const firstName = String(req.body.firstName).trim();
    const lastName = String(req.body.lastName ?? "").trim();

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      throw new AppError("An account with that email already exists", 409, "EMAIL_TAKEN");
    }

    /* Matches the cost factor the seed uses, so a registered account and a
       seeded one are indistinguishable to the login path. */
    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, role: "patient", firstName, lastName })
      .returning();

    /* Every patient needs a record — it is what vitals, appointments and
       insights hang off — so it is created with the account rather than left
       for later. The code is derived from the id, which is already unique, so
       there is no counter to race on. */
    const [patient] = await db.insert(patients).values({
      userId: user.id,
      patientCode: `MH-${user.id.slice(0, 6).toUpperCase()}`,
      status: "active",
    }).returning();

    /* A fresh account may complete a pending family invite. */
    const { claimInvites } = await import("../family/groups");
    await claimInvites(patient.id).catch(() => {});

    const tokens = generateTokens({ userId: user.id, role: user.role });
    res.cookie("token", tokens.access, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 86400000 });
    res.status(201).json({
      token: tokens.access,
      refreshToken: tokens.refresh,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (e) {
    next(e);
  }
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
