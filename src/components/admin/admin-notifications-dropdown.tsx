'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Loader2, AlertTriangle, UserCheck, RefreshCw, CreditCard, PlayCircle } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';

interface AdminNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Az once';
  if (diffMin < 60) return `${diffMin}dk once`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}s once`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}g once`;
  return date.toLocaleDateString('tr-TR');
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'MentorVerification':
      return <UserCheck className="h-4 w-4 text-indigo-500" />;
    case 'CourseReview':
      return <PlayCircle className="h-4 w-4 text-lime-500" />;
    case 'RefundRequest':
      return <RefreshCw className="h-4 w-4 text-amber-500" />;
    case 'PaymentFailed':
      return <CreditCard className="h-4 w-4 text-red-500" />;
    case 'Dispute':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    default:
      return <Bell className="h-4 w-4 text-slate-400" />;
  }
}

function getAdminNavUrl(notif: AdminNotificationItem): string | null {
  if (!notif.referenceType) return null;
  switch (notif.referenceType) {
    case 'MentorVerification':
      return '/admin/verifications';
    case 'CourseReview':
      return '/admin/course-reviews';
    case 'RefundRequest':
      return '/admin/refunds';
    default:
      return null;
  }
}

export function AdminNotificationsDropdown() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['admin-notification-count'],
    queryFn: () => adminApi.getNotificationUnreadCount(),
    refetchInterval: 30000, // Poll every 30s
  });
  const unreadCount = countData?.count ?? 0;

  // Fetch notifications when dropdown opens
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminApi.getNotifications(),
    enabled: open,
  });
  const notifications: AdminNotificationItem[] = notificationsData?.items ?? [];

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminApi.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-count'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => adminApi.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-count'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tumunu okundu isaretle
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">
                Bildirim yok.
              </div>
            ) : (
              notifications.map((notif) => {
                const navUrl = getAdminNavUrl(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) markReadMutation.mutate(notif.id);
                      if (navUrl) { setOpen(false); router.push(navUrl); }
                    }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                      navUrl ? 'cursor-pointer' : ''
                    } ${!notif.isRead ? 'bg-indigo-50/50' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <NotificationIcon type={notif.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${notif.isRead ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-300 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(notif.id);
                        }}
                        className="shrink-0 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Okundu isaretle"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5 text-center">
              <span className="text-xs text-slate-400">
                Son {notifications.length} bildirim gosteriliyor
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
