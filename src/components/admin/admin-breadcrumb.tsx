'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const routeLabels: Record<string, string> = {
  admin: 'Yonetim Paneli',
  dashboard: 'Genel Bakis',
  users: 'Kullanicilar',
  mentors: 'Mentorler',
  students: 'Ogrenciler',
  bookings: 'Rezervasyonlar',
  sessions: 'Oturumlar',
  payments: 'Odemeler',
  orders: 'Siparisler',
  offerings: 'Hizmetler',
  reviews: 'Degerlendirmeler',
  reports: 'Raporlar',
  categories: 'Kategoriler',
  settings: 'Ayarlar',
  classes: 'Siniflar',
  'group-classes': 'Grup Dersleri',
  messages: 'Mesajlar',
  disputes: 'Itirazlar',
  refunds: 'Iadeler',
  analytics: 'Analitik',
  notifications: 'Bildirimler',
  profile: 'Profil',
  edit: 'Duzenle',
  create: 'Olustur',
  detail: 'Detay',
};

function getLabel(segment: string): string {
  return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function AdminBreadcrumb() {
  const pathname = usePathname();

  if (!pathname) return null;

  const segments = pathname.split('/').filter(Boolean);

  // Don't render breadcrumb if we're at root
  if (segments.length <= 1) return null;

  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label = getLabel(segment);
    const isLast = index === segments.length - 1;

    // Skip UUID-like segments in the label, show "Detay" instead
    const isId =
      segment.length > 20 ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    const displayLabel = isId ? 'Detay' : label;

    return { path, label: displayLabel, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link
        href="/admin"
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Ana Sayfa"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
          {crumb.isLast ? (
            <span
              className={cn(
                'font-medium text-gray-900 truncate max-w-[200px]'
              )}
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.path}
              className="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-[200px]"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
