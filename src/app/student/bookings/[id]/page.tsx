// File: src/app/student/bookings/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, User, MapPin, AlertCircle, Video, MessageSquare, CheckCircle, HelpCircle, RefreshCw, X, Mail, Info, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { ReviewModal } from '../../../../components/features/reviews/review-modal';
import { MessagePanel } from '../../../../components/features/messaging/message-panel';
import { useBooking, useCancelBooking, useRescheduleBooking, useApproveReschedule, useRejectReschedule } from '../../../../lib/hooks/use-bookings';
import { useUnreadCount } from '../../../../lib/hooks/use-messages';
import { formatDate, formatTime, formatCurrency } from '../../../../lib/utils/format';
import { BookingStatus } from '../../../../lib/types/enums';
import { ROUTES } from '../../../../lib/constants/routes';
import { apiClient } from '../../../../lib/api/client';
import { type ComputedTimeSlot } from '../../../../lib/api/availability';
import { RescheduleCalendar } from '../../../../components/features/bookings/reschedule-calendar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSessionJoinSettings, getSessionJoinStatus } from '../../../../lib/hooks/use-platform-settings';

interface RoomStatus {
  isActive: boolean;
  hostConnected: boolean;
  participantCount: number;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { data: booking, isLoading, refetch } = useBooking(bookingId);
  const cancelBooking = useCancelBooking();
  const rescheduleBooking = useRescheduleBooking();
  const approveReschedule = useApproveReschedule();
  const rejectReschedule = useRejectReschedule();
  const { data: unreadData } = useUnreadCount();

  const queryClient = useQueryClient();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { devMode, earlyJoinMinutes } = useSessionJoinSettings();

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Room status via SignalR (real-time) + initial fetch on mount
  // SignalR updates are pushed to queryClient cache key ['room-status', bookingId]
  const roomStatus = queryClient.getQueryData<RoomStatus>(['room-status', bookingId]) ?? null;

