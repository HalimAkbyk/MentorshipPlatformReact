'use client';

import Link from 'next/link';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ConversationDto } from '@/lib/types/models';

interface BookingInfoHeaderProps {
  conversation: ConversationDto;
  bookingDetailHref: string;
}

const statusLabels: Record<string, string> = {
  Confirmed: 'Onaylandı',
  Completed: 'Tamamlandı',
  Cancelled: 'İptal Edildi',
  PendingPayment: 'Ödeme Bekleniyor',
  NoShow: 'Katılım Yok',
  Disputed: 'İtirazlı',
};

const statusVariants: Record<string, 'default' | 'success' | 'destructive' | 'secondary'> = {
  Confirmed: 'default',
  Completed: 'success',
  Cancelled: 'destructive',
  PendingPayment: 'secondary',
  NoShow: 'destructive',
  Disputed: 'destructive',
};

function formatDateTime(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeOnly(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function BookingInfoHeader({ conversation, bookingDetailHref }: BookingInfoHeaderProps) {
  return (
    <div className="px-4 py-3 border-b bg-gray-50/80">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={conversation.otherUserAvatar ?? undefined} />
          <AvatarFallback className="bg-teal-100 text-teal-600 text-sm">
            {conversation.otherUserName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{conversation.otherUserName}</h3>
          <p className="text-xs text-gray-500 truncate">{conversation.offeringTitle}</p>
        </div>
        <Badge variant={statusVariants[conversation.bookingStatus] ?? 'secondary'} className="shrink-0 text-[10px]">
          {statusLabels[conversation.bookingStatus] ?? conversation.bookingStatus}
        </Badge>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDateTime(conversation.bookingStartAt)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTimeOnly(conversation.bookingEndAt)}
        </span>
        <Link href={bookingDetailHref} className="ml-auto">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-teal-600 hover:text-teal-700">
            <ExternalLink className="w-3 h-3 mr-1" />
            Detay Gör
          </Button>
        </Link>
      </div>
    </div>
  );
}
