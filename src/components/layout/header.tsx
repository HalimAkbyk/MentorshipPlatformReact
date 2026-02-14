'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Settings, LogOut, ChevronDown, Search, BookOpen, LayoutDashboard, Eye, HelpCircle } from 'lucide-react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const panelHref = isAdmin ? '/admin/dashboard' : isMentor ? '/mentor/dashboard' : '/student/dashboard';
  const settingsHref = isAdmin ? '/admin/dashboard' : isMentor ? '/mentor/settings' : '/student/settings';

  // --- Role-based nav links ---
  const publicLinks: NavLink[] = [
    { href: '/public/mentors', label: 'Mentorler' },
    { href: '/public/how-it-works', label: 'Nasil Calisir' },
    { href: '/public/pricing', label: 'Fiyatlandirma' },
    { href: '/auth/signup?role=mentor', label: 'Mentor Ol' },
  ];

  const studentLinks: NavLink[] = [
    { href: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/student/bookings', label: 'Rezervasyonlarim', icon: <BookOpen className="w-4 h-4" /> },
    { href: '/public/mentors', label: 'Mentor Bul', icon: <Search className="w-4 h-4" /> },
  ];

  const mentorLinks: NavLink[] = [
    { href: `/public/mentors/${user?.id || ''}`, label: 'Profilimi Gor', icon: <Eye className="w-4 h-4" /> },
    { href: '/public/mentors', label: 'Mentorler', icon: <Search className="w-4 h-4" /> },
    { href: '/public/support', label: 'Yardim', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const navLinks = isAuthenticated
    ? isAdmin
      ? publicLinks // Admin keeps public nav
      : isMentor
        ? mentorLinks
        : studentLinks
    : publicLinks;

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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/logo.svg"
              alt="Degisim Mentorluk"
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
                    ? 'text-primary-500 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-500 hover:bg-gray-50'
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
                  <Button variant="ghost" className="text-gray-700 hover:text-primary-500">
                    Giris Yap
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-primary-500 hover:bg-primary-600 text-white rounded-full px-6">
                    Uye Ol
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href={panelHref}>
                  <Button variant="outline" size="sm" className="border-primary-500 text-primary-500 hover:bg-primary-50 rounded-full">
                    Panel
                  </Button>
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="text-xs bg-primary-50 text-primary-700">
                        {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', dropdownOpen && 'rotate-180')} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback className="text-sm bg-primary-50 text-primary-700">
                              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          href={settingsHref}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                          Kullanici Ayarlari
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={() => { logout(); setDropdownOpen(false); router.push('/'); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4 text-gray-400" />
                          Cikis
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
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white absolute top-full left-0 right-0 z-50 shadow-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2',
                  isActive(link.href)
                    ? 'text-primary-500 bg-primary-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {isAuthenticated && link.icon}
                {link.label}
              </Link>
            ))}
            <hr className="my-2" />
            {!isAuthenticated ? (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Giris Yap</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white">Uye Ol</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                {/* Mobile user info */}
                <div className="flex items-center gap-3 px-4 py-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-xs bg-primary-50 text-primary-700">
                      {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user?.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <Link href={panelHref} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Panel</Button>
                </Link>
                <Link href={settingsHref} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />Kullanici Ayarlari
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={() => { logout(); setMobileMenuOpen(false); router.push('/'); }}>
                  <LogOut className="w-4 h-4 mr-2" />Cikis
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
