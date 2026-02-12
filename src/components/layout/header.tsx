'use client';

import { useState } from 'react';
import Link from 'next/link';
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

  const navLinks = (
    <>
      <Link href="/public/mentors" className={cn(
        'px-3 py-2 rounded-md text-sm hover:bg-gray-100',
        isActive('/public/mentors') && 'bg-gray-100'
      )} onClick={() => setMobileMenuOpen(false)}>
        Mentörler
      </Link>
      <Link href="/public/how-it-works" className={cn(
        'px-3 py-2 rounded-md text-sm hover:bg-gray-100',
        isActive('/public/how-it-works') && 'bg-gray-100'
      )} onClick={() => setMobileMenuOpen(false)}>
        Nasıl Çalışır
      </Link>
      <Link href="/public/pricing" className={cn(
        'px-3 py-2 rounded-md text-sm hover:bg-gray-100',
        isActive('/public/pricing') && 'bg-gray-100'
      )} onClick={() => setMobileMenuOpen(false)}>
        Ücretlendirme
      </Link>
    </>
  );

  const authButtons = (
    <>
      {!isAuthenticated ? (
        <>
          <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost">Giriş</Button>
          </Link>
          <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
            <Button>Üye Ol</Button>
          </Link>
        </>
      ) : (
        <>
          <span className="text-sm text-gray-600">
            {user?.displayName ?? user?.email}
          </span>
          <Link href={panelHref} onClick={() => setMobileMenuOpen(false)}>
            <Button variant="outline">Panel</Button>
          </Link>
          <Button variant="ghost" onClick={() => { logout(); setMobileMenuOpen(false); }}>
            Çıkış
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="border-b relative">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary-600">
          MentorHub
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks}
          <div className="flex items-center gap-2">
            {authButtons}
          </div>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menüyü aç/kapat"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white absolute top-full left-0 right-0 z-50 shadow-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            {navLinks}
            <hr className="my-2" />
            <div className="flex flex-col space-y-2">
              {authButtons}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
