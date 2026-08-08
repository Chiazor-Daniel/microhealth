import { api } from "./api";

export interface Vital {
  id: string;
  patientId: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  bloodSugar?: number;
  weight?: number;
  notes?: string;
  recordedAt: string;
}

export const vitalService = {
  getByPatient: (patientId: string) => api.get<Vital[]>(`/vitals/patient/${patientId}`),
  getTrends: (patientId: string) => api.get<Vital[]>(`/vitals/trends/${patientId}`),
  record: (data: Partial<Vital>) => api.post<Vital>("/vitals", data),
  getAbnormal: () => api.get<Vital[]>("/vitals/abnormal"),
};
