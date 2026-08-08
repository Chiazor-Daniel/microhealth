import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/dashboard.controller";

export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);

dashboardRoutes.get("/kpi", authorize("admin","staff"), ctrl.getKpi);
dashboardRoutes.get("/alerts", authorize("admin","staff"), ctrl.getAlerts);
dashboardRoutes.get("/ward-occupancy", authorize("admin","staff"), ctrl.getWardOccupancy);
dashboardRoutes.get("/shift-summary", authorize("admin","staff"), ctrl.getShiftSummary);
dashboardRoutes.get("/patient-home", ctrl.getPatientDashboard);
