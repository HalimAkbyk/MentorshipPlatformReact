'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  FileText,
  MessageSquare,
  Shield,
  Settings,
  BarChart3,
  Wrench,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Ticket,
  type LucideIcon,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ─── Navigation Data ────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'users',
    label: 'Kullanici Yonetimi',
    icon: Users,
    items: [
      { label: 'Tum Kullanicilar', href: '/admin/users' },
      { label: 'Mentor Onaylari', href: '/admin/verifications' },
      { label: 'Roller & Izinler', href: '/admin/roles' },
    ],
  },
  {
    id: 'education',
    label: 'Egitim Yonetimi',
    icon: GraduationCap,
    items: [
      { label: '1:1 Dersler', href: '/admin/bookings' },
      { label: 'Grup Dersleri', href: '/admin/group-classes' },
      { label: 'Video Kurslar', href: '/admin/courses' },
      { label: 'Sinav Modulu', href: '/admin/exams' },
    ],
  },
  {
    id: 'finance',
    label: 'Finans Yonetimi',
    icon: DollarSign,
    items: [
      { label: 'Siparisler', href: '/admin/orders' },
      { label: 'Iadeler', href: '/admin/refunds' },
      { label: 'Mentor Odemeleri', href: '/admin/payouts' },
      { label: 'Gelir Raporu', href: '/admin/revenue' },
      { label: 'Kuponlar', href: '/admin/coupons' },
    ],
  },
  {
    id: 'content',
    label: 'Icerik Yonetimi',
    icon: FileText,
    items: [
      { label: 'Anasayfa Modulleri', href: '/admin/cms/homepage' },
      { label: 'Banner Yonetimi', href: '/admin/cms/banners' },
      { label: 'Duyurular', href: '/admin/cms/announcements' },
      { label: 'Statik Sayfalar', href: '/admin/cms/pages' },
    ],
  },
  {
    id: 'communication',
    label: 'Iletisim',
    icon: MessageSquare,
    items: [
      { label: 'Mesaj Raporlari', href: '/admin/reports/messages' },
      { label: 'Bildirim Sablonlari', href: '/admin/notifications/templates' },
      { label: 'Toplu Bildirim', href: '/admin/notifications/send' },
    ],
  },
  {
    id: 'moderation',
    label: 'Moderasyon',
    icon: Shield,
    items: [
      { label: 'Ihtilafli Dersler', href: '/admin/disputes' },
      { label: 'Icerik Inceleme', href: '/admin/moderation/content' },
      { label: 'Kara Liste', href: '/admin/moderation/blacklist' },
    ],
  },
  {
    id: 'settings',
    label: 'Platform Ayarlari',
    icon: Settings,
    items: [
      { label: 'Genel Ayarlar', href: '/admin/settings/general' },
      { label: 'Kategoriler', href: '/admin/settings/categories' },
      { label: 'Komisyon Oranlari', href: '/admin/settings/fees' },
      { label: 'Avatar Yonetimi', href: '/admin/settings/avatars' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analitik',
    icon: BarChart3,
    items: [
      { label: 'Genel Bakis', href: '/admin/analytics/overview' },
      { label: 'Kullanici Analitik', href: '/admin/analytics/users' },
      { label: 'Finansal Raporlar', href: '/admin/analytics/financial' },
      { label: 'Disa Aktar', href: '/admin/analytics/export' },
    ],
  },
  {
    id: 'system',
    label: 'Sistem',
    icon: Wrench,
    items: [
      { label: 'Islem Gecmisi', href: '/admin/system/audit-log' },
      { label: 'Sistem Sagligi', href: '/admin/system/health' },
      { label: 'Arka Plan Isleri', href: '/admin/system/jobs' },
      { label: 'Ozellik Bayraklari', href: '/admin/system/feature-flags' },
    ],
  },
];

// ─── Helper: check if a group contains the active route ─

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );
}

// ─── Component ──────────────────────────────────────────

export function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      // Auto-expand the group containing the current route
      const initial: Record<string, boolean> = {};
      for (const group of NAV_GROUPS) {
        if (isGroupActive(group, pathname)) {
          initial[group.id] = true;
        }
      }
      return initial;
    }
  );

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + '/'),
    [pathname]
  );

  // ── Sidebar inner content ──────────────────────────────

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo / Brand ──────────────────────────────── */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50 shrink-0">
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-lime-500 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">D</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">
              Admin Panel
            </span>
          </Link>
        )}
        {collapsed && (
          <Link
            href="/admin/dashboard"
            className="mx-auto h-8 w-8 rounded-lg bg-lime-500 flex items-center justify-center"
          >
            <span className="text-slate-900 font-bold text-sm">D</span>
          </Link>
        )}
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="md:hidden text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {/* Dashboard (always visible, no group) */}
        <Link
          href="/admin/dashboard"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive('/admin/dashboard')
              ? 'bg-lime-500/15 text-lime-400'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          )}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Separator */}
        {!collapsed && (
          <div className="my-3 border-t border-slate-700/50" />
        )}
        {collapsed && <div className="my-3" />}

        {/* Nav Groups */}
        {NAV_GROUPS.map((group) => {
          const Icon = group.icon;
          const groupActive = isGroupActive(group, pathname);
          const expanded = expandedGroups[group.id] ?? false;

          return (
            <div key={group.id} className="space-y-0.5">
              {/* Group header */}
              <button
                onClick={() => {
                  if (collapsed) {
                    // If collapsed, expand the sidebar first
                    onToggle();
                    setExpandedGroups((prev) => ({
                      ...prev,
                      [group.id]: true,
                    }));
                  } else {
                    toggleGroup(group.id);
                  }
                }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  groupActive
                    ? 'text-lime-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
                title={collapsed ? group.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200',
                        expanded && 'rotate-180'
                      )}
                    />
                  </>
                )}
              </button>

              {/* Group items */}
              {!collapsed && (
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    expanded
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="ml-4 border-l border-slate-700/50 pl-3 py-1 space-y-0.5">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'block rounded-md px-3 py-2 text-sm transition-all duration-150',
                          isActive(item.href)
                            ? 'bg-lime-500/15 text-lime-400 font-medium'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Collapse toggle (desktop only) ────────────── */}
      <div className="hidden md:block shrink-0 border-t border-slate-700/50 p-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Daralt</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile overlay ────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-[#0f172a] transition-all duration-300 ease-in-out',
          // Desktop
          'hidden md:flex md:flex-col',
          collapsed ? 'md:w-[72px]' : 'md:w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile sidebar ────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-72 bg-[#0f172a] transition-transform duration-300 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
