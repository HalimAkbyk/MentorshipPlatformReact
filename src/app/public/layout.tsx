'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { TopBanner } from '@/components/layout/top-banner';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const showSidebar = !isLoading && isAuthenticated;

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
