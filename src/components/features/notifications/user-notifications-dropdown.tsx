'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Loader2, AlertTriangle, BookOpen, PlayCircle, MessageSquare, Info, ChevronRight, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import {
  useNotifications,
  useNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/hooks/use-notifications';
import type { UserNotificationDto } from '@/lib/api/notifications';

const DROPDOWN_MAX_ITEMS = 15;

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

export function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'CourseModeration':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'CourseApproved':
      return <PlayCircle className="h-4 w-4 text-green-500" />;
    case 'BookingConfirmed':
      return <BookOpen className="h-4 w-4 text-indigo-500" />;
    case 'Message':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'RefundApproved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'RefundRejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-slate-400" />;
  }
}

export function getNavigationUrl(notif: UserNotificationDto): string | null {
  if (!notif.referenceType || !notif.referenceId) return null;
  switch (notif.referenceType) {
    case 'Course':
      return `/mentor/courses/${notif.referenceId}/edit`;
    case 'Booking':
      return `/student/bookings/${notif.referenceId}`;
    case 'Order':
      return '/student/payments';
    default:
      return null;
  }
}

export { timeAgo };

function useNotificationsPageUrl(): string {
  const pathname = usePathname();
  if (pathname.startsWith('/student')) return '/student/notifications';
  if (pathname.startsWith('/admin')) return '/admin/notifications';
  return '/mentor/notifications';
}

export function UserNotificationsDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsPageUrl = useNotificationsPageUrl();

  const { data: countData } = useNotificationCount();
  const unreadCount = countData?.count ?? 0;

  const { data: notificationsData, isLoading } = useNotifications(1, DROPDOWN_MAX_ITEMS);
  const notifications = notificationsData?.items ?? [];
  const totalCount = notificationsData?.totalCount ?? 0;

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

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

  const handleNotificationClick = (notif: UserNotificationDto) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    const url = getNavigationUrl(notif);
    if (url) {
      setOpen(false);
      router.push(url);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
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
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                Bildirim yok.
              </div>
            ) : (
              notifications.map((notif: UserNotificationDto) => {
                const navUrl = getNavigationUrl(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      navUrl ? 'cursor-pointer' : ''
                    } ${!notif.isRead ? 'bg-teal-50/50' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <NotificationIcon type={notif.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${notif.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(notif.id);
                        }}
                        className="shrink-0 p-1 text-gray-500 hover:text-teal-600 transition-colors"
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

          {/* Footer - Bildirimleri Gor link */}
          <div className="border-t border-gray-200 px-4 py-2.5">
            <Link
              href={notificationsPageUrl}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Bildirimleri Gor
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
