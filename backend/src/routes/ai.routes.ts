import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/ai.controller";

export const aiRoutes = Router();
aiRoutes.use(authenticate);

aiRoutes.get("/insights", ctrl.listInsights);
aiRoutes.post("/insights/:id/read", ctrl.markRead);
aiRoutes.post("/insights/:id/dismiss", ctrl.dismiss);
aiRoutes.post("/chat", ctrl.chat);

aiRoutes.post("/evaluate", ctrl.evaluate);
aiRoutes.post("/medications/:logId/confirm", ctrl.confirmMedication);
aiRoutes.get("/summary", ctrl.summary);
aiRoutes.get("/caregivers/prefs", ctrl.caregiverPrefs);
aiRoutes.post("/caregivers/prefs", ctrl.caregiverPrefs);
