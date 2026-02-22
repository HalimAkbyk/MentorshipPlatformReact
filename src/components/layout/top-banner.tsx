'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Gift } from 'lucide-react';
import { useActiveBanners } from '@/lib/hooks/use-cms';
import { cn } from '@/lib/utils/cn';

function getDismissedBannerIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('dismissed-banners');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function dismissBannerId(id: string) {
  const ids = getDismissedBannerIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem('dismissed-banners', JSON.stringify(ids));
  }
}

const GRADIENT_PRESETS = [
  'from-teal-600 via-emerald-600 to-green-600',
  'from-emerald-500 to-teal-600',
  'from-teal-700 to-green-600',
  'from-green-600 via-teal-600 to-emerald-600',
];

export function TopBanner() {
  const { data: banners = [] } = useActiveBanners();
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissedBannerIds());
  }, []);

  // Show only Top position banners that haven't been dismissed
  const topBanners = banners.filter(
    (b) => b.position === 'Top' && !dismissed.includes(b.id)
  );

  if (topBanners.length === 0) return null;

  // Show the first active banner
  const banner = topBanners[0];
  const gradientIndex = banner.title.length % GRADIENT_PRESETS.length;
  const gradient = GRADIENT_PRESETS[gradientIndex];

  const content = (
    <div className="flex items-center justify-center gap-3">
      <Gift className="w-4 h-4 shrink-0" />
      <div className="flex items-center gap-2 text-center">
        <span className="font-semibold">{banner.title}</span>
        {banner.description && (
          <span className="hidden sm:inline opacity-90 font-normal">
            — {banner.description}
          </span>
        )}
      </div>
      {banner.linkUrl && (
        <ArrowRight className="w-4 h-4 shrink-0 opacity-80" />
      )}
    </div>
  );

  return (
    <div className={cn('relative bg-gradient-to-r text-white text-sm py-2.5 px-4', gradient)}>
      {banner.linkUrl ? (
        <Link
          href={banner.linkUrl}
          className="block hover:opacity-90 transition-opacity"
        >
          {content}
        </Link>
      ) : (
        content
      )}

      <button
        onClick={() => {
          dismissBannerId(banner.id);
          setDismissed((prev) => [...prev, banner.id]);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Kapat"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
