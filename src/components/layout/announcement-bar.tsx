'use client';

import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, Wrench, Megaphone } from 'lucide-react';
import { useActiveAnnouncements } from '@/lib/hooks/use-cms';
import { cn } from '@/lib/utils/cn';

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  Info: {
    bg: 'bg-blue-600',
    text: 'text-white',
    border: 'border-blue-700',
    icon: <Info className="w-4 h-4" />,
  },
  Warning: {
    bg: 'bg-amber-500',
    text: 'text-amber-950',
    border: 'border-amber-600',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  Maintenance: {
    bg: 'bg-red-600',
    text: 'text-white',
    border: 'border-red-700',
    icon: <Wrench className="w-4 h-4" />,
  },
};

function getDismissedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('dismissed-announcements');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function dismissId(id: string) {
  const ids = getDismissedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem('dismissed-announcements', JSON.stringify(ids));
  }
}

export function AnnouncementBar() {
  const { data: announcements = [] } = useActiveAnnouncements();
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissedIds());
  }, []);

  const visible = announcements.filter((a) => !dismissed.includes(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="w-full z-[60]">
      {visible.map((announcement) => {
        const style = TYPE_STYLES[announcement.type] || TYPE_STYLES.Info;

        return (
          <div
            key={announcement.id}
            className={cn(
              'relative flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium',
              style.bg,
              style.text
            )}
          >
            <span className="shrink-0">{style.icon}</span>
            <span className="truncate max-w-[600px] text-center">
              <strong>{announcement.title}</strong>
              {announcement.content && (
                <span className="ml-1.5 opacity-90 font-normal hidden sm:inline">
                  — {announcement.content.length > 100
                    ? announcement.content.slice(0, 100) + '...'
                    : announcement.content}
                </span>
              )}
            </span>

            {announcement.isDismissible && (
              <button
                onClick={() => {
                  dismissId(announcement.id);
                  setDismissed((prev) => [...prev, announcement.id]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
