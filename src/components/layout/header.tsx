'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Settings, LogOut, ChevronDown, Search, BookOpen, LayoutDashboard, Eye, HelpCircle, PlayCircle, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { cn } from '@/lib/utils/cn';

type NavLink = { href: string; label: string; icon?: React.ReactNode };

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isAdmin = user?.roles.includes(UserRole.Admin);
  const isMentor = user?.roles.includes(UserRole.Mentor);
  const isStudent = user?.roles.includes(UserRole.Student);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const panelHref = isAdmin ? '/admin/dashboard' : isMentor ? '/mentor/dashboard' : '/student/dashboard';
  const settingsHref = isAdmin ? '/admin/dashboard' : isMentor ? '/mentor/settings' : '/student/settings';

  // --- Role-based nav links ---
  const publicLinks: NavLink[] = [
    { href: '/public/mentors', label: 'Mentörler' },
    { href: '/public/courses', label: 'Eğitimler' },
    { href: '/public/how-it-works', label: 'Nasıl Çalışır' },
    { href: '/public/pricing', label: 'Fiyatlandırma' },
  ];

  const studentLinks: NavLink[] = [
    { href: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/student/explore-courses', label: 'Video Eğitimler', icon: <PlayCircle className="w-4 h-4" /> },
    { href: '/student/bookings', label: 'Rezervasyonlarım', icon: <BookOpen className="w-4 h-4" /> },
    { href: '/public/mentors', label: 'Mentör Bul', icon: <Search className="w-4 h-4" /> },
  ];

  const mentorLinks: NavLink[] = [
    { href: '/mentor/courses', label: 'Video Kurslarım', icon: <PlayCircle className="w-4 h-4" /> },
    { href: '/student/explore-courses', label: 'Eğitim Keşfet', icon: <Search className="w-4 h-4" /> },
    { href: '/student/bookings', label: 'Aldığım Seanslar', icon: <BookOpen className="w-4 h-4" /> },
    { href: `/public/mentors/${user?.id || ''}`, label: 'Profilimi Gör', icon: <Eye className="w-4 h-4" /> },
  ];

  const navLinks = isAuthenticated
    ? isAdmin
      ? publicLinks
      : isMentor
        ? mentorLinks
        : studentLinks
    : publicLinks;

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

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-navy-100/50'
          : 'glass'
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
                    ? 'text-lime-600 bg-lime-50'
                    : 'text-navy-500 hover:text-lime-600 hover:bg-navy-50'
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
                  <Button variant="ghost" className="text-navy-500 hover:text-lime-600">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="text-white rounded-full px-6" style={{ background: 'var(--gradient-cta)' }}>
                    Üye Ol
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href={panelHref}>
                  <Button variant="outline" size="sm" className="border-lime-500 text-lime-600 hover:bg-lime-50 rounded-full">
                    Panel
                  </Button>
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-50 transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="text-xs bg-lime-50 text-lime-700">
                        {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className={cn('w-4 h-4 text-navy-300 transition-transform', dropdownOpen && 'rotate-180')} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-navy-100 py-2 z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-navy-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback className="text-sm bg-lime-50 text-lime-700">
                              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-navy-600 truncate">{user?.displayName}</p>
                            <p className="text-xs text-navy-300 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          href={settingsHref}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-500 hover:bg-navy-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-navy-300" />
                          Kullanıcı Ayarları
                        </Link>
                        {isStudent && !isMentor && (
                          <Link
                            href="/auth/onboarding/mentor?source=student"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Mentor Ol
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-navy-100 py-1">
                        <button
                          onClick={() => { logout(); setDropdownOpen(false); router.push('/'); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-500 hover:bg-navy-50 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4 text-navy-300" />
                          Çıkış
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-navy-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-navy-600" /> : <Menu className="h-6 w-6 text-navy-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-navy-100 bg-white/95 backdrop-blur-xl absolute top-full left-0 right-0 z-50 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2',
                  isActive(link.href)
                    ? 'text-lime-600 bg-lime-50'
                    : 'text-navy-500 hover:bg-navy-50'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {isAuthenticated && link.icon}
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-navy-100" />
            {!isAuthenticated ? (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-navy-200 text-navy-500">Giriş Yap</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full text-white" style={{ background: 'var(--gradient-cta)' }}>Üye Ol</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                {/* Mobile user info */}
                <div className="flex items-center gap-3 px-4 py-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-xs bg-lime-50 text-lime-700">
                      {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-600 truncate">{user?.displayName}</p>
                    <p className="text-xs text-navy-300 truncate">{user?.email}</p>
                  </div>
                </div>
                <Link href={panelHref} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-lime-500 text-lime-600">Panel</Button>
                </Link>
                <Link href={settingsHref} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-navy-200 text-navy-500">
                    <Settings className="w-4 h-4 mr-2" />Kullanıcı Ayarları
                  </Button>
                </Link>
                {isStudent && !isMentor && (
                  <Link href="/auth/onboarding/mentor?source=student" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-amber-300 text-amber-600 hover:bg-amber-50">
                      <Sparkles className="w-4 h-4 mr-2" />Mentor Ol
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" className="w-full text-navy-500" onClick={() => { logout(); setMobileMenuOpen(false); router.push('/'); }}>
                  <LogOut className="w-4 h-4 mr-2" />Çıkış
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
