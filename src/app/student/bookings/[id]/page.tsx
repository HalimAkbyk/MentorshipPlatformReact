// File: src/app/student/bookings/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, User, MapPin, AlertCircle, Video, MessageSquare, CheckCircle, HelpCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { ReviewModal } from '../../../../components/features/reviews/review-modal';
import { useBooking, useCancelBooking, useRescheduleBooking, useApproveReschedule, useRejectReschedule } from '../../../../lib/hooks/use-bookings';
import { formatDate, formatTime, formatCurrency } from '../../../../lib/utils/format';
import { BookingStatus } from '../../../../lib/types/enums';
import { ROUTES } from '../../../../lib/constants/routes';
import { apiClient } from '../../../../lib/api/client';
import { availabilityApi, type ComputedTimeSlot } from '../../../../lib/api/availability';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<ComputedTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ComputedTimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Room status check
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

  // Check room status periodically for confirmed bookings
  useEffect(() => {
    if (!booking || booking.status !== BookingStatus.Confirmed) return;
    checkRoomStatus();
    const interval = setInterval(checkRoomStatus, 15000);
    return () => clearInterval(interval);
  }, [booking]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!rescheduleDate || !booking) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const slots = await availabilityApi.getAvailableTimeSlots(
          booking.mentorUserId,
          booking.offeringId,
          rescheduleDate
        );
        setRescheduleSlots(slots);
      } catch (e) {
        toast.error('Musait slotlar yuklenemedi');
        setRescheduleSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [rescheduleDate, booking]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Lutfen iptal sebebini belirtin');
      return;
    }
    try {
      await cancelBooking.mutateAsync({ id: bookingId, reason: cancelReason });
      toast.success('Rezervasyon iptal edildi');
      setShowCancelDialog(false);
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Iptal edilemedi');
    }
  };

  const handleJoinClass = () => {
    if (!canJoinNow()) {
      toast.error('Mentor henuz odayi aktiflesltirmedi. Lutfen bekleyin.');
      return;
    }
    router.push(ROUTES.CLASSROOM(bookingId));
  };

  const handleReschedule = async () => {
    if (!selectedSlot) {
      toast.error('Lutfen bir saat secin');
      return;
    }
    try {
      await rescheduleBooking.mutateAsync({ id: bookingId, newStartAt: selectedSlot.startAt });
      toast.success('Seans saati guncellendi');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setSelectedSlot(null);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Seans saati guncellenemedi');
    }
  };

  const handleApproveReschedule = async () => {
    try {
      await approveReschedule.mutateAsync(bookingId);
      toast.success('Saat degisikligi onaylandi');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Onay basarisiz');
    }
  };

  const handleRejectReschedule = async () => {
    try {
      await rejectReschedule.mutateAsync(bookingId);
      toast.success('Saat degisikligi reddedildi');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Red basarisiz');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Rezervasyon Bulunamadi</h2>
          <Button onClick={() => router.push('/student/bookings')}>
            Rezervasyonlara Don
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
      [BookingStatus.PendingPayment]: 'Odeme Bekleniyor',
      [BookingStatus.Confirmed]: 'Onaylandi',
      [BookingStatus.Completed]: 'Tamamlandi',
      [BookingStatus.Cancelled]: 'Iptal Edildi',
      [BookingStatus.NoShow]: 'Katilim Yok',
      [BookingStatus.Disputed]: 'Itirazli',
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
            <h1 className="text-3xl font-bold mb-2">Rezervasyon Detaylari</h1>
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
                    Saat Degisikligi Talebi
                  </h3>
                  <p className="text-sm text-orange-800 mb-2">
                    Mentor seans saatini degistirmek istiyor:
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
                    {approveReschedule.isPending ? 'Onaylaniyor...' : 'Onayla'}
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
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Mesaj Gonder
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>Seans Detaylari</CardTitle>
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
                    <p className="text-sm text-gray-600">Sure</p>
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
                    Kalan saat degisikligi hakki: {2 - (booking.rescheduleCountStudent ?? 0)}/2
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cancellation Info */}
            {booking.status === BookingStatus.Cancelled && booking.cancellationReason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-900">Iptal Bilgisi</CardTitle>
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
                <CardTitle>Islemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Join Class Button */}
                {
                  <div className="space-y-2">
                    <Button
                      onClick={handleJoinClass}
                      className="w-full"
                      size="lg"
                      disabled={!canJoinNow() || checkingRoom}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {checkingRoom ? 'Kontrol ediliyor...' : 'Derse Katil'}
                    </Button>

                    {/* Mentor Status Indicator */}
                    {roomStatus && (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        {roomStatus.isActive ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">Mentor Hazir</span>
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
                        Mentor odayi aktiflestirdiginde katilabileceksiniz
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
                    Saati Guncelle
                  </Button>
                )}

                {canReview && (
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Dersi Degerlendir
                  </Button>
                )}

                {canCancel && (
                  <Button
                    onClick={() => setShowCancelDialog(true)}
                    variant="destructive"
                    className="w-full"
                  >
                    Rezervasyonu Iptal Et
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
                    Cevaplariniz
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
                <CardTitle>Odeme Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ders Ucreti</span>
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
                  <strong>Olusturulma:</strong> {formatDate(booking.createdAt, 'PPP p')}
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
                <CardTitle>Rezervasyonu Iptal Et</CardTitle>
                <CardDescription>
                  Iptal sebebinizi belirtiniz. Iade kurallarina gore islem yapilacaktir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Iptal sebebi..."
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
                <div className="flex space-x-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1"
                  >
                    Vazgec
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    className="flex-1"
                    disabled={cancelBooking.isPending}
                  >
                    {cancelBooking.isPending ? 'Iptal Ediliyor...' : 'Iptal Et'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Seans Saatini Guncelle</CardTitle>
                  <CardDescription>
                    Yeni bir tarih ve saat secin. (Kalan hak: {2 - (booking.rescheduleCountStudent ?? 0)}/2)
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowRescheduleModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection - Horizontal scrollable date buttons */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tarih Secin</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: 30 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i + 1); // start from tomorrow
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const isSelected = rescheduleDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setRescheduleDate(dateStr)}
                          className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg border text-xs transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:bg-primary-50'
                          }`}
                        >
                          <span className="font-medium">{format(d, 'dd', { locale: tr })}</span>
                          <span className={isSelected ? 'text-primary-100' : 'text-gray-500'}>{format(d, 'MMM', { locale: tr })}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>{format(d, 'EEE', { locale: tr })}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                {rescheduleDate && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {format(new Date(rescheduleDate + 'T00:00:00'), 'dd MMMM yyyy, EEEE', { locale: tr })} - Musait Saatler
                    </label>
                    {loadingSlots ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">Uygun saatler hesaplaniyor...</p>
                      </div>
                    ) : rescheduleSlots.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">Bu tarihte musait saat yok</p>
                        <p className="text-xs mt-1">Baska bir tarih secin</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {rescheduleSlots.map((slot) => {
                          const startTime = format(new Date(slot.startAt), 'HH:mm');
                          const endTime = format(new Date(slot.endAt), 'HH:mm');
                          const isSelected = selectedSlot?.startAt === slot.startAt;
                          return (
                            <button
                              key={slot.startAt}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-2 rounded-lg border-2 transition-all text-center ${
                                isSelected
                                  ? 'border-primary-600 bg-primary-50 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50'
                              }`}
                            >
                              <div className={`text-sm font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                                {startTime}
                              </div>
                              <div className={`text-[10px] ${isSelected ? 'text-primary-500' : 'text-gray-400'}`}>
                                {endTime}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected slot summary */}
                {selectedSlot && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-primary-900">
                      Secilen: {format(new Date(selectedSlot.startAt), 'dd MMMM yyyy, HH:mm', { locale: tr })} - {format(new Date(selectedSlot.endAt), 'HH:mm')}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setRescheduleDate('');
                      setSelectedSlot(null);
                    }}
                    className="flex-1"
                  >
                    Vazgec
                  </Button>
                  <Button
                    onClick={handleReschedule}
                    className="flex-1"
                    disabled={!selectedSlot || rescheduleBooking.isPending}
                  >
                    {rescheduleBooking.isPending ? 'Guncelleniyor...' : 'Saati Guncelle'}
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
