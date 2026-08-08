import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const authRoutes = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const otpSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  code: z.string().length(6),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(10),
});

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

authRoutes.post("/login", validate(loginSchema), authController.login);
authRoutes.post("/login/verify-otp", validate(otpSchema), authController.verifyOtp);
authRoutes.post("/patient/login", validate(phoneLoginSchema), authController.patientLogin);
authRoutes.post("/patient/verify-otp", validate(otpSchema), authController.verifyPatientOtp);
authRoutes.post("/forgot-password", validate(resetSchema.pick({ email: true })), authController.forgotPassword);
authRoutes.post("/reset-password", validate(resetSchema), authController.resetPassword);
authRoutes.post("/logout", authenticate, authController.logout);
authRoutes.get("/me", authenticate, authController.getMe);
authRoutes.post("/refresh", authController.refreshToken);

export default authRoutes;
