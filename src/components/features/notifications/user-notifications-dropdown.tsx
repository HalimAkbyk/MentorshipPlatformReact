'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Loader2, AlertTriangle, BookOpen, PlayCircle, MessageSquare, Info } from 'lucide-react';
import {
  useNotifications,
  useNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/hooks/use-notifications';
import type { UserNotificationDto } from '@/lib/api/notifications';

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
    case 'CourseModeration':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'CourseApproved':
      return <PlayCircle className="h-4 w-4 text-green-500" />;
    case 'BookingConfirmed':
      return <BookOpen className="h-4 w-4 text-indigo-500" />;
    case 'Message':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-slate-400" />;
  }
}

function getNavigationUrl(notif: UserNotificationDto): string | null {
  if (!notif.referenceType || !notif.referenceId) return null;
  switch (notif.referenceType) {
    case 'Course':
      return `/mentor/courses/${notif.referenceId}/edit`;
    case 'Booking':
      return `/student/bookings/${notif.referenceId}`;
    default:
      return null;
  }
}

export function UserNotificationsDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useNotificationCount();
  const unreadCount = countData?.count ?? 0;

  const { data: notificationsData, isLoading } = useNotifications(1, 20);
  const notifications = notificationsData?.items ?? [];

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
        className="relative p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-navy-100 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100">
            <h3 className="text-sm font-semibold text-navy-600">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-lime-600 hover:text-lime-700 font-medium flex items-center gap-1"
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
                <Loader2 className="h-5 w-5 animate-spin text-navy-300" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-navy-300">
                Bildirim yok.
              </div>
            ) : (
              notifications.map((notif: UserNotificationDto) => {
                const navUrl = getNavigationUrl(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-navy-50 transition-colors border-b border-navy-50 ${
                      navUrl ? 'cursor-pointer' : ''
                    } ${!notif.isRead ? 'bg-lime-50/50' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <NotificationIcon type={notif.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${notif.isRead ? 'text-navy-500' : 'text-navy-700 font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-navy-300 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-navy-200 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(notif.id);
                        }}
                        className="shrink-0 p-1 text-navy-300 hover:text-lime-600 transition-colors"
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
            <div className="border-t border-navy-100 px-4 py-2.5 text-center">
              <span className="text-xs text-navy-300">
                Son {notifications.length} bildirim gosteriliyor
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
