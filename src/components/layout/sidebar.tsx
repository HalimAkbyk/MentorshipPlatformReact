'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';

type Item = { label: string; href: string };
type Section = { title: string; items: Item[] };

export function Sidebar() {
  const pathname = usePathname();
  const { user, activeView } = useAuthStore();

  const roles = user?.roles ?? [];
  const isMentor = roles.includes(UserRole.Mentor as any);
  const isStudent = roles.includes(UserRole.Student as any);
  const isDualRole = isMentor && isStudent;
  const viewAsMentor = isDualRole ? activeView === 'mentor' : isMentor;

  const sections: Section[] = [];

  // ── Mentor sections ──
  if (viewAsMentor) {
    sections.push({
      title: 'Genel',
      items: [
        { label: 'Panel', href: '/mentor/dashboard' },
        { label: 'Mesajlarım', href: '/mentor/messages' },
      ],
    });

    sections.push({
      title: 'İçerik Yönetimi',
      items: [
        { label: '1:1 Paketlerim', href: '/mentor/offerings' },
        { label: 'Bire Bir Seanslarım', href: '/mentor/bookings' },
        { label: 'Seans Talepleri', href: '/mentor/session-requests' },
        { label: 'Anlık Seans', href: '/mentor/free-session' },
        { label: 'Çoklu Seanslarım', href: '/mentor/group-classes' },
        { label: 'Video Eğitimlerim', href: '/mentor/courses' },
      ],
    });

    sections.push({
      title: 'Kazanç',
      items: [
        { label: 'Kazançlarım', href: '/mentor/earnings' },
        { label: 'Performansım', href: '/mentor/performance' },
      ],
    });
  }

  // ── Student sections ──
  if (isStudent && !viewAsMentor) {
    sections.push({
      title: 'Genel',
      items: [
        { label: 'Panel', href: '/student/dashboard' },
        { label: 'Mesajlarım', href: '/student/messages' },
      ],
    });

    const katilimItems: Item[] = [
      { label: 'Eğitim Keşfet', href: '/student/explore-courses' },
      { label: 'Grup Dersleri Keşfet', href: '/student/explore-classes' },
      { label: 'Bire Bir Seanslarım', href: '/student/bookings' },
      { label: 'Seans Taleplerim', href: '/student/session-requests' },
      { label: 'Çoklu Seanslarım', href: '/student/my-classes' },
      { label: 'Video Eğitimlerim', href: '/student/courses' },
    ];

    sections.push({
      title: 'Katılımlarım',
      items: katilimItems,
    });

    const hesapItems: Item[] = [
      { label: 'Ödemelerim', href: '/student/payments' },
      { label: 'Kredilerim', href: '/student/credits' },
      { label: 'Ayarlar', href: viewAsMentor ? '/mentor/settings' : '/student/settings' },
    ];

    sections.push({
      title: 'Hesap',
      items: hesapItems,
    });
  }

  return (
    <aside className="hidden md:block w-64 border-r bg-white sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto flex-shrink-0">
      <div className="p-4">
        {sections.length === 0 ? (
          <div className="text-sm text-gray-500">Menü için giriş yapmalısın.</div>
        ) : (
          <nav className="flex flex-col gap-4">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1">
                  {section.title}
                </div>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((it) => {
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
                  })}
                </div>
              </div>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}
