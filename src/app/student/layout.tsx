'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Kurs player ve classroom sayfalarında Header/Footer gösterme (tam ekran deneyim)
  const isPlayerPage = pathname.includes('/courses/') && pathname.endsWith('/learn');
  const isClassroomPage = pathname.includes('/classroom/') || pathname.includes('/group-classroom/');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (user && !user.roles.includes(UserRole.Student)) {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  // Player/Classroom pages: no Header/Footer, full viewport
  if (isPlayerPage || isClassroomPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <main>{children}</main>
      </div>
      <Footer />
    </>
  );
}
