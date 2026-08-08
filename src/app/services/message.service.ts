import { api } from "./api";

export const messageService = {
  list: () => api.get<any[]>("/messages"),
  send: (recipientId: string, content: string) => api.post<any>("/messages", { recipientId, content }),
  markRead: (id: string) => api.patch(`/messages/${id}/read`),
  listNotifications: () => api.get<any[]>("/messages/notifications"),
  createNotification: (data: { userId?: string; title: string; message: string; type?: string }) => api.post<any>("/messages/notifications", data),
  markNotificationRead: (id: string) => api.patch(`/messages/notifications/${id}/read`),
};
