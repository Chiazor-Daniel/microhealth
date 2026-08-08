import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/payment.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const paymentRoutes = Router();
paymentRoutes.use(authenticate);

const schema = z.object({
  patientId: z.string(),
  service: z.string(),
  amount: z.number(),
  method: z.string().optional(),
});

paymentRoutes.get("/", authorize("admin","staff"), ctrl.list);
paymentRoutes.get("/patient/:patientId", ctrl.getByPatient);
paymentRoutes.get("/stats", authorize("admin","staff"), ctrl.getStats);
paymentRoutes.post("/", authorize("admin","staff"), validate(schema), ctrl.create);
paymentRoutes.patch("/:id/status", authorize("admin","staff"), ctrl.updateStatus);
