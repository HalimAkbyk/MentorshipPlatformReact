// File: src/app/mentor/bookings/[id]/page.tsx
// YENİ DOSYA OLUŞTUR

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Clock, User, CreditCard, 
  AlertCircle, CheckCircle, XCircle, Video, 
  UserX,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { apiClient } from '../../../../lib/api/client';
import { formatDate, formatTime, formatCurrency } from '../../../../lib/utils/format';
import { BookingStatus } from '../../../../lib/types/enums';
import type { BookingDetail } from '../../../../lib/types/models';
import { toast } from 'sonner';

export default function MentorBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<BookingDetail>(`/bookings/${bookingId}`);
      setBooking(response);
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Rezervasyon yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const isSessionLive = () => {
    if (!booking) return false;
    const now = new Date();
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    return now >= start && now <= end && booking.status === BookingStatus.Confirmed;
  };

  const canJoinSoon = () => {
    if (!booking) return false;
    const now = new Date();
    const start = new Date(booking.startAt);
    const minutesUntilStart = (start.getTime() - now.getTime()) / (1000 * 60);
    return minutesUntilStart <= 10 && minutesUntilStart > 0 && booking.status === BookingStatus.Confirmed;
  };

  const getStatusBadge = () => {
    if (!booking) return null;

    const config = {
      [BookingStatus.Confirmed]: {
        variant: 'default' as const,
        icon: CheckCircle,
        label: 'Onaylandı',
        color: 'text-green-600'
      },
      [BookingStatus.Completed]: {
        variant: 'outline' as const,
        icon: CheckCircle,
        label: 'Tamamlandı',
        color: 'text-gray-600'
      },
      [BookingStatus.Cancelled]: {
        variant: 'destructive' as const,
        icon: XCircle,
        label: 'İptal Edildi',
        color: 'text-red-600'
      },
      [BookingStatus.PendingPayment]: {
        variant: 'secondary' as const,
        icon: AlertCircle,
        label: 'Ödeme Bekliyor',
        color: 'text-yellow-600'
      }
      ,
      [BookingStatus.NoShow]: {
        variant: 'outline' as const,
        icon: UserX,
        label: 'Katılım Yok',
        color: 'text-amber-600'
      },
      [BookingStatus.Disputed]: {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        label: 'Ödeme İtiraz Edildi',
        color: 'text-red-600'
      }
    };

    const statusConfig = config[booking.status];
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="text-sm">
        <Icon className="w-4 h-4 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-20 bg-gray-200 rounded" />
              <div className="h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Rezervasyon bulunamadı</h3>
            <Button onClick={() => router.push('/mentor/bookings')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isLive = isSessionLive();
  const canJoin = canJoinSoon();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/mentor/bookings">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Seanslarıma Dön
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Seans Detayları</h1>
              <p className="text-gray-600">Rezervasyon #{booking.id.slice(0, 8)}</p>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Action Buttons */}
        {(isLive || canJoin) && (
          <Card className="mb-6 bg-primary-50 border-primary-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {isLive ? 'Seans Şu Anda Canlı!' : 'Seans Yakında Başlayacak'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isLive 
                      ? 'Hemen derse katılabilirsiniz' 
                      : 'Odayı aktifleştirerek hazırlık yapabilirsiniz'}
                  </p>
                </div>
                <Link href={`/mentor/classroom/${booking.id}`}>
                  <Button size="lg" variant={isLive ? "default" : "outline"}>
                    <Video className="w-5 h-5 mr-2" />
                    {isLive ? 'Derse Katıl' : 'Odayı Aç'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Öğrenci Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary-100 text-primary-600 text-xl">
                    {booking.studentName?.charAt(0).toUpperCase() || 'Ö'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{booking.studentName || 'Öğrenci'}</h3>
                  <p className="text-sm text-gray-500">Öğrenci</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Seans Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Tarih</label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">{formatDate(booking.startAt)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Saat</label>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">
                      {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Süre</label>
                <span className="font-medium">{booking.durationMin} dakika</span>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Hizmet</label>
                <span className="font-medium">{booking.offeringTitle}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Ödeme Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Toplam Ücret</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(booking.price, booking.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Info */}
          {booking.status === BookingStatus.Cancelled && booking.cancellationReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <XCircle className="w-5 h-5 mr-2" />
                  İptal Nedeni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{booking.cancellationReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}