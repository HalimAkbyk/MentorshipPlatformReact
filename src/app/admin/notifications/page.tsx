'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api/admin';
import {
  AdminNotificationIcon,
  getAdminNavUrl,
  adminTimeAgo,
  type AdminNotificationItem,
} from '@/components/admin/admin-notifications-dropdown';

const PAGE_SIZE = 20;

export default function AdminNotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Unread count
  const { data: countData } = useQuery({
    queryKey: ['admin-notification-count'],
    queryFn: () => adminApi.getNotificationUnreadCount(),
  });
  const unreadCount = countData?.count ?? 0;

  // Notifications list
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['admin-notifications-page', page],
    queryFn: () => adminApi.getNotifications(page, PAGE_SIZE),
  });
  const notifications: AdminNotificationItem[] = notificationsData?.items ?? [];
  const totalCount = notificationsData?.total ?? notifications.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminApi.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => adminApi.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-count'] });
    },
  });

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleNotificationClick = (notif: AdminNotificationItem) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    const url = getAdminNavUrl(notif);
    if (url) {
      router.push(url);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
            <Bell className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Bildirimler</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-500">
                {unreadCount} okunmamis bildirim
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            Tumunu Okundu Isaretle
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Tumu ({totalCount})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Okunmamis ({unreadCount})
        </button>
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {filter === 'unread' ? 'Okunmamis bildirim yok.' : 'Henuz bildirim yok.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const navUrl = getAdminNavUrl(notif);
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex items-start gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0 transition-colors ${
                  navUrl ? 'cursor-pointer hover:bg-slate-50' : ''
                } ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
              >
                <div className="mt-0.5 shrink-0 p-2 bg-slate-50 rounded-lg">
                  <AdminNotificationIcon type={notif.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        notif.isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'
                      }`}
                    >
                      {notif.title}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">
                      {adminTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
                {!notif.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markReadMutation.mutate(notif.id);
                    }}
                    className="shrink-0 p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Okundu isaretle"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-400">
            Toplam {totalCount} bildirim
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Onceki
            </Button>
            <span className="text-sm text-slate-500 px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="gap-1"
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
