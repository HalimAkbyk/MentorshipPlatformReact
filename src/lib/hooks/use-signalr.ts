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
  removeAllListeners,
  type NewMessagePayload,
  type MessagesReadPayload,
  type MessageDeliveredPayload,
} from '../signalr/chat-connection';
import { messagesApi } from '../api/messages';
import type { PaginatedMessages } from '../api/messages';

// Global active booking tracking (set by message components)
let activeBookingId: string | null = null;
export function setActiveBookingId(bookingId: string | null) {
  activeBookingId = bookingId;
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
        // Add message to cache if that booking's messages are loaded
        queryClient.setQueryData<PaginatedMessages>(
          ['messages', msg.bookingId, 1],
          (old) => {
            if (!old) return old;
            // Avoid duplicates
            if (old.items.some((m) => m.id === msg.id)) return old;
            return {
              ...old,
              items: [...old.items, msg],
              totalCount: old.totalCount + 1,
            };
          }
        );

        // Invalidate conversations and unread count
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unreadCount'] });

        // Auto-mark as read if user is viewing this booking
        if (activeBookingId === msg.bookingId) {
          messagesApi.markAsRead(msg.bookingId).catch(() => {});
        }
      });

      onMessagesRead((payload: MessagesReadPayload) => {
        // Update read status in cache
        queryClient.setQueryData<PaginatedMessages>(
          ['messages', payload.bookingId, 1],
          (old) => {
            if (!old) return old;
            const idSet = new Set(payload.messageIds);
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
    };

    connect();

    return () => {
      removeAllListeners();
      stopConnection();
      connectedRef.current = false;
    };
  }, [isAuthenticated, queryClient]);
}
