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
};
