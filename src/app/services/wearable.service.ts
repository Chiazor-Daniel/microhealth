import { api } from "./api";

/**
 * One packet from the band.
 *
 * This is the *wide packet*: everything the device reports together, every
 * few seconds. Metrics recorded on their own schedule — sleep, ECG, body
 * composition, glucose, labs — do not travel here; they post to
 * `/vitals/metric-readings` and are typed in `src/metrics/registry.ts`.
 */
export interface WearableReading {
  patientId: string;
  timestamp: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  systolic: number;
  diastolic: number;
  /** Wide-packet additions — see the `vitals` table in the backend schema. */
  respiratoryRate: number;
  hrv: number;
  /** 0–100 index. */
  stress: number;
  /** 0–100 index. */
  fatigue: number;
  /** Skin conductance, µS. */
  gsr: number;
  bloodSugar?: number;
  weight?: number;
}

export const wearableService = {
  sendReading: (data: WearableReading) => api.post<any>("/wearables/reading", data),
  getStatus: (patientId: string) => api.get<{ connected: boolean; deviceName: string; batteryLevel: number; lastSynced: string }>(`/wearables/status/${patientId}`),
};
