'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { useBookings } from '../../../lib/hooks/use-bookings';
import { formatDate, formatRelativeTime, formatCurrency } from '../../../lib/utils/format';
import { BookingStatus } from '../../../lib/types/enums';
import { cn } from '../../../lib/utils/cn';
import { ROUTES } from '../../../lib/constants/routes';
import { Pagination } from '../../../components/ui/pagination';

const statusFilters = [
  { value: BookingStatus.Confirmed, label: 'Yaklaşan' },
  { value: BookingStatus.Completed, label: 'Tamamlanan' },
  { value: BookingStatus.Cancelled, label: 'İptal Edilen' },
  { value: 'all', label: 'Tümü' },
];

export default function BookingsPage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | BookingStatus>(BookingStatus.Confirmed);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useBookings(
    selectedStatus === 'all' ? undefined : selectedStatus,
    page,
    15,
    'student'
  );
  const bookings = data?.items;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Rezervasyonlarım</h1>
            <p className="text-xs text-gray-500">Tüm rezervasyonlarınızı görüntüleyin</p>
          </div>
        </div>
        <Link href="/public/mentors">
          <Button size="sm" className="text-xs">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Yeni Rezervasyon
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => { setSelectedStatus(filter.value as any); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              selectedStatus === filter.value
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookings && bookings.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.map((booking) => (
              <Link key={booking.id} href={ROUTES.BOOKING_DETAIL(booking.id)}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-10 h-10 rounded-xl">
                          <AvatarImage src={booking.mentorAvatar??undefined} />
                          <AvatarFallback className="rounded-xl bg-gradient-to-br from-teal-400 to-green-500 text-white text-sm">
                            {booking.mentorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">{booking.mentorName}</h3>
                          <p className="text-[10px] text-gray-400">Mentör</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          booking.status === BookingStatus.Completed
                            ? 'success'
                            : booking.status === BookingStatus.Cancelled ||
                              booking.status === BookingStatus.Expired ||
                              booking.status === BookingStatus.NoShow
                            ? 'destructive'
                            : booking.status === BookingStatus.Disputed
                            ? 'outline'
                            : 'default'
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {booking.status === BookingStatus.PendingPayment && 'Ödeme Bekliyor'}
                        {booking.status === BookingStatus.Confirmed && 'Onaylandı'}
                        {booking.status === BookingStatus.Completed && 'Tamamlandı'}
                        {booking.status === BookingStatus.Cancelled && 'İptal'}
                        {booking.status === BookingStatus.NoShow && 'Katılmadı'}
                        {booking.status === BookingStatus.Disputed && 'İtiraz'}
                        {booking.status === BookingStatus.Expired && 'Süresi Doldu'}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(booking.startAt, 'PPP')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(booking.startAt)} ({booking.durationMin} dk)
                      </div>
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-gray-100">
                      <span className="text-sm font-bold text-teal-600">
                        {formatCurrency(booking.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            totalCount={data?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel="rezervasyon"
          />
        </>
      ) : (
        <Card className="border border-dashed border-teal-200 bg-teal-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Henüz rezervasyon yok</h3>
            <p className="text-xs text-gray-500 mb-4">
              İlk rezervasyonunuzu yaparak mentörlerinizle tanışın
            </p>
            <Link href="/public/mentors">
              <Button size="sm" className="text-xs">Mentörleri Keşfet</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
