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

export const staffService = {
  list: () => api.get<StaffMember[]>("/staff"),
  getById: (id: string) => api.get<StaffMember>(`/staff/${id}`),
  updateStatus: (id: string, status: string) => api.patch<StaffMember>(`/staff/${id}/status`, { status }),
};
