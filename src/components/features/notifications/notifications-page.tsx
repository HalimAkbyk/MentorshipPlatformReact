'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useNotifications,
  useNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/hooks/use-notifications';
import {
  NotificationIcon,
  getNavigationUrl,
  timeAgo,
} from './user-notifications-dropdown';
import type { UserNotificationDto } from '@/lib/api/notifications';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: countData } = useNotificationCount();
  const unreadCount = countData?.count ?? 0;

  const { data: notificationsData, isLoading } = useNotifications(page, PAGE_SIZE);
  const notifications = notificationsData?.items ?? [];
  const totalCount = notificationsData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleNotificationClick = (notif: UserNotificationDto) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    const url = getNavigationUrl(notif);
    if (url) {
      router.push(url);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 rounded-xl">
            <Bell className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bildirimler</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">
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
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tumu ({totalCount})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Okunmamis ({unreadCount})
        </button>
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {filter === 'unread' ? 'Okunmamis bildirim yok.' : 'Henuz bildirim yok.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif: UserNotificationDto) => {
            const navUrl = getNavigationUrl(notif);
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex items-start gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0 transition-colors ${
                  navUrl ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${!notif.isRead ? 'bg-primary-50/30' : ''}`}
              >
                <div className="mt-0.5 shrink-0 p-2 bg-gray-50 rounded-lg">
                  <NotificationIcon type={notif.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        notif.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'
                      }`}
                    >
                      {notif.title}
                    </p>
                    <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
                {!notif.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markReadMutation.mutate(notif.id);
                    }}
                    className="shrink-0 p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
          <p className="text-sm text-gray-400">
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
            <span className="text-sm text-gray-500 px-2">
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
