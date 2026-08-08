import { api } from "./api";

export interface LabTest {
  id: string;
  patientId: string;
  testName: string;
  doctorId?: string;
  status: string;
  result?: string;
  resultNotes?: string;
}

export const labService = {
  list: () => api.get<LabTest[]>("/labs"),
  getByPatient: (patientId: string) => api.get<LabTest[]>(`/labs/patient/${patientId}`),
  order: (data: Partial<LabTest>) => api.post<LabTest>("/labs", data),
  updateStatus: (id: string, status: string) => api.patch<LabTest>(`/labs/${id}/status`, { status }),
  addResult: (id: string, result: string, resultNotes?: string) => api.patch<LabTest>(`/labs/${id}/result`, { result, resultNotes }),
};
