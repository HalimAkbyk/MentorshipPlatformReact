'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';

type Item = { label: string; href: string };

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const roles = user?.roles ?? [];
  const isMentor = roles.includes(UserRole.Mentor as any);
  const isStudent = roles.includes(UserRole.Student as any);

  // Mentor yonetim sayfalari
  const mentorItems: Item[] = isMentor
    ? [
        { label: 'Panel', href: '/mentor/dashboard' },
        { label: 'Video Kurslarim', href: '/mentor/courses' },
        { label: 'Paketlerim', href: '/mentor/offerings' },
        { label: 'Uygunluk', href: '/mentor/availability' },
        { label: 'Derslerim', href: '/mentor/bookings' },
        { label: 'Kazanclarim', href: '/mentor/earnings' },
        { label: 'Mentor Ayarlar', href: '/mentor/settings' },
      ]
    : [];

  // Ogrenci sayfalari (mentor olsa bile erisebilir)
  const studentItems: Item[] = isStudent
    ? isMentor
      ? [
          // Mentor+Student: sadece ogrenci-spesifik sayfalar
          { label: 'Egitim Kesfet', href: '/student/explore-courses' },
          { label: 'Aldugim Kurslar', href: '/student/courses' },
          { label: 'Rezervasyonlarim', href: '/student/bookings' },
          { label: 'Odemelerim', href: '/student/payments' },
        ]
      : [
          // Sadece Student
          { label: 'Panel', href: '/student/dashboard' },
          { label: 'Egitimler', href: '/student/explore-courses' },
          { label: 'Kurslarim', href: '/student/courses' },
          { label: 'Rezervasyonlarim', href: '/student/bookings' },
          { label: 'Odemelerim', href: '/student/payments' },
          { label: 'Ayarlar', href: '/student/settings' },
        ]
    : [];

  const items: Item[] = [...mentorItems, ...studentItems];

  return (
    <aside className="w-full md:w-64 border-r bg-white">
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-2">Menu</div>
        <nav className="flex flex-col gap-1">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Menu icin giris yapmalisin.</div>
          ) : (
            items.map((it) => {
              const active = pathname === it.href || pathname?.startsWith(it.href + '/');
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm hover:bg-gray-100',
                    active && 'bg-gray-100 font-medium'
                  )}
                >
                  {it.label}
                </Link>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
}
