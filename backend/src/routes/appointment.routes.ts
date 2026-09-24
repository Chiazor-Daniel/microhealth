import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/appointment.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const appointmentRoutes = Router();
appointmentRoutes.use(authenticate);

const schema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  department: z.string().optional(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  notes: z.string().optional(),
});

appointmentRoutes.get("/", ctrl.list);
appointmentRoutes.get("/patient/:patientId", ctrl.listByPatient);
appointmentRoutes.get("/:id", ctrl.getById);
appointmentRoutes.post("/", authorize("admin","staff","patient"), validate(schema), ctrl.create);
appointmentRoutes.patch("/:id/status", authorize("admin","staff"), ctrl.updateStatus);
appointmentRoutes.put("/:id", authorize("admin","staff"), validate(schema), ctrl.update);
appointmentRoutes.delete("/:id", authorize("admin"), ctrl.remove);

/* Visit sessions — the consultation room. Patients join their own visits. */
import * as visitCtrl from "../controllers/visit.controller";
appointmentRoutes.post("/:id/visit/join", visitCtrl.join);
appointmentRoutes.get("/:id/visit", visitCtrl.current);
appointmentRoutes.post("/:id/visit/end", visitCtrl.end);
