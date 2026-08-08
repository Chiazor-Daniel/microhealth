import { api } from "./api";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  department?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  notes?: string;
  patient?: any;
  doctor?: any;
}

export const appointmentService = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return api.get<Appointment[]>(`/appointments${qs}`);
  },
  listByPatient: (patientId: string) => api.get<Appointment[]>(`/appointments/patient/${patientId}`),
  getById: (id: string) => api.get<Appointment>(`/appointments/${id}`),
  create: (data: Partial<Appointment>) => api.post<Appointment>("/appointments", data),
  updateStatus: (id: string, status: string) => api.patch<Appointment>(`/appointments/${id}/status`, { status }),
  update: (id: string, data: Partial<Appointment>) => api.put<Appointment>(`/appointments/${id}`, data),
  remove: (id: string) => api.delete(`/appointments/${id}`),
};
