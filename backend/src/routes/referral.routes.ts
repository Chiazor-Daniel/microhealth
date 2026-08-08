import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/referral.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const referralRoutes = Router();
referralRoutes.use(authenticate);

const schema = z.object({
  patientId: z.string(),
  toFacility: z.string(),
  reason: z.string().optional(),
  referralDate: z.string().optional(),
});

referralRoutes.get("/", authorize("admin","staff"), ctrl.list);
referralRoutes.post("/", authorize("admin","staff"), validate(schema), ctrl.create);
referralRoutes.patch("/:id/status", authorize("admin","staff"), ctrl.updateStatus);
