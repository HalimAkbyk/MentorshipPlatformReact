// File: src/app/student/bookings/[id]/page.tsx
// MEVCUT dosyayı TAMAMEN değiştir

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, User, MapPin, AlertCircle, Video, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { ReviewModal } from '../../../../components/features/reviews/review-modal';
import { useBooking, useCancelBooking } from '../../../../lib/hooks/use-bookings';
import { formatDate, formatRelativeTime, formatCurrency } from '../../../../lib/utils/format';
import { BookingStatus } from '../../../../lib/types/enums';
import { ROUTES } from '../../../../lib/constants/routes';
import { apiClient } from '../../../../lib/api/client';
import { toast } from 'sonner';

interface RoomStatus {
  isActive: boolean;
  hostConnected: boolean;
  participantCount: number;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { data: booking, isLoading } = useBooking(bookingId);
  const cancelBooking = useCancelBooking();
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  // ✅ Room status check
  const checkRoomStatus = async () => {
    if (!booking || booking.status !== BookingStatus.Confirmed) return;
    
    try {
      setCheckingRoom(true);
      const response = await apiClient.get<RoomStatus>(`/video/room/${bookingId}/status`);
      setRoomStatus(response);
    } catch (error) {
      console.error('Room status check error:', error);
      setRoomStatus({ isActive: false, hostConnected: false, participantCount: 0 });
    } finally {
      setCheckingRoom(false);
    }
  };

  // ✅ Check room status periodically for confirmed bookings
  useEffect(() => {
    if (!booking || booking.status !== BookingStatus.Confirmed) return;
    
    const now = new Date();
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    const minutesUntilStart = (start.getTime() - now.getTime()) / (1000 * 60);
    
    // Only check if session is within 10 minutes or ongoing
    const shouldCheck = (minutesUntilStart <= 10 && minutesUntilStart > -60) || 
                        (now >= start && now <= end);
    
    //if (!shouldCheck) return;

    // Initial check
    checkRoomStatus();

    // Poll every 15 seconds
    const interval = setInterval(checkRoomStatus, 15000);
    return () => clearInterval(interval);
  }, [booking]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Lütfen iptal sebebini belirtin');
      return;
    }

