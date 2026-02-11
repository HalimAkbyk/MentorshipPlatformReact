'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isAdmin = user?.roles.includes(UserRole.Admin);
  const isStudent = user?.roles.includes(UserRole.Student);
  const isMentor = user?.roles.includes(UserRole.Mentor);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            MentorHub
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/public/mentors" className={cn(
              'px-3 py-2 rounded-md text-sm hover:bg-gray-100',
              isActive('/public/mentors') && 'bg-gray-100'
            )}>
              Mentörler
            </Link>
            <Link href="/public/how-it-works" className={cn(
              'px-3 py-2 rounded-md text-sm hover:bg-gray-100',
              isActive('/public/how-it-works') && 'bg-gray-100'
            )}>
              Nasıl Çalışır
            </Link>
            <Link href="/public/pricing" className={cn(
              'px-3 py-2 rounded-md text-sm hover:bg-gray-100',
              isActive('/public/pricing') && 'bg-gray-100'
            )}>
              Ücretlendirme
            </Link>
             <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Link href="/auth/login">
                <Button variant="ghost">Giriş</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Üye Ol</Button>
              </Link>
            </>
          ) : (
            <>
              <span className="hidden sm:inline text-sm text-gray-600">
                {user?.displayName ?? user?.email}
              </span>
              <Link href={isAdmin ? "/admin/dashboard" : isMentor ? "/mentor/dashboard" : "/student/dashboard"}>
                <Button variant="outline">Panel</Button>
              </Link>
              <Button variant="ghost" onClick={logout}>
                Çıkış
              </Button>
            </>
          )}
        </div>
          
          </nav>
        </div>
      </header>
  );
}
