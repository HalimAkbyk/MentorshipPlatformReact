'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isAdmin = user?.roles.includes(UserRole.Admin);
  const isMentor = user?.roles.includes(UserRole.Mentor);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const panelHref = isAdmin ? "/admin/dashboard" : isMentor ? "/mentor/dashboard" : "/student/dashboard";

  const navLinks = [
    { href: '/public/mentors', label: 'Mentorler' },
    { href: '/public/how-it-works', label: 'Nasil Calisir' },
    { href: '/public/pricing', label: 'Fiyatlandirma' },
    { href: '/auth/signup?role=mentor', label: 'Mentor Ol' },
  ];

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
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'text-primary-500 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-500 hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
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
                <span className="text-sm text-gray-600 font-medium">
                  {user?.displayName ?? user?.email}
                </span>
                <Link href={panelHref}>
                  <Button variant="outline" size="sm" className="border-primary-500 text-primary-500 hover:bg-primary-50 rounded-full">
                    Panel
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500">
                  Cikis
                </Button>
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
                  'px-4 py-3 rounded-lg text-sm font-medium',
                  isActive(link.href)
                    ? 'text-primary-500 bg-primary-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
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
                <Link href={panelHref} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Panel</Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  Cikis
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
