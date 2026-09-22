import { api } from "./api";

export interface Insight {
  id: string;
  patientId: string;
  type: string;
  priority: "info" | "watch" | "attention" | "urgent";
  title: string;
  message: string;
  explanation?: string;
  suggestedActions?: any;
  context?: any;
  isRead?: boolean;
  createdAt: string;
}

function parseInsight(raw: any): Insight {
  return {
    ...raw,
    suggestedActions: raw.suggestedActions
      ? typeof raw.suggestedActions === "string"
        ? JSON.parse(raw.suggestedActions)
        : raw.suggestedActions
      : undefined,
    context: raw.context
      ? typeof raw.context === "string"
        ? JSON.parse(raw.context)
        : raw.context
      : undefined,
  };
}

export const aiService = {
  listInsights: () => api.get<any[]>("/ai/insights").then((arr) => arr.map(parseInsight)),
  markRead: (id: string) => api.post<Insight>(`/ai/insights/${id}/read`, {}).then(parseInsight),
  dismiss: (id: string) => api.post<Insight>(`/ai/insights/${id}/dismiss`, {}).then(parseInsight),
  chat: (message: string, history?: string) =>
    api.post<any>("/ai/chat", { message, history }).then(parseInsight),
  evaluate: () => api.post<any[]>("/ai/evaluate", {}).then((arr) => arr.map(parseInsight)),
  confirmMedication: (logId: string) =>
    api.post<any>(`/ai/medications/${logId}/confirm`, {}).then(parseInsight),
  summary: (period: "week" | "month" = "week") =>
    api.get<any>(`/ai/summary?period=${period}`).then(parseInsight),
  caregiverPrefs: () => api.get<any[]>("/ai/caregivers/prefs"),
  saveCaregiverPrefs: (prefs: {
    familyMemberId: string;
    contactPhone?: string;
    alertAbnormal?: boolean;
    alertMissedMedication?: boolean;
    alertUrgent?: boolean;
  }) => api.post<any>("/ai/caregivers/prefs", prefs),
};

export const escalationService = {
  queue: (status?: string) => api.get<any[]>(`/escalations/queue${status ? `?status=${status}` : ""}`),
  actions: () => api.get<string[]>("/escalations/actions"),
  act: (id: string, action: string, note?: string) =>
    api.post<any>(`/escalations/queue/${id}/act`, { action, note }),
};
