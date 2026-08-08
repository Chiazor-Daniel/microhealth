import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/prescription.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const prescriptionRoutes = Router();
prescriptionRoutes.use(authenticate);

const schema = z.object({
  patientId: z.string(),
  medicine: z.string(),
  dosage: z.string(),
  duration: z.string().optional(),
  doctorId: z.string().optional(),
  refills: z.number().optional(),
  expiryDate: z.string().optional(),
});

prescriptionRoutes.get("/", authorize("admin","staff"), ctrl.list);
prescriptionRoutes.get("/patient/:patientId", ctrl.getByPatient);
prescriptionRoutes.post("/", authorize("admin","staff"), validate(schema), ctrl.create);
prescriptionRoutes.patch("/:id/dispense", authorize("admin","staff"), ctrl.dispense);
prescriptionRoutes.post("/:id/refill", ctrl.requestRefill);
