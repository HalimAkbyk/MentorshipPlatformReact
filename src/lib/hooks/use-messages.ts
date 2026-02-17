import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { toast } from 'sonner';

export function useBookingMessages(bookingId: string, page = 1) {
  return useQuery({
    queryKey: ['messages', bookingId, page],
    queryFn: () => messagesApi.getByBooking(bookingId, page),
    enabled: !!bookingId,
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
    mutationFn: ({ bookingId, content }: { bookingId: string; content: string }) =>
      messagesApi.send(bookingId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.bookingId] });
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

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => messagesApi.getUnreadCount(),
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
