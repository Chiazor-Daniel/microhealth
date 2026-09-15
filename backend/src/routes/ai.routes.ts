import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/ai.controller";

export const aiRoutes = Router();
aiRoutes.use(authenticate);

aiRoutes.get("/insights", ctrl.listInsights);
aiRoutes.post("/insights/:id/read", ctrl.markRead);
aiRoutes.post("/insights/:id/dismiss", ctrl.dismiss);
aiRoutes.post("/chat", ctrl.chat);
