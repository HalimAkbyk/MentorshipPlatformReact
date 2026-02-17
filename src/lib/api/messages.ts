import { apiClient } from './client';
import type { ConversationDto } from '../types/models';

export interface MessageDto {
  id: string;
  senderUserId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  isRead: boolean;
  isOwnMessage: boolean;
  createdAt: string;
}

export interface PaginatedMessages {
  items: MessageDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface BookingUnreadDto {
  bookingId: string;
  count: number;
}

export interface UnreadCountDto {
  totalUnread: number;
  perBooking: BookingUnreadDto[];
}

export const messagesApi = {
  send: (bookingId: string, content: string) =>
    apiClient.post<{ messageId: string }>('/messages', { bookingId, content }),

  getByBooking: (bookingId: string, page = 1, pageSize = 50) =>
    apiClient.get<PaginatedMessages>(`/messages/booking/${bookingId}`, { page, pageSize }),

  markAsRead: (bookingId: string) =>
    apiClient.post(`/messages/booking/${bookingId}/read`),

  getUnreadCount: () =>
    apiClient.get<UnreadCountDto>('/messages/unread-count'),

  report: (messageId: string, reason: string) =>
    apiClient.post<{ reportId: string }>(`/messages/${messageId}/report`, { reason }),

  getConversations: () =>
    apiClient.get<ConversationDto[]>('/messages/conversations'),
};
