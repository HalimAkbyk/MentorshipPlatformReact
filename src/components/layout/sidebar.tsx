'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, MessageSquare, Package, BookOpen, Clock,
  Zap, Users, PlayCircle, DollarSign, BarChart3, CreditCard,
  Wallet, Settings, Search, GraduationCap, Calendar, FileText,
  FolderOpen, ClipboardList, FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, activeView } = useAuthStore();

  const roles = user?.roles ?? [];
  const isMentor = roles.includes(UserRole.Mentor as any);
  const isStudent = roles.includes(UserRole.Student as any);
  const isDualRole = isMentor && isStudent;
  const viewAsMentor = isDualRole ? activeView === 'mentor' : isMentor;

  const sections: NavSection[] = [];

  // ── Mentor sections ──
  if (viewAsMentor) {
    sections.push({
      title: 'Genel',
      items: [
        { label: 'Panel', href: '/mentor/dashboard', icon: LayoutDashboard, color: 'text-teal-600' },
        { label: 'Mesajlarım', href: '/mentor/messages', icon: MessageSquare, color: 'text-blue-600' },
      ],
    });

    sections.push({
      title: 'Icerik Yonetimi',
      items: [
        { label: '1:1 Paketlerim', href: '/mentor/offerings', icon: Package, color: 'text-purple-600' },
        { label: 'Seanslarım', href: '/mentor/bookings', icon: BookOpen, color: 'text-blue-600' },
        { label: 'Seans Talepleri', href: '/mentor/session-requests', icon: Clock, color: 'text-amber-600' },
        { label: 'Anlık Seans', href: '/mentor/free-session', icon: Zap, color: 'text-orange-500' },
        { label: 'Grup Dersleri', href: '/mentor/group-classes', icon: Users, color: 'text-indigo-600' },
        { label: 'Video Egitimlerim', href: '/mentor/courses', icon: PlayCircle, color: 'text-green-600' },
        { label: 'Sinavlarim', href: '/mentor/exams', icon: FileText, color: 'text-rose-600' },
      ],
    });

    sections.push({
      title: 'Icerik & Mufredat',
      items: [
        { label: 'Kutuphanem', href: '/mentor/library', icon: FolderOpen, color: 'text-cyan-600' },
        { label: 'Mufredatlarim', href: '/mentor/curriculums', icon: BookOpen, color: 'text-indigo-600' },
        { label: 'Oturum Planlari', href: '/mentor/session-plans', icon: ClipboardList, color: 'text-amber-600' },
        { label: 'Odevler', href: '/mentor/assignments', icon: FileCheck, color: 'text-emerald-600' },
      ],
    });

    sections.push({
      title: 'Kazanc',
      items: [
        { label: 'Kazanclarım', href: '/mentor/earnings', icon: DollarSign, color: 'text-green-600' },
        { label: 'Performansım', href: '/mentor/performance', icon: BarChart3, color: 'text-purple-600' },
      ],
    });

    sections.push({
      title: 'Hesap',
      items: [
        { label: 'Uygunluk', href: '/mentor/availability', icon: Calendar, color: 'text-teal-600' },
        { label: 'Ayarlar', href: '/mentor/settings', icon: Settings, color: 'text-gray-500' },
      ],
    });
  }

  // ── Student sections ──
  if (isStudent && !viewAsMentor) {
    sections.push({
      title: 'Genel',
      items: [
        { label: 'Panel', href: '/student/dashboard', icon: LayoutDashboard, color: 'text-teal-600' },
        { label: 'Mesajlarım', href: '/student/messages', icon: MessageSquare, color: 'text-blue-600' },
      ],
    });

    sections.push({
      title: 'Kesfet',
      items: [
        { label: 'Egitim Kesfet', href: '/student/explore-courses', icon: Search, color: 'text-teal-600' },
        { label: 'Grup Dersleri', href: '/student/explore-classes', icon: Users, color: 'text-indigo-600' },
      ],
    });

    sections.push({
      title: 'Katılımlarım',
      items: [
        { label: 'Seanslarım', href: '/student/bookings', icon: BookOpen, color: 'text-blue-600' },
        { label: 'Seans Taleplerim', href: '/student/session-requests', icon: Clock, color: 'text-amber-600' },
        { label: 'Grup Derslerim', href: '/student/my-classes', icon: GraduationCap, color: 'text-indigo-600' },
        { label: 'Video Egitimlerim', href: '/student/courses', icon: PlayCircle, color: 'text-green-600' },
        { label: 'Sinavlarim', href: '/student/exams', icon: FileText, color: 'text-rose-600' },
      ],
    });

    sections.push({
      title: 'Ders Takibi',
      items: [
        { label: 'Mufredatim', href: '/student/curriculum', icon: BookOpen, color: 'text-indigo-600' },
        { label: 'Odevlerim', href: '/student/assignments', icon: FileCheck, color: 'text-emerald-600' },
      ],
    });

    sections.push({
      title: 'Hesap',
      items: [
        { label: 'Odemelerim', href: '/student/payments', icon: Wallet, color: 'text-green-600' },
        { label: 'Kredilerim', href: '/student/credits', icon: CreditCard, color: 'text-purple-600' },
        { label: 'Ayarlar', href: '/student/settings', icon: Settings, color: 'text-gray-500' },
      ],
    });
  }

  return (
    <aside className="hidden md:block w-60 xl:w-64 border-r bg-white sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto flex-shrink-0">
      <div className="p-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">
              {section.title}
            </div>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                      active
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-teal-600' : item.color)} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
