import { api } from "./api";

export interface WearableReading {
  patientId: string;
  timestamp: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  systolic: number;
  diastolic: number;
  bloodSugar?: number;
  weight?: number;
}

export const wearableService = {
  sendReading: (data: WearableReading) => api.post<any>("/wearables/reading", data),
  getStatus: (patientId: string) => api.get<{ connected: boolean; deviceName: string; batteryLevel: number; lastSynced: string }>(`/wearables/status/${patientId}`),
};
