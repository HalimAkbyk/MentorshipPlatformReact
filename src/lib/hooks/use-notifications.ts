import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';

export function useNotifications(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['user-notifications', page, pageSize],
    queryFn: () => notificationsApi.getNotifications(page, pageSize),
  });
}

export function useNotificationCount() {
  return useQuery({
    queryKey: ['user-notification-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 120000, // Slow fallback poll (2min) - real-time via SignalR
    staleTime: 60000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notification-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notification-count'] });
    },
  });
}
