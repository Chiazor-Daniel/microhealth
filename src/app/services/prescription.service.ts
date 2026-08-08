import { api } from "./api";

export interface Prescription {
  id: string;
  patientId: string;
  medicine: string;
  dosage: string;
  duration?: string;
  doctorId?: string;
  status: string;
  refills?: number;
  expiryDate?: string;
}

export const prescriptionService = {
  list: () => api.get<Prescription[]>("/prescriptions"),
  getByPatient: (patientId: string) => api.get<Prescription[]>(`/prescriptions/patient/${patientId}`),
  create: (data: Partial<Prescription>) => api.post<Prescription>("/prescriptions", data),
  dispense: (id: string) => api.patch<Prescription>(`/prescriptions/${id}/dispense`),
  requestRefill: (id: string) => api.post<{ message: string }>(`/prescriptions/${id}/refill`),
};