  // Subscribe to cache changes for re-renders
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === 'room-status' && event?.query?.queryKey?.[1] === bookingId) {
        forceUpdate((c) => c + 1);
      }
    });
    return () => unsubscribe();
  }, [queryClient, bookingId]);

  // Initial room status fetch on mount (one-time, no polling)
  useEffect(() => {
    if (!booking || booking.status !== BookingStatus.Confirmed) return;

    const fetchInitialStatus = async () => {
      try {
        const response = await apiClient.get<RoomStatus>(`/video/room/${bookingId}/status`);
        queryClient.setQueryData(['room-status', bookingId], response);
      } catch {
        queryClient.setQueryData(['room-status', bookingId], {
          isActive: false,
          hostConnected: false,
          participantCount: 0,
        });
      }
    };

    fetchInitialStatus();
  }, [booking, bookingId, queryClient]);

  // Reschedule handler moved to RescheduleCalendar component

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Lütfen iptal sebebini belirtin');
      return;
    }
    try {
      await cancelBooking.mutateAsync({ id: bookingId, reason: cancelReason });
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

  const handleReschedule = async (slot: ComputedTimeSlot) => {
    try {
      await rescheduleBooking.mutateAsync({ id: bookingId, newStartAt: slot.startAt });
      toast.success('Seans saati güncellendi');
      setShowRescheduleModal(false);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Seans saati güncellenemedi');
    }
  };

  const handleApproveReschedule = async () => {
    try {
      await approveReschedule.mutateAsync(bookingId);
      toast.success('Saat değişikliği onaylandı');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Onay başarısız');
    }
  };

  const handleRejectReschedule = async () => {
    try {
      await rejectReschedule.mutateAsync(bookingId);
      toast.success('Saat değişikliği reddedildi');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Red başarısız');
    }
  };

  const canJoinNow = (): boolean => {
    if (!booking || booking.status !== BookingStatus.Confirmed) return false;
    return roomStatus?.isActive === true;
  };

  const isSessionTimeActive = (): boolean => {
    if (!booking) return false;
    return true;
  };

  // Can student reschedule?
  const canReschedule = (): boolean => {
    if (!booking) return false;
    if (booking.status !== BookingStatus.Confirmed) return false;
    if ((booking.rescheduleCountStudent ?? 0) >= 2) return false;
    const hoursUntilStart = (new Date(booking.startAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilStart >= 2;
  };

  // Has pending reschedule from mentor?
  const hasPendingReschedule = (): boolean => {
    return !!booking?.pendingRescheduleStartAt;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
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

        {/* Pending Reschedule Banner */}
        {hasPendingReschedule() && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-orange-900">
                    <RefreshCw className="w-5 h-5 inline mr-2" />
                    Saat Değişikliği Talebi
                  </h3>
                  <p className="text-sm text-orange-800 mb-2">
                    Mentor seans saatini değiştirmek istiyor:
                  </p>
                  <p className="font-medium text-orange-900">
                    Yeni tarih: {booking.pendingRescheduleStartAt
                      ? format(new Date(booking.pendingRescheduleStartAt), 'dd MMMM yyyy, HH:mm', { locale: tr })
                      : '-'}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={handleApproveReschedule}
                    disabled={approveReschedule.isPending}
                  >
                    {approveReschedule.isPending ? 'Onaylanıyor...' : 'Onayla'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRejectReschedule}
                    disabled={rejectReschedule.isPending}
                  >
                    {rejectReschedule.isPending ? 'Reddediliyor...' : 'Reddet'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mentor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Mentor Bilgileri</CardTitle>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMessages(!showMessages)}
                    className="relative"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {showMessages ? 'Mesajları Gizle' : 'Mesaj Gönder'}
                    {(() => {
                      const unread = unreadData?.perBooking?.find((b) => b.bookingId === bookingId)?.count ?? 0;
                      return unread > 0 ? (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      ) : null;
                    })()}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Message Panel */}
            {showMessages && <MessagePanel bookingId={bookingId} />}

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
                      {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
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

                {/* Reschedule count info */}
                {booking.status === BookingStatus.Confirmed && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Kalan saat değişikliği hakkı: {2 - (booking.rescheduleCountStudent ?? 0)}/2
                  </div>
                )}
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

            {/* NoShow — refund info */}
            {booking.status === BookingStatus.NoShow && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        Mentor derse katılmadı
                      </p>
                      <p className="text-sm text-amber-800 mb-3">
                        Mentor bu derse katılım sağlamadığı için tam iade hakkınız bulunmaktadır.
                        Ödeme geçmişi sayfasından iade talebinizi oluşturabilirsiniz.
                      </p>
                      <Link href="/student/payments">
                        <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Ödeme Geçmişi &amp; İade Talebi
                        </Button>
                      </Link>
                    </div>
                  </div>
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
                {/* Join Class Button */}
                {
                  <div className="space-y-2">
                    <Button
                      onClick={handleJoinClass}
                      className="w-full"
                      size="lg"
                      disabled={!canJoinNow()}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Derse Katıl
                    </Button>

                    {/* Mentor Status Indicator */}
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

                    {!canJoinNow() && roomStatus && !roomStatus.isActive && (
                      <p className="text-xs text-center text-gray-600">
                        Mentor odayı aktifleştirdiğinde katılabileceksiniz.
                        {!devMode && booking.status === BookingStatus.Confirmed && (() => {
                          const jStatus = getSessionJoinStatus(booking.startAt, devMode, earlyJoinMinutes);
                          return !jStatus.canJoin
                            ? ` Ders başlangıcına ${Math.ceil(jStatus.minutesUntilStart)} dk kaldı.`
                            : '';
                        })()}
                      </p>
                    )}
                  </div>
                }

                {/* Reschedule Button */}
                {canReschedule() && (
                  <Button
                    onClick={() => setShowRescheduleModal(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Saati Güncelle
                  </Button>
                )}

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

            {/* Question Responses */}
            {booking.questionResponses && booking.questionResponses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HelpCircle className="w-4 h-4" />
                    Cevaplarınız
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {booking.questionResponses.map((qr) => (
                    <div key={qr.questionId}>
                      <p className="text-sm font-medium text-gray-700 mb-1">{qr.questionText}</p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">{qr.answerText}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

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
                    <span className="font-bold text-teal-600">
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <RescheduleCalendar
            mentorUserId={booking.mentorUserId}
            offeringId={booking.offeringId}
            remainingCount={2 - (booking.rescheduleCountStudent ?? 0)}
            isMentor={false}
            isPending={rescheduleBooking.isPending}
            onConfirm={handleReschedule}
            onCancel={() => setShowRescheduleModal(false)}
          />
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
