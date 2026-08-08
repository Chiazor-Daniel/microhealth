import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/lab.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const labRoutes = Router();
labRoutes.use(authenticate);

const schema = z.object({
  patientId: z.string(),
  testName: z.string(),
  doctorId: z.string().optional(),
});

labRoutes.get("/", authorize("admin","staff"), ctrl.list);
labRoutes.get("/patient/:patientId", ctrl.getByPatient);
labRoutes.post("/", authorize("admin","staff"), validate(schema), ctrl.order);
labRoutes.patch("/:id/status", authorize("admin","staff"), ctrl.updateStatus);
labRoutes.patch("/:id/result", authorize("admin","staff"), ctrl.addResult);
