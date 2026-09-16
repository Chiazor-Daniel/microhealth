import { type InferSelectModel } from "drizzle-orm";
import { type patients, type vitals, type appointments, type prescriptions, type labTests, type messages } from "../db/schema";

export type PatientRow = InferSelectModel<typeof patients>;
export type VitalRow = InferSelectModel<typeof vitals>;
export type AppointmentRow = InferSelectModel<typeof appointments>;
export type PrescriptionRow = InferSelectModel<typeof prescriptions>;
export type LabRow = InferSelectModel<typeof labTests>;
export type MessageRow = InferSelectModel<typeof messages>;

export type InsightPriority = "info" | "watch" | "attention" | "urgent";

export type InsightType =
  | "vital_trend"
  | "vital_recovery"
  | "medication_due"
  | "appointment_reminder"
  | "lab_result"
  | "wearable_offline"
  | "system";

export interface HealthEvent {
  id: string;
  patientId: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  context?: Record<string, unknown>;
  createdAt: Date;
}

export type PatientRowWithUser = PatientRow & {
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export interface PatientContext {
  patientId: string;
  userId: string;
  profile: PatientRowWithUser | null;
  recentVitals: VitalRow[];
  baseline?: VitalBaseline;
  appointments: AppointmentRow[];
  prescriptions: PrescriptionRow[];
  labs: LabRow[];
  messages: MessageRow[];
}

export interface VitalBaseline {
  heartRate: { min: number; max: number };
  systolic: { min: number; max: number };
  diastolic: { min: number; max: number };
  spo2: { min: number; max: number };
  temperature: { min: number; max: number };
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string }>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface GeneratedInsight {
  id: string;
  patientId: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  explanation?: string;
  suggestedActions?: string[];
  context?: Record<string, unknown>;
  createdAt: Date;
}
