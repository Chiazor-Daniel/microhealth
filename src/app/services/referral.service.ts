import { api } from "./api";

export interface Referral {
  id: string;
  patientId: string;
  fromDoctorId?: string;
  toFacility: string;
  reason?: string;
  status: string;
  referralDate?: string;
  patient?: any;
  fromDoctor?: any;
}

export const referralService = {
  list: () => api.get<Referral[]>("/referrals"),
  create: (data: Partial<Referral>) => api.post<Referral>("/referrals", data),
  updateStatus: (id: string, status: string) => api.patch<Referral>(`/referrals/${id}/status`, { status }),
};
