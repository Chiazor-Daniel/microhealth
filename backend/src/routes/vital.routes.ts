import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/vital.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const vitalRoutes = Router();
vitalRoutes.use(authenticate);

/**
 * The band's wide packet.
 *
 * Mirrors the columns on the `vitals` table — see the note there for why
 * these particular measures share a row. Metrics recorded on their own
 * schedule go through `/metric-readings` instead.
 */
const schema = z.object({
  patientId: z.string(),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  heartRate: z.number().optional(),
  temperature: z.number().optional(),
  spo2: z.number().optional(),
  bloodSugar: z.number().optional(),
  weight: z.number().optional(),
  /* Wide-packet additions */
  respiratoryRate: z.number().optional(),
  hrv: z.number().optional(),
  stress: z.number().min(0).max(100).optional(),
  fatigue: z.number().min(0).max(100).optional(),
  gsr: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * One reading of any registered metric, recorded on its own schedule.
 *
 * `metricKey` is checked for *shape* only, not against the registry. The
 * registry lives in the frontend tree (`src/metrics/registry.ts`) and the
 * runtime image is built from `backend/` alone — see the root Dockerfile — so
 * the backend genuinely cannot import it. Duplicating the key list here would
 * be worse than not checking it: it would go stale silently, and it is exactly
 * the kind of second source of truth that this registry was introduced to
 * remove.
 *
 * A key nothing recognises is therefore accepted and stored. That is
 * deliberately harmless: the read path resolves keys through the registry, so
 * an unrecognised reading is simply never rendered. The alternative — a 400
 * the writer cannot act on — buys nothing.
 */
const metricKeyShape = /^[a-z][a-zA-Z0-9]*$/;

const readingSchema = z.object({
  patientId: z.string(),
  metricKey: z.string().regex(metricKeyShape, "Metric key must be camelCase"),
  value: z.number().nullable().optional(),
  value2: z.number().nullable().optional(),
  unit: z.string().optional(),
  source: z.enum(["band", "cuff", "scale", "lab", "manual", "agent"]).optional(),
  meta: z.string().optional(),
  notes: z.string().optional(),
  recordedAt: z.coerce.date().optional(),
});

vitalRoutes.get("/patient/:patientId", ctrl.getByPatient);
vitalRoutes.get("/trends/:patientId", ctrl.getTrends);
vitalRoutes.post("/", authorize("admin","staff"), validate(schema), ctrl.record);
vitalRoutes.get("/abnormal", authorize("admin","staff"), ctrl.getAbnormal);

/* Metric readings. The band posts its packet to `/`, and anything recorded on
   its own schedule — sleep, ECG, composition, glucose, labs — comes here. */
vitalRoutes.get("/metric-readings/:patientId", ctrl.getMetricReadings);
vitalRoutes.get("/metric-readings/:patientId/latest", ctrl.getLatestMetricReadings);
vitalRoutes.post("/metric-readings", validate(readingSchema), ctrl.recordMetricReading);
