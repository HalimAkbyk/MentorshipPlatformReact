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

  // Mentor+Student dual role: Mentor bölümü önce, sonra öğrenci bölümü (ayrı gruplar)
  const mentorItems: Item[] = isMentor
    ? [
        { label: 'Mentor Dashboard', href: '/mentor/dashboard' },
        { label: 'Video Kurslarım', href: '/mentor/courses' },
        { label: 'Uygunluk', href: '/mentor/availability' },
        { label: 'Kazançlar', href: '/mentor/earnings' },
        { label: 'Mentor Ayarlar', href: '/mentor/settings' },
      ]
    : [];

  const studentItems: Item[] = isStudent
    ? isMentor
      ? [
          // Mentor+Student: sadece öğrenci-spesifik sayfalar (duplicate olmasın)
          { label: 'Eğitim Keşfet', href: '/student/explore-courses' },
          { label: 'Aldığım Kurslar', href: '/student/courses' },
          { label: 'Aldığım Seanslar', href: '/student/bookings' },
        ]
      : [
          // Sadece Student
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Video Eğitimler', href: '/student/explore-courses' },
          { label: 'Kurslarım', href: '/student/courses' },
          { label: 'Rezervasyonlarım', href: '/student/bookings' },
          { label: 'Ayarlar', href: '/student/settings' },
        ]
    : [];

  const items: Item[] = [...mentorItems, ...studentItems];

  return (
    <aside className="w-full md:w-64 border-r bg-white">
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-2">Menü</div>
        <nav className="flex flex-col gap-1">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Menü için giriş yapmalısın.</div>
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
