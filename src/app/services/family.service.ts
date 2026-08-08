import { api } from "./api";

export interface FamilyMember {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  age?: number;
  status: string;
  createdAt: string;
}

export const familyService = {
  listByPatient: (patientId: string) => api.get<FamilyMember[]>(`/patients/${patientId}/family`),
  add: (patientId: string, data: Partial<FamilyMember>) => api.post<FamilyMember>(`/patients/${patientId}/family`, data),
  remove: (patientId: string, memberId: string) => api.delete(`/patients/${patientId}/family/${memberId}`),
};
