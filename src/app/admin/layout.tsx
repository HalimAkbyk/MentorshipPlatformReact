'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { cn } from '@/lib/utils/cn';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Menu,
  Search,
  LogOut,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { AdminSearchDialog } from '@/components/admin/admin-search-dialog';
import { AdminNotificationsDropdown } from '@/components/admin/admin-notifications-dropdown';

// ─── Constants ──────────────────────────────────────────

const COLLAPSED_KEY = 'admin-sidebar-collapsed';

// ─── Breadcrumb segment label map ───────────────────────

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  users: 'Tum Kullanicilar',
  verifications: 'Mentor Onaylari',
  roles: 'Roller & Izinler',
  bookings: '1:1 Dersler',
  'group-classes': 'Grup Dersleri',
  courses: 'Video Kurslar',
  exams: 'Sinav Modulu',
  orders: 'Siparisler',
  refunds: 'Iadeler',
  payouts: 'Mentor Odemeleri',
  revenue: 'Gelir Raporu',
  cms: 'Icerik Yonetimi',
  homepage: 'Anasayfa Modulleri',
  banners: 'Banner Yonetimi',
  announcements: 'Duyurular',
  pages: 'Statik Sayfalar',
  reports: 'Raporlar',
  messages: 'Mesaj Raporlari',
  notifications: 'Bildirimler',
  templates: 'Bildirim Sablonlari',
  send: 'Toplu Bildirim',
  disputes: 'Ihtilafli Dersler',
  moderation: 'Moderasyon',
  content: 'Icerik Inceleme',
  blacklist: 'Kara Liste',
  settings: 'Platform Ayarlari',
  general: 'Genel Ayarlar',
  categories: 'Kategoriler',
  fees: 'Komisyon Oranlari',
  avatars: 'Avatar Yonetimi',
  analytics: 'Analitik',
  overview: 'Genel Bakis',
  financial: 'Finansal Raporlar',
  export: 'Disa Aktar',
  system: 'Sistem',
  'audit-log': 'Islem Gecmisi',
  health: 'Sistem Sagligi',
  jobs: 'Arka Plan Isleri',
  'feature-flags': 'Ozellik Bayraklari',
};

// ─── Breadcrumb Component ───────────────────────────────

function AdminBreadcrumb() {
  const pathname = usePathname();

  const segments = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    // Remove 'admin' prefix for display but keep it for href building
    return parts.map((segment, index) => ({
      label: SEGMENT_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: '/' + parts.slice(0, index + 1).join('/'),
      isLast: index === parts.length - 1,
    }));
  }, [pathname]);

  // Skip rendering if only /admin
  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-sm">
      {segments.map((seg, i) => (
        <span key={seg.href} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
          {seg.isLast ? (
            <span className="text-slate-700 font-medium">{seg.label}</span>
          ) : (
            <Link
              href={seg.href}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              {seg.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

// ─── Admin Layout ───────────────────────────────────────

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize, logout } =
    useAuthStore();

  // Sidebar state
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load collapsed preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      if (stored !== null) {
        setCollapsed(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Auth initialization
  useEffect(() => {
    initialize?.();
  }, [initialize]);

  // Auth guard
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin');
      return;
    }

    if (user && !user.roles.includes(UserRole.Admin)) {
      router.push('/public');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setAvatarDropdownOpen(false);
      }
    }
    if (avatarDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [avatarDropdownOpen]);

  // Ctrl+K / Cmd+K shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close mobile sidebar on route change
  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Logout handler
  const handleLogout = useCallback(() => {
    setAvatarDropdownOpen(false);
    logout();
    router.push('/auth/login');
  }, [logout, router]);

  // Loading state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-lime-500" />
          <span className="text-sm text-slate-500">Yukleniyor...</span>
        </div>
      </div>
    );
  }

  // User initials for avatar fallback
  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'A';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Sidebar ─────────────────────────────────── */}
      <AdminSidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* ── Main wrapper ────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          // Desktop margin to account for sidebar width
          collapsed ? 'md:ml-[72px]' : 'md:ml-64'
        )}
      >
        {/* ── Top bar ─────────────────────────────── */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Left side: hamburger + breadcrumb */}
            <div className="flex items-center gap-4">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Breadcrumb */}
              <AdminBreadcrumb />
            </div>

            {/* Right side: search, notifications, avatar */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-56 lg:w-72 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-400 flex-1 text-left">Ara...</span>
                <kbd className="text-[10px] text-slate-400 border border-slate-300 rounded px-1.5 py-0.5">⌘K</kbd>
              </button>
              <AdminSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

              {/* Notifications */}
              <AdminNotificationsDropdown />

              {/* Separator */}
              <div className="hidden sm:block h-8 w-px bg-slate-200" />

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAvatarDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    {user?.avatarUrl ? (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.displayName}
                      />
                    ) : null}
                    <AvatarFallback className="bg-slate-700 text-white text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium text-slate-700 leading-tight">
                      {user?.displayName || 'Admin'}
                    </span>
                    <span className="text-xs text-slate-500 leading-tight">
                      Admin
                    </span>
                  </div>
                </button>

                {/* Dropdown */}
                {avatarDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-700">
                        {user?.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/admin/settings/general"
                        onClick={() => setAvatarDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>Profil Ayarlari</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cikis Yap</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────── */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
