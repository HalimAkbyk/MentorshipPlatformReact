// File: src/app/mentor/bookings/page.tsx
// Backend'de student bilgisi yok, geçici çözüm

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Video, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { useBookings } from '../../../lib/hooks/use-bookings';
import { formatDate, formatTime } from '../../../lib/utils/format';
import { BookingStatus } from '../../../lib/types/enums';
import type { Booking } from '../../../lib/types/models';
import { cn } from '../../../lib/utils/cn';

const statusFilters = [
  { value: 'all', label: 'Tümü' },
  { value: BookingStatus.Confirmed, label: 'Yaklaşan' },
  { value: BookingStatus.Completed, label: 'Tamamlanan' },
  { value: BookingStatus.Cancelled, label: 'İptal Edilen' },
];

export default function MentorBookingsPage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | BookingStatus>('all');
  
  const { data: bookings, isLoading } = useBookings(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  const isSessionLive = (booking: Booking): boolean => {
    const now = new Date();
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    return now >= start && now <= end && booking.status === BookingStatus.Confirmed;
  };

  const canJoinSoon = (booking: Booking): boolean => {
    const now = new Date();
    const start = new Date(booking.startAt);
    const minutesUntilStart = (start.getTime() - now.getTime()) / (1000 * 60);
    return minutesUntilStart <= 10 && minutesUntilStart > 0 && booking.status === BookingStatus.Confirmed;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Seanslarım</h1>
            <p className="text-gray-600">Yaklaşan ve geçmiş seanslarınız</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value as 'all' | BookingStatus)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                selectedStatus === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => {
              const isLive = isSessionLive(booking);
              const canJoin = canJoinSoon(booking);
              
              return (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary-100 text-primary-600">
                            Ö
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">Öğrenci</h3>
                          <p className="text-xs text-gray-500">Detaylar için tıklayın</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isLive && (
                          <Badge variant="destructive" className="animate-pulse">
                            CANLI
                          </Badge>
                        )}
                        {canJoin && !isLive && (
                          <Badge className="bg-yellow-500">
                            Yakında
                          </Badge>
                        )}
                        <Badge
                          variant={
                            booking.status === BookingStatus.Confirmed
                              ? 'default'
                              : booking.status === BookingStatus.Completed
                              ? 'outline'
                              : 'destructive'
                          }
                        >
                          {booking.status === BookingStatus.Confirmed && 'Onaylandı'}
                          {booking.status === BookingStatus.Completed && 'Tamamlandı'}
                          {booking.status === BookingStatus.Cancelled && 'İptal Edildi'}
                          {booking.status === BookingStatus.PendingPayment && 'Ödeme Bekliyor'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(booking.startAt)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
                        <span className="ml-2 text-gray-400">({booking.durationMin} dk)</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 mt-auto">
                    <div className="flex gap-2">
                      {booking.status === BookingStatus.Confirmed && (isLive || canJoin) && (
                        <Link href={`/mentor/classroom/${booking.id}`} className="flex-1">
                          <Button className="w-full" variant={isLive ? "default" : "outline"}>
                            <Video className="w-4 h-4 mr-2" />
                            {isLive ? 'Derse Katıl' : 'Odayı Aç'}
                          </Button>
                        </Link>
                      )}
                      {booking.status === BookingStatus.Confirmed && !isLive && !canJoin && (
                        <Link href={`/mentor/bookings/${booking.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            Detaylar
                          </Button>
                        </Link>
                      )}
                      {(booking.status === BookingStatus.Completed || booking.status === BookingStatus.Cancelled) && (
                        <Link href={`/mentor/bookings/${booking.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            İncele
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Henüz seans yok</h3>
            <p className="text-gray-600 mb-4">
              Öğrencileriniz rezervasyon yaptıkça burada görünecek
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}