import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/escalation.controller";

/** Nurse escalation queue. Nurses and admins only — never patients. */
export const escalationRoutes = Router();
escalationRoutes.use(authenticate, authorize("staff", "admin"));

escalationRoutes.get("/queue", ctrl.queue);
escalationRoutes.get("/actions", ctrl.actions);
escalationRoutes.post("/queue/:id/act", ctrl.act);
