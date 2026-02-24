import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { useAuthStore } from '../stores/auth-store';
import { toast } from 'sonner';

export function useBookingMessages(bookingId: string, page = 1) {
  return useQuery({
    queryKey: ['messages', 'booking', bookingId, page],
    queryFn: () => messagesApi.getByBooking(bookingId, page),
    enabled: !!bookingId,
  });
}

export function useConversationMessages(conversationId: string, page = 1) {
  return useQuery({
    queryKey: ['messages', 'conversation', conversationId, page],
    queryFn: () => messagesApi.getByConversation(conversationId, page),
    enabled: !!conversationId,
  });
}

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations(),
    enabled,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { conversationId?: string; bookingId?: string; content: string }) =>
      messagesApi.send(params),
    onSuccess: (_, variables) => {
      if (variables.conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', variables.conversationId] });
      }
      if (variables.bookingId) {
        queryClient.invalidateQueries({ queryKey: ['messages', 'booking', variables.bookingId] });
      }
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => messagesApi.markAsRead(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => messagesApi.markConversationAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStartDirectConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipientUserId: string) => messagesApi.startDirectConversation(recipientUserId),
    onSuccess: async () => {
      // Await invalidation so conversations list is fresh before navigation
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUnreadCount() {
  // Use auth store for reliable check — prevents 401/500 on public pages
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => messagesApi.getUnreadCount(),
    enabled: isAuthenticated && hasHydrated,
    retry: false,
  });
}

export function useReportMessage() {
  return useMutation({
    mutationFn: ({ messageId, reason }: { messageId: string; reason: string }) =>
      messagesApi.report(messageId, reason),
    onSuccess: () => {
      toast.success('Mesaj basariyla raporlandi.');
    },
  });
}
