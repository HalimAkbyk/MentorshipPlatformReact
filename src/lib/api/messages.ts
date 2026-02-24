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
  deliveredAt: string | null;
  readAt: string | null;
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

export interface DirectConversationResult {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  isNew: boolean;
}

export const messagesApi = {
  // Send message (supports both conversationId and bookingId)
  send: (params: { conversationId?: string; bookingId?: string; content: string }) =>
    apiClient.post<{ messageId: string }>('/messages', params),

  // Legacy: send via booking
  sendToBooking: (bookingId: string, content: string) =>
    apiClient.post<{ messageId: string }>('/messages', { bookingId, content }),

  // Start or get a direct conversation
  startDirectConversation: (recipientUserId: string) =>
    apiClient.post<DirectConversationResult>('/messages/conversations/direct', { recipientUserId }),

  // Get messages by booking (legacy)
  getByBooking: (bookingId: string, page = 1, pageSize = 50) =>
    apiClient.get<PaginatedMessages>(`/messages/booking/${bookingId}`, { page, pageSize }),

  // Get messages by conversation
  getByConversation: (conversationId: string, page = 1, pageSize = 50) =>
    apiClient.get<PaginatedMessages>(`/messages/conversation/${conversationId}`, { page, pageSize }),

  // Mark booking messages as read (legacy)
  markAsRead: (bookingId: string) =>
    apiClient.post(`/messages/booking/${bookingId}/read`),

  // Mark conversation messages as read
  markConversationAsRead: (conversationId: string) =>
    apiClient.post(`/messages/conversation/${conversationId}/read`),

  getUnreadCount: () =>
    apiClient.get<UnreadCountDto>('/messages/unread-count'),

  report: (messageId: string, reason: string) =>
    apiClient.post<{ reportId: string }>(`/messages/${messageId}/report`, { reason }),

  getConversations: () =>
    apiClient.get<ConversationDto[]>('/messages/conversations'),
};
