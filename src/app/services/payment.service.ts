import { api } from "./api";

export interface Payment {
  id: string;
  patientId: string;
  service: string;
  amount: number;
  method?: string;
  status: string;
  paidAt?: string;
}

export const paymentService = {
  list: () => api.get<Payment[]>("/payments"),
  getByPatient: (patientId: string) => api.get<Payment[]>(`/payments/patient/${patientId}`),
  getStats: () => api.get<{ totalPaid: any; totalPending: any }>("/payments/stats"),
  create: (data: Partial<Payment>) => api.post<Payment>("/payments", data),
  updateStatus: (id: string, status: string) => api.patch<Payment>(`/payments/${id}/status`, { status }),
};
