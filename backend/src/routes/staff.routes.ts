import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/staff.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const staffRoutes = Router();
staffRoutes.use(authenticate);

const schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(["on-duty","off-duty"]).optional(),
});

staffRoutes.get("/", authorize("admin","staff"), ctrl.list);
staffRoutes.get("/:id", authorize("admin","staff"), ctrl.getById);
staffRoutes.patch("/:id/status", authorize("admin","staff"), ctrl.updateStatus);
staffRoutes.post("/", authorize("admin"), validate(schema), ctrl.create);
