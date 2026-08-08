import { api } from "./api";

export interface Patient {
  id: string;
  userId?: string;
  patientCode: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  diagnosis?: string;
  status: string;
  ward?: string;
  doctorId?: string;
  doctor?: any;
  user?: any;
}

export const patientService = {
  list: () => api.get<Patient[]>("/patients"),
  search: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return api.get<Patient[]>(`/patients/search?${qs}`);
  },
  getById: (id: string) => api.get<Patient>(`/patients/${id}`),
  create: (data: Partial<Patient>) => api.post<Patient>("/patients", data),
  update: (id: string, data: Partial<Patient>) => api.put<Patient>(`/patients/${id}`, data),
  remove: (id: string) => api.delete(`/patients/${id}`),
};
