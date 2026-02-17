'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

interface StatusConfig {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
}

const statusMap: Record<string, StatusConfig> = {
  // Green - active / positive
  Active: { label: 'Aktif', dotColor: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  Confirmed: { label: 'Onaylandi', dotColor: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  Approved: { label: 'Onaylandi', dotColor: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  Published: { label: 'Yayinda', dotColor: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  Paid: { label: 'Odendi', dotColor: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },

  // Yellow/amber - pending
  Pending: { label: 'Beklemede', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  PendingPayment: { label: 'Odeme Bekleniyor', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  Draft: { label: 'Taslak', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  PendingApproval: { label: 'Onay Bekliyor', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },

  // Red - cancelled / negative
  Cancelled: { label: 'Iptal Edildi', dotColor: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  Rejected: { label: 'Reddedildi', dotColor: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  Failed: { label: 'Basarisiz', dotColor: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  Suspended: { label: 'Askiya Alindi', dotColor: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  Banned: { label: 'Yasaklandi', dotColor: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },

  // Blue - completed
  Completed: { label: 'Tamamlandi', dotColor: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  Attended: { label: 'Katildi', dotColor: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },

  // Gray - expired / archived
  Expired: { label: 'Suresi Doldu', dotColor: 'bg-gray-400', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  Archived: { label: 'Arsivlendi', dotColor: 'bg-gray-400', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  Inactive: { label: 'Pasif', dotColor: 'bg-gray-400', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },

  // Orange - disputed
  Disputed: { label: 'Itiraz Edildi', dotColor: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  UnderReview: { label: 'Inceleniyor', dotColor: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },

  // Purple - refund
  Refunded: { label: 'Iade Edildi', dotColor: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  PartiallyRefunded: { label: 'Kismi Iade', dotColor: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },

  // Notification / Report statuses
  Reviewed: { label: 'Incelendi', dotColor: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  Dismissed: { label: 'Reddedildi', dotColor: 'bg-gray-400', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  Scheduled: { label: 'Zamanlanmis', dotColor: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  Sending: { label: 'Gonderiliyor', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  Sent: { label: 'Gonderildi', dotColor: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
};

function getStatusConfig(status: string): StatusConfig {
  return (
    statusMap[status] || {
      label: status,
      dotColor: 'bg-gray-400',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
    }
  );
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgColor,
        config.textColor,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          config.dotColor,
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
        )}
      />
      {config.label}
    </span>
  );
}
