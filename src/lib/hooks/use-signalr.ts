'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth-store';
import {
  startConnection,
  stopConnection,
  onReceiveMessage,
  onMessagesRead,
  onMessageDelivered,
  onNotificationCountUpdated,
  onRoomStatusChanged,
  removeAllListeners,
  type NewMessagePayload,
  type MessagesReadPayload,
  type MessageDeliveredPayload,
  type NotificationCountPayload,
  type RoomStatusPayload,
} from '../signalr/chat-connection';
import { messagesApi } from '../api/messages';
import type { PaginatedMessages } from '../api/messages';

// Global active booking/conversation tracking (set by message components)
let activeBookingId: string | null = null;
let activeConversationId: string | null = null;

export function setActiveBookingId(bookingId: string | null) {
  activeBookingId = bookingId;
}

export function setActiveConversationId(conversationId: string | null) {
  activeConversationId = conversationId;
}

export function useSignalR() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (connectedRef.current) {
        removeAllListeners();
        stopConnection();
        connectedRef.current = false;
      }
      return;
    }

    const connect = async () => {
      await startConnection();
      connectedRef.current = true;

      onReceiveMessage((msg: NewMessagePayload) => {
        // Add message to conversation-based cache
        if (msg.conversationId) {
          queryClient.setQueryData<PaginatedMessages>(
            ['messages', 'conversation', msg.conversationId, 1],
            (old) => {
              if (!old) return old;
              if (old.items.some((m) => m.id === msg.id)) return old;
              return {
                ...old,
                items: [...old.items, msg],
                totalCount: old.totalCount + 1,
              };
            }
          );
        }

        // Also update legacy booking-based cache if bookingId exists
        if (msg.bookingId) {
          queryClient.setQueryData<PaginatedMessages>(
            ['messages', 'booking', msg.bookingId, 1],
            (old) => {
              if (!old) return old;
              if (old.items.some((m) => m.id === msg.id)) return old;
              return {
                ...old,
                items: [...old.items, msg],
                totalCount: old.totalCount + 1,
              };
            }
          );
        }

        // Invalidate conversations and unread count
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unreadCount'] });

        // Auto-mark as read if user is viewing this conversation
        if (activeConversationId && msg.conversationId === activeConversationId) {
          messagesApi.markConversationAsRead(msg.conversationId).catch(() => {});
        } else if (activeBookingId && msg.bookingId === activeBookingId) {
          messagesApi.markAsRead(msg.bookingId).catch(() => {});
        }
      });

      onMessagesRead((payload: MessagesReadPayload) => {
        // Update read status in all message caches (both conversation and booking keys)
        queryClient.setQueriesData<PaginatedMessages>(
          { queryKey: ['messages'] },
          (old) => {
            if (!old) return old;
            const idSet = new Set(payload.messageIds);
            const hasMatch = old.items.some((m) => idSet.has(m.id));
            if (!hasMatch) return old;
            return {
              ...old,
              items: old.items.map((m) =>
                idSet.has(m.id)
                  ? { ...m, isRead: true, readAt: new Date().toISOString() }
                  : m
              ),
            };
          }
        );
      });

      onMessageDelivered((payload: MessageDeliveredPayload) => {
        // Update delivered status in all cached message lists
        queryClient.setQueriesData<PaginatedMessages>(
          { queryKey: ['messages'] },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((m) =>
                m.id === payload.messageId
                  ? { ...m, deliveredAt: new Date().toISOString() }
                  : m
              ),
            };
          }
        );
      });

      // Real-time notification count updates (replaces polling)
      onNotificationCountUpdated((payload: NotificationCountPayload) => {
        queryClient.setQueryData(['user-notification-count'], { count: payload.unreadCount });
        queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      });

      // Real-time room status updates (replaces polling)
      onRoomStatusChanged((payload: RoomStatusPayload) => {
        queryClient.setQueryData(['room-status', payload.roomName], {
          isActive: payload.isActive,
          hostConnected: payload.hostConnected,
          participantCount: payload.participantCount,
        });
      });
    };

    connect();

    return () => {
      removeAllListeners();
      stopConnection();
      connectedRef.current = false;
    };
  }, [isAuthenticated, queryClient]);
}
