import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/wearable.controller";

export const wearableRoutes = Router();
wearableRoutes.use(authenticate);

wearableRoutes.post("/reading", ctrl.receiveReading);
wearableRoutes.get("/status/:patientId", ctrl.getStatus);
