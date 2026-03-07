'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { TopBanner } from '@/components/layout/top-banner';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';

const sidebarPages = ['/public/packages', '/public/mentors'];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, activeView } = useAuthStore();
  const isMentor = user?.roles?.includes(UserRole.Mentor);
  const isStudent = user?.roles?.includes(UserRole.Student);
  const isDualRole = isMentor && isStudent;
  const viewAsMentor = isDualRole ? activeView === 'mentor' : !!isMentor;
  // Only show sidebar on specific pages AND only when viewing as student
  const showSidebar = !isLoading && isAuthenticated && !viewAsMentor && sidebarPages.some(p => pathname?.startsWith(p));

  return (
    <>
      <AnnouncementBar />
      <Header />
      <TopBanner />
      {showSidebar ? (
        <div className="min-h-screen bg-gray-50">
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      ) : (
        <main>{children}</main>
      )}
      <Footer />
    </>
  );
}
