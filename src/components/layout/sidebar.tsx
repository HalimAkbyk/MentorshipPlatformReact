'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, MessageSquare, Package, BookOpen, Clock,
  Zap, Users, PlayCircle, DollarSign, BarChart3, CreditCard,
  Wallet, Settings, Search, GraduationCap, Calendar, FileText,
  FolderOpen, ClipboardList, FileCheck, Copy, PanelLeftClose, PanelLeft,
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

const SIDEBAR_PIN_KEY = 'sidebar-pinned';

export function Sidebar() {
  const pathname = usePathname();
  const { user, activeView } = useAuthStore();
  const [pinned, setPinned] = useState(true);
  const [hovered, setHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load pinned state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_PIN_KEY);
    if (stored !== null) {
      setPinned(stored === 'true');
    }
  }, []);

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    localStorage.setItem(SIDEBAR_PIN_KEY, String(next));
    if (next) setHovered(false);
  };

  const handleMouseEnter = () => {
    if (pinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setHovered(true), 80);
  };

  const handleMouseLeave = () => {
    if (pinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setHovered(false), 200);
  };

  // Expanded = pinned OR hovered
  const expanded = pinned || hovered;

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
        { label: 'Sablonlarim', href: '/mentor/templates', icon: Copy, color: 'text-amber-600' },
        { label: 'Ogrenci Ilerlemeleri', href: '/mentor/curriculums/students', icon: Users, color: 'text-violet-600' },
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
    <>
      {/* Spacer: reserves layout space — collapsed or pinned width */}
      <div
        className={cn(
          'hidden md:block flex-shrink-0 transition-all duration-200',
          pinned ? 'w-60 xl:w-64' : 'w-[56px]'
        )}
      />

      {/* Actual sidebar: absolutely positioned so it can expand on hover without pushing content */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'hidden md:flex flex-col fixed top-[65px] left-0 h-[calc(100vh-65px)] bg-white border-r overflow-hidden z-30 transition-all duration-200',
          expanded ? 'w-60 xl:w-64' : 'w-[56px]',
          !pinned && hovered && 'shadow-xl'
        )}
      >
        {/* Pin toggle */}
        <div className={cn(
          'flex items-center border-b border-gray-100 flex-shrink-0',
          expanded ? 'justify-end px-3 py-2' : 'justify-center py-2'
        )}>
          <button
            onClick={togglePin}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title={pinned ? 'Menuyu daralt' : 'Menuyu sabitle'}
          >
            {pinned ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3">
          {sections.map((section) => (
            <div key={section.title}>
              {expanded ? (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1.5">
                  {section.title}
                </div>
              ) : (
                <div className="h-px bg-gray-100 mx-2 my-1.5" />
              )}
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!expanded ? item.label : undefined}
                      className={cn(
                        'flex items-center rounded-lg transition-colors relative group',
                        expanded ? 'gap-2.5 px-3 py-2 text-sm' : 'justify-center px-0 py-2',
                        active
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'flex-shrink-0 transition-colors',
                          expanded ? 'w-4 h-4' : 'w-[18px] h-[18px]',
                          active ? 'text-teal-600' : item.color
                        )}
                      />
                      {expanded && <span className="truncate">{item.label}</span>}

                      {/* Tooltip for collapsed mode */}
                      {!expanded && (
                        <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
