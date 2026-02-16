'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Filter } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { useBookings } from '../../../lib/hooks/use-bookings';
import { formatDate, formatRelativeTime, formatCurrency } from '../../../lib/utils/format';
import { BookingStatus } from '../../../lib/types/enums';
import { cn } from '../../../lib/utils/cn';
import { ROUTES } from '../../../lib/constants/routes';

const statusFilters = [
  { value: 'all', label: 'Tümü' },
  { value: BookingStatus.Confirmed, label: 'Yaklaşan' },
  { value: BookingStatus.Completed, label: 'Tamamlanan' },
  { value: BookingStatus.Cancelled, label: 'İptal Edilen' },
];

export default function BookingsPage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | BookingStatus>('all');
  
  const { data: bookings, isLoading } = useBookings(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">Rezervasyonlarım</h1>
            <p className="text-gray-600">Tüm rezervasyonlarınızı görüntüleyin</p>
          </div>
          <Link href="/public/mentors">
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Yeni Rezervasyon
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value as any)}
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
            {bookings.map((booking) => (
              <Link key={booking.id} href={ROUTES.BOOKING_DETAIL(booking.id)}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={booking.mentorAvatar??undefined} />
                          <AvatarFallback>
                            {booking.mentorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{booking.mentorName}</h3>
                          <p className="text-xs text-gray-500">Mentör</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          booking.status === BookingStatus.Completed
                            ? 'success'
                            : booking.status === BookingStatus.Cancelled
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {booking.status === BookingStatus.Confirmed && 'Onaylandı'}
                        {booking.status === BookingStatus.Completed && 'Tamamlandı'}
                        {booking.status === BookingStatus.Cancelled && 'İptal'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(booking.startAt, 'PPP')}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatRelativeTime(booking.startAt)} ({booking.durationMin} dk)
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(booking.price)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold font-heading mb-2">Henüz rezervasyon yok</h3>
            <p className="text-gray-600 mb-6">
              İlk rezervasyonunuzu yaparak mentörlerinizle tanışın
            </p>
            <Link href="/public/mentors">
              <Button>Mentörleri Keşfet</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}