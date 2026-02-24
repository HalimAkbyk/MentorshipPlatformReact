'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Video, CheckCircle, Info } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { useBookings } from '../../../lib/hooks/use-bookings';
import { useSessionJoinSettings, getSessionJoinStatus } from '../../../lib/hooks/use-platform-settings';
import { formatDate, formatTime } from '../../../lib/utils/format';
import { BookingStatus } from '../../../lib/types/enums';
import type { Booking } from '../../../lib/types/models';
import { cn } from '../../../lib/utils/cn';
import { Pagination } from '../../../components/ui/pagination';

const statusFilters = [
  { value: 'all', label: 'Tümü' },
  { value: BookingStatus.Confirmed, label: 'Yaklaşan' },
  { value: BookingStatus.Completed, label: 'Tamamlanan' },
  { value: BookingStatus.Cancelled, label: 'İptal Edilen' },
];

export default function MentorBookingsPage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | BookingStatus>('all');
  const [page, setPage] = useState(1);
  const { devMode, earlyJoinMinutes } = useSessionJoinSettings();

  const { data, isLoading } = useBookings(
    selectedStatus === 'all' ? undefined : selectedStatus,
    page,
    15,
    'mentor'
  );
  const bookings = data?.items;

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
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Seanslarım</h1>
              <p className="text-xs text-gray-500">Yaklaşan ve geçmiş seanslarınız</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => { setSelectedStatus(filter.value as 'all' | BookingStatus); setPage(1); }}
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
            {bookings.map((booking) => {
              const isLive = isSessionLive(booking);
              const canJoin = canJoinSoon(booking);
              const joinStatus = booking.status === BookingStatus.Confirmed
                ? getSessionJoinStatus(booking.startAt, devMode, earlyJoinMinutes)
                : null;

              return (
                <Card key={booking.id} className={cn(
                  "border-0 shadow-sm hover:shadow-md transition-all h-full flex flex-col",
                  isLive && "ring-1 ring-green-300 bg-green-50/30"
                )}>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10 rounded-xl flex-shrink-0">
                        <AvatarImage src={booking.studentAvatar ?? undefined} />
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-teal-400 to-green-500 text-white text-sm">
                          {booking.studentName?.charAt(0)?.toUpperCase() ?? 'Ö'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{booking.studentName || 'Öğrenci'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {isLive && (
                            <Badge variant="destructive" className="animate-pulse text-[10px] px-1.5 py-0">
                              CANLI
                            </Badge>
                          )}
                          {canJoin && !isLive && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0">
                              Yakında
                            </Badge>
                          )}
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
                            {booking.status === BookingStatus.Cancelled && 'İptal Edildi'}
                            {booking.status === BookingStatus.NoShow && 'Katılmadı'}
                            {booking.status === BookingStatus.Disputed && 'İtiraz'}
                            {booking.status === BookingStatus.Expired && 'Süresi Doldu'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(booking.startAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
                      </span>
                      <span className="text-gray-400">{booking.durationMin}dk</span>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto">
                      {booking.status === BookingStatus.Confirmed && joinStatus?.canJoin && (
                        <Link href={`/mentor/classroom/${booking.id}`}>
                          <Button size="sm" className={cn(
                            "w-full text-xs",
                            isLive
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                              : "bg-teal-600 hover:bg-teal-700 text-white"
                          )}>
                            <Video className="w-3.5 h-3.5 mr-1" />
                            {isLive ? 'Derse Katıl' : 'Dersi Başlat'}
                          </Button>
                        </Link>
                      )}
                      {booking.status === BookingStatus.Confirmed && joinStatus && !joinStatus.canJoin && (
                        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                          <Info className="w-3 h-3" />
                          En erken {earlyJoinMinutes} dk önce başlatılabilir
                        </p>
                      )}
                      <Link href={`/mentor/bookings/${booking.id}`}>
                        <Button variant="outline" size="sm" className="w-full text-xs border-gray-200">
                          {booking.status === BookingStatus.Completed || booking.status === BookingStatus.Cancelled
                            ? (<><CheckCircle className="w-3.5 h-3.5 mr-1" />İncele</>)
                            : 'Detaylar'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            totalCount={data?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel="seans"
          />
          </>
        ) : (
          <Card className="border border-dashed border-teal-200 bg-teal-50/30">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Henüz seans yok</h3>
              <p className="text-xs text-gray-500">
                Öğrencileriniz rezervasyon yaptıkça burada görünecek
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}