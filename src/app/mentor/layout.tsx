'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Classroom sayfalarında Header/Footer gösterme (tam ekran deneyim)
  const isClassroomPage = pathname.includes('/classroom/') || pathname.includes('/group-classroom/');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (user && !user.roles.includes(UserRole.Mentor)) {
        router.push('/public');
      }
      // ✅ Profil eksikliği kontrolü KALDIRILDI - Dashboard'da bilgilendirici mesaj gösterilecek
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Classroom pages: no Header/Footer, full viewport
  if (isClassroomPage) {
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