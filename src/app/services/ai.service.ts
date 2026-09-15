import { api } from "./api";

export interface Insight {
  id: string;
  patientId: string;
  type: string;
  priority: "info" | "watch" | "attention" | "urgent";
  title: string;
  message: string;
  explanation?: string;
  suggestedActions?: string;
  context?: any;
  isRead?: boolean;
  createdAt: string;
}

export const aiService = {
  listInsights: () => api.get<Insight[]>("/ai/insights"),
  markRead: (id: string) => api.post<Insight>(`/ai/insights/${id}/read`, {}),
  dismiss: (id: string) => api.post<Insight>(`/ai/insights/${id}/dismiss`, {}),
  chat: (message: string, history?: string) =>
    api.post<Insight>("/ai/chat", { message, history }),
};
