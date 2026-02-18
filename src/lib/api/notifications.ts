import { apiClient } from './client';

export interface UserNotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  referenceType: string | null;
  referenceId: string | null;
  groupKey: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: UserNotificationDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const notificationsApi = {
  getNotifications: async (page = 1, pageSize = 20): Promise<NotificationsResponse> => {
    return apiClient.get('/notifications', { page, pageSize });
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiClient.get('/notifications/unread-count');
  },

  markAsRead: async (id: string): Promise<void> => {
    return apiClient.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    return apiClient.post('/notifications/read-all');
  },
};
