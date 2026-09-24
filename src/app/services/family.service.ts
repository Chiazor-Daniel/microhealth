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
  accept: () => api.post<{ claimed: number }>("/families/accept", {}),
  removeMember: (membershipId: string) => api.delete(`/families/members/${membershipId}`),
};
