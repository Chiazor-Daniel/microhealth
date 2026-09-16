import { api } from "./api";

export interface StaffMember {
  id: string;
  userId?: string;
  role: string;
  department: string;
  status: string;
  patientCount: number;
  user?: { firstName: string; lastName: string; phone?: string };
}

/** Minimal, patient-safe projection returned by GET /staff/available. */
export interface AvailableDoctor {
  id: string;
  department?: string;
  specialty?: string;
  firstName?: string;
  lastName?: string;
}

export const staffService = {
  list: () => api.get<StaffMember[]>("/staff"),
  /** On-duty clinicians a patient can book with (no staff PII). */
  available: () => api.get<AvailableDoctor[]>("/staff/available"),
  getById: (id: string) => api.get<StaffMember>(`/staff/${id}`),
  updateStatus: (id: string, status: string) => api.patch<StaffMember>(`/staff/${id}/status`, { status }),
};
