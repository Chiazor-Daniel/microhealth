import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/report.controller";

export const reportRoutes = Router();
reportRoutes.use(authenticate);
reportRoutes.use(authorize("admin","staff"));

reportRoutes.get("/demographics", ctrl.getDemographics);
reportRoutes.get("/revenue", ctrl.getRevenue);
reportRoutes.get("/patient-trends", ctrl.getPatientTrends);
reportRoutes.get("/department-revenue", ctrl.getDepartmentRevenue);