    try {
      await cancelBooking.mutateAsync({
        id: bookingId,
        reason: cancelReason,
      });
      toast.success('Rezervasyon iptal edildi');
      setShowCancelDialog(false);
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'İptal edilemedi');
    }
  };

  const handleJoinClass = () => {
    if (!canJoinNow()) {
      toast.error('Mentor henüz odayı aktifleştirmedi. Lütfen bekleyin.');
      return;
    }
    router.push(ROUTES.CLASSROOM(bookingId));
  };

  // ✅ Check if user can join now
  const canJoinNow = (): boolean => {
    if (!booking || booking.status !== BookingStatus.Confirmed) return false;
    
    const now = new Date();
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    const minutesUntilStart = (start.getTime() - now.getTime()) / (1000 * 60);
    
    // Can join 10 minutes before or during session
    const isInTimeWindow = (minutesUntilStart <= 10 && minutesUntilStart > -60) || 
                           (now >= start && now <= end);
    
    // AND mentor must have activated the room
    return roomStatus?.isActive === true;//isInTimeWindow && roomStatus?.isActive === true;
  };

  // ✅ Check if session time is close/active
  const isSessionTimeActive = (): boolean => {
    if (!booking) return false;
    
    const now = new Date();
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    const minutesUntilStart = (start.getTime() - now.getTime()) / (1000 * 60);
    
    return true;//(minutesUntilStart <= 10 && minutesUntilStart > -60) || (now >= start && now <= end);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Rezervasyon Bulunamadı</h2>
          <Button onClick={() => router.push('/student/bookings')}>
            Rezervasyonlara Dön
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, 'default' | 'success' | 'destructive' | 'secondary'> = {
      [BookingStatus.PendingPayment]: 'secondary',
      [BookingStatus.Confirmed]: 'default',
      [BookingStatus.Completed]: 'success',
      [BookingStatus.Cancelled]: 'destructive',
      [BookingStatus.NoShow]: 'destructive',
      [BookingStatus.Disputed]: 'destructive',
    };

    const labels: Record<BookingStatus, string> = {
      [BookingStatus.PendingPayment]: 'Ödeme Bekleniyor',
      [BookingStatus.Confirmed]: 'Onaylandı',
      [BookingStatus.Completed]: 'Tamamlandı',
      [BookingStatus.Cancelled]: 'İptal Edildi',
      [BookingStatus.NoShow]: 'Katılım Yok',
      [BookingStatus.Disputed]: 'İtirazlı',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const canCancel = booking.status === BookingStatus.Confirmed;
  const canReview = booking.status === BookingStatus.Completed && !booking.hasReview;
  const showJoinButton = booking.status === BookingStatus.Confirmed && isSessionTimeActive();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Rezervasyon Detayları</h1>
            <p className="text-gray-600">Rezervasyon #{booking.id.slice(0, 8)}</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mentor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Mentör Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={booking.mentorAvatar ?? undefined} />
                    <AvatarFallback>
                      {booking.mentorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{booking.mentorName}</h3>
                    <p className="text-sm text-gray-600">{booking.offeringTitle}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Mesaj Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>Seans Detayları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Tarih</p>
                    <p className="font-medium">{formatDate(booking.startAt, 'PPP')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Saat</p>
                    <p className="font-medium">
                      {formatRelativeTime(booking.startAt)} - {formatRelativeTime(booking.endAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Süre</p>
                    <p className="font-medium">{booking.durationMin} dakika</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Platform</p>
                    <p className="font-medium">Online Video Konferans</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Info */}
            {booking.status === BookingStatus.Cancelled && booking.cancellationReason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-900">İptal Bilgisi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-800">{booking.cancellationReason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* ✅ Join Class Button with Mentor Check */}
                {
                  <div className="space-y-2">
                    <Button 
                      onClick={handleJoinClass} 
                      className="w-full" 
                      size="lg"
                      disabled={!canJoinNow() || checkingRoom}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {checkingRoom ? 'Kontrol ediliyor...' : 'Derse Katıl'}
                    </Button>
                    
                    {/* ✅ Mentor Status Indicator */}
                    {roomStatus && (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        {roomStatus.isActive ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">Mentor Hazır</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-600 font-medium">Mentor Bekleniyor</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* ✅ Waiting Message */}
                    {!canJoinNow() && roomStatus && !roomStatus.isActive && (
                      <p className="text-xs text-center text-gray-600">
                        Mentor odayı aktifleştirdiğinde katılabileceksiniz
                      </p>
                    )}
                  </div>
                }

                {canReview && (
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Dersi Değerlendir
                  </Button>
                )}

                {canCancel && (
                  <Button
                    onClick={() => setShowCancelDialog(true)}
                    variant="destructive"
                    className="w-full"
                  >
                    Rezervasyonu İptal Et
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ders Ücreti</span>
                    <span className="font-medium">{formatCurrency(booking.price)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Toplam</span>
                    <span className="font-bold text-primary-600">
                      {formatCurrency(booking.price)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Info */}
            <Card>
              <CardHeader>
                <CardTitle>Rezervasyon Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Rezervasyon ID:</strong> {booking.id.slice(0, 8)}
                </p>
                <p>
                  <strong>Oluşturulma:</strong> {formatDate(booking.createdAt, 'PPP p')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cancel Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Rezervasyonu İptal Et</CardTitle>
                <CardDescription>
                  İptal sebebinizi belirtiniz. İade kurallarına göre işlem yapılacaktır.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="İptal sebebi..."
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
                <div className="flex space-x-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1"
                  >
                    Vazgeç
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    className="flex-1"
                    disabled={cancelBooking.isPending}
                  >
                    {cancelBooking.isPending ? 'İptal Ediliyor...' : 'İptal Et'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <ReviewModal
            bookingId={booking.id}
            mentorName={booking.mentorName}
            onClose={() => setShowReviewModal(false)}
            onSubmit={() => {
              setShowReviewModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}