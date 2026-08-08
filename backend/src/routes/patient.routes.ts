import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/patient.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const patientRoutes = Router();
patientRoutes.use(authenticate);

const patientSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  patientCode: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().length(1).optional(),
  bloodGroup: z.string().max(5).optional(),
  diagnosis: z.string().optional(),
  status: z.enum(["active","critical","discharged","observation"]).optional(),
  ward: z.string().optional(),
  doctorId: z.string().optional(),
});

patientRoutes.get("/", authorize("admin","staff"), ctrl.list);
patientRoutes.get("/search", authorize("admin","staff"), ctrl.search);
patientRoutes.get("/:id", ctrl.getById);
patientRoutes.get("/:id/family", ctrl.listFamily);
patientRoutes.post("/:id/family", ctrl.addFamilyMember);
patientRoutes.delete("/:id/family/:memberId", ctrl.removeFamilyMember);
patientRoutes.post("/", authorize("admin","staff"), validate(patientSchema), ctrl.create);
patientRoutes.put("/:id", authorize("admin","staff"), validate(patientSchema), ctrl.update);
patientRoutes.delete("/:id", authorize("admin"), ctrl.remove);
