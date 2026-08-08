import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/message.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const messageRoutes = Router();
messageRoutes.use(authenticate);

const schema = z.object({
  recipientId: z.string(),
  content: z.string(),
});

const notificationSchema = z.object({
  title: z.string(),
  message: z.string(),
  type: z.string().optional(),
});

messageRoutes.get("/", ctrl.list);
messageRoutes.post("/", validate(schema), ctrl.send);
messageRoutes.patch("/:id/read", ctrl.markRead);
messageRoutes.get("/notifications", ctrl.listNotifications);
messageRoutes.post("/notifications", validate(notificationSchema), ctrl.createNotification);
messageRoutes.patch("/notifications/:id/read", ctrl.markNotificationRead);
