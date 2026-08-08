import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/vital.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const vitalRoutes = Router();
vitalRoutes.use(authenticate);

const schema = z.object({
  patientId: z.string(),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  heartRate: z.number().optional(),
  temperature: z.number().optional(),
  spo2: z.number().optional(),
  bloodSugar: z.number().optional(),
  weight: z.number().optional(),
  notes: z.string().optional(),
});

vitalRoutes.get("/patient/:patientId", ctrl.getByPatient);
vitalRoutes.get("/trends/:patientId", ctrl.getTrends);
vitalRoutes.post("/", authorize("admin","staff"), validate(schema), ctrl.record);
vitalRoutes.get("/abnormal", authorize("admin","staff"), ctrl.getAbnormal);
