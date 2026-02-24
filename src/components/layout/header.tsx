'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, Settings, LogOut, ChevronDown, Search, BookOpen,
  LayoutDashboard, Eye, PlayCircle, Sparkles, CreditCard,
  GraduationCap, Package, Calendar, DollarSign, MessageSquare,
  Users,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUnreadCount } from '@/lib/hooks/use-messages';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/lib/types/enums';
import { cn } from '@/lib/utils/cn';
import { UserNotificationsDropdown } from '../features/notifications/user-notifications-dropdown';
import { stopConnection } from '@/lib/signalr/chat-connection';

type NavLink = { href: string; label: string; icon?: React.ReactNode };

/* ------------------------------------------------------------------ */
/* Dropdown menu link helper                                          */
/* ------------------------------------------------------------------ */
function DropdownLink({
  href, icon, label, onClick, className,
}: {
  href: string; icon: React.ReactNode; label: string; onClick: () => void; className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 transition-colors',
        className,
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-2 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {children}
      </span>
    </div>
  );
}

/* ================================================================== */
/* HEADER                                                             */
/* ================================================================== */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isAdmin = user?.roles.includes(UserRole.Admin);
  const isMentor = user?.roles.includes(UserRole.Mentor);
  const isStudent = user?.roles.includes(UserRole.Student);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useUnreadCount();
  const totalUnread = unreadData?.totalUnread ?? 0;
  const messagesHref = isMentor ? '/mentor/messages' : '/student/messages';

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const panelHref = isAdmin ? '/admin/dashboard' : isMentor ? '/mentor/dashboard' : '/student/dashboard';
  const settingsHref = isAdmin ? '/admin/dashboard' : isMentor ? '/mentor/settings' : '/student/settings';

  const closeDropdown = () => setDropdownOpen(false);
  const closeMobile = () => setMobileMenuOpen(false);

  // --- Nav links ---
  const publicLinks: NavLink[] = [
    { href: '/public/mentors', label: 'Mentorler' },
    { href: '/public/courses', label: 'Eğitimler' },
    { href: '/public/how-it-works', label: 'Nasıl Çalışır' },
    { href: '/public/pricing', label: 'Fiyatlandırma' },
  ];

  // Unified authenticated links — same for Student & Mentor
  const authenticatedLinks: NavLink[] = [
    { href: '/student/explore-courses', label: 'Eğitimler', icon: <PlayCircle className="w-4 h-4" /> },
    { href: '/public/mentors', label: 'Mentor Bul', icon: <Search className="w-4 h-4" /> },
    { href: '/student/explore-classes', label: 'Grup Dersleri', icon: <Users className="w-4 h-4" /> },
  ];

  const navLinks = isAuthenticated && !isAdmin ? authenticatedLinks : publicLinks;

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Dropdown content (shared between desktop dropdown & mobile menu)  */
  /* ---------------------------------------------------------------- */
  const renderDropdownSections = (onClose: () => void) => (
    <>
      {/* Panel */}
      <div className="py-1">
        <SectionLabel>Panel</SectionLabel>
        <DropdownLink
          href={panelHref}
          icon={<LayoutDashboard className="w-4 h-4 text-teal-500" />}
          label="Panel"
          onClick={onClose}
          className="font-medium text-teal-600 hover:bg-teal-50"
        />
      </div>

      {/* Mentor Yönetimi */}
      {isMentor && (
        <div className="border-t border-gray-200 py-1">
          <SectionLabel>Mentor Yönetimi</SectionLabel>
          <DropdownLink href="/mentor/courses" icon={<PlayCircle className="w-4 h-4 text-gray-400" />} label="Video Kurslarim" onClick={onClose} />
          <DropdownLink href="/mentor/offerings" icon={<Package className="w-4 h-4 text-gray-400" />} label="Paketlerim" onClick={onClose} />
          <DropdownLink href="/mentor/availability" icon={<Calendar className="w-4 h-4 text-gray-400" />} label="Uygunluk" onClick={onClose} />
          <DropdownLink href="/mentor/bookings" icon={<BookOpen className="w-4 h-4 text-gray-400" />} label="Derslerim" onClick={onClose} />
          <DropdownLink href="/mentor/group-classes" icon={<Users className="w-4 h-4 text-gray-400" />} label="Grup Dersleri" onClick={onClose} />
          <DropdownLink href="/mentor/earnings" icon={<DollarSign className="w-4 h-4 text-gray-400" />} label="Kazanclarim" onClick={onClose} />
          <DropdownLink href={`/public/mentors/${user?.id || ''}`} icon={<Eye className="w-4 h-4 text-gray-400" />} label="Profilimi Gör" onClick={onClose} />
        </div>
      )}

      {/* Hesap */}
      <div className="border-t border-gray-200 py-1">
        <SectionLabel>Hesap</SectionLabel>
        <DropdownLink
          href={messagesHref}
          icon={
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              {totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>
          }
          label="Mesajlarım"
          onClick={onClose}
        />
        <DropdownLink href="/student/bookings" icon={<Calendar className="w-4 h-4 text-gray-400" />} label="Rezervasyonlarım" onClick={onClose} />
        <DropdownLink href="/student/my-classes" icon={<Users className="w-4 h-4 text-gray-400" />} label="Grup Derslerim" onClick={onClose} />
        <DropdownLink href="/student/courses" icon={<BookOpen className="w-4 h-4 text-gray-400" />} label="Kayıtlarım" onClick={onClose} />
        <DropdownLink href="/student/payments" icon={<CreditCard className="w-4 h-4 text-gray-400" />} label="Ödemelerim" onClick={onClose} />
        <DropdownLink href={settingsHref} icon={<Settings className="w-4 h-4 text-gray-400" />} label="Ayarlar" onClick={onClose} />
        {isStudent && !isMentor && (
          <DropdownLink
            href="/auth/onboarding/mentor?source=student"
            icon={<Sparkles className="w-4 h-4 text-amber-500" />}
            label="Mentor Ol"
            onClick={onClose}
            className="text-amber-600 hover:bg-amber-50"
          />
        )}
      </div>

      {/* Çıkış */}
      <div className="border-t border-gray-200 py-1">
        <button
          onClick={() => { stopConnection(); queryClient.clear(); logout(); onClose(); router.push('/'); }}
          className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          Çıkış
        </button>
      </div>
    </>
  );

  /* ================================================================ */
  /* RENDER                                                           */
  /* ================================================================ */
  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200'
          : 'bg-white/95 backdrop-blur-lg'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/logo.svg"
              alt="Değişim Mentorluk"
              width={200}
              height={50}
              className="h-10 md:h-12 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                  isActive(link.href)
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                )}
              >
                {isAuthenticated && link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons / User Dropdown */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-teal-600">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="gradient" className="rounded-full px-6">
                    Üye Ol
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-1">
              {/* Notification Bell */}
              <UserNotificationsDropdown />
              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-xs bg-teal-50 text-teal-700">
                      {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', dropdownOpen && 'rotate-180')} />
                </button>

                {dropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 py-2 z-50 max-h-[calc(100vh-100px)] overflow-y-auto"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user?.avatarUrl} />
                          <AvatarFallback className="text-sm bg-teal-50 text-teal-700">
                            {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {renderDropdownSections(closeDropdown)}
                  </div>
                )}
              </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-gray-900" /> : <Menu className="h-6 w-6 text-gray-900" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl absolute top-full left-0 right-0 z-50 shadow-lg max-h-[calc(100vh-80px)] overflow-y-auto">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col space-y-1">
            {/* Nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2',
                  isActive(link.href)
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
                onClick={closeMobile}
              >
                {isAuthenticated && link.icon}
                {link.label}
              </Link>
            ))}

            <hr className="my-2 border-gray-200" />

            {!isAuthenticated ? (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/auth/login" onClick={closeMobile}>
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700">Giriş Yap</Button>
                </Link>
                <Link href="/auth/signup" onClick={closeMobile}>
                  <Button variant="gradient" className="w-full">Üye Ol</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Mobile user info */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-xs bg-teal-50 text-teal-700">
                      {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>

                {renderDropdownSections(closeMobile)}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
