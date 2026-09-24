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

export type GroupRole = "Mum" | "Dad" | "Spouse" | "Child" | "Grandparent" | "Other";

export interface FamilyGroup {
  group: { id: string; plan: string; createdBy: string };
  membership: { id: string; groupId: string; patientId: string; role: string; status: string };
}

export interface GroupMember {
  membershipId: string;
  patientId: string | null;
  role: string;
  status: "active" | "invited";
  firstName: string | null;
  lastName: string | null;
}

export interface GroupInvite {
  id: string;
  role: string;
  status: string;
  invitedContact: string | null;
}

/** Server-side family groups. The group is the source of truth — never local state. */
export const familyGroupService = {
  create: (role: GroupRole) => api.post<FamilyGroup>("/families", { role }),
  mine: () => api.get<FamilyGroup[]>("/families/mine"),
  members: (groupId: string) => api.get<GroupMember[]>(`/families/${groupId}/members`),
  invite: (groupId: string, contact: string, role: GroupRole) =>
    api.post<GroupInvite>(`/families/${groupId}/invite`, { contact, role }),
  inviteLink: (groupId: string, role: GroupRole) =>
    api.post<{ token: string; role: string }>(`/families/${groupId}/links`, { role }),
  resolveLink: (token: string) => api.get<{ token: string; role: string; used: boolean; familyName: string }>(`/families/join/${token}`),
  joinLink: (token: string) => api.post(`/families/join`, { token }),
  accept: () => api.post<{ claimed: number }>("/families/accept", {}),
  removeMember: (membershipId: string) => api.delete(`/families/members/${membershipId}`),
  subscriptions: () => api.get<any[]>("/families/subscriptions"),
  follow: (targetPatientId: string, kinds?: { alertAbnormal?: boolean; alertMissedMedication?: boolean; alertUrgent?: boolean }) =>
    api.post<any>("/families/subscriptions", { targetPatientId, ...kinds }),
  unfollow: (targetPatientId: string) => api.delete(`/families/subscriptions/${targetPatientId}`),
};
