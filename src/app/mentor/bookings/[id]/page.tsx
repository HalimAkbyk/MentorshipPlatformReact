// File: src/app/mentor/bookings/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, Clock, User, CreditCard,
  AlertCircle, CheckCircle, XCircle, Video,
  UserX, AlertTriangle, HelpCircle, RefreshCw, X, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { apiClient } from '../../../../lib/api/client';
import { MessagePanel } from '../../../../components/features/messaging/message-panel';
import { useUnreadCount } from '../../../../lib/hooks/use-messages';
import { formatDate, formatTime, formatCurrency } from '../../../../lib/utils/format';
import { BookingStatus } from '../../../../lib/types/enums';
import type { BookingDetail } from '../../../../lib/types/models';
import { availabilityApi, type ComputedTimeSlot } from '../../../../lib/api/availability';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSessionJoinSettings, getSessionJoinStatus } from '../../../../lib/hooks/use-platform-settings';

export default function MentorBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const { data: unreadData } = useUnreadCount();

  const { devMode, earlyJoinMinutes } = useSessionJoinSettings();

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<ComputedTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ComputedTimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

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
        toast.error('Müsait slotlar yüklenemedi');
        setRescheduleSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [rescheduleDate, booking]);

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

  // Can mentor reschedule?
  const canReschedule = (): boolean => {
    if (!booking) return false;
    if (booking.status !== BookingStatus.Confirmed) return false;
    if ((booking.rescheduleCountMentor ?? 0) >= 2) return false;
    if (booking.pendingRescheduleStartAt) return false; // Already has pending request
    const hoursUntilStart = (new Date(booking.startAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilStart >= 2;
  };

  const handleReschedule = async () => {
    if (!selectedSlot) {
      toast.error('Lütfen bir saat seçin');
      return;
    }
    try {
      setRescheduling(true);
      await apiClient.post(`/bookings/${bookingId}/reschedule`, { newStartAt: selectedSlot.startAt });
      toast.success('Saat değişikliği talebi öğrenciye iletildi');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setSelectedSlot(null);
      loadBooking();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0] || 'Saat değişikliği talebi gönderilemedi');
    } finally {
      setRescheduling(false);
    }
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
      },
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
  const joinStatus = booking.status === BookingStatus.Confirmed
    ? getSessionJoinStatus(booking.startAt, devMode, earlyJoinMinutes)
    : null;

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

        {/* Pending Reschedule Banner */}
        {booking.pendingRescheduleStartAt && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Saat Değişikliği Onay Bekliyor</h3>
                  <p className="text-sm text-blue-800">
                    Talep edilen yeni tarih: {format(new Date(booking.pendingRescheduleStartAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Öğrenci onaylayınca seans saati otomatik güncellenecektir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Start/Join Session */}
        {booking.status === BookingStatus.Confirmed && joinStatus && (
          <Card className={`mb-6 ${joinStatus.canJoin ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {isLive ? 'Seans Şu Anda Canlı!' : joinStatus.canJoin ? 'Dersi Başlatabilirsiniz' : 'Ders Başlangıcı Bekleniyor'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isLive
                      ? 'Hemen derse katılabilirsiniz'
                      : joinStatus.canJoin
                      ? 'Odayı aktifleştirerek dersi başlatabilirsiniz'
                      : `Ders en erken ${earlyJoinMinutes} dakika önce başlatılabilir. Başlangıca ${Math.ceil(joinStatus.minutesUntilStart)} dakika kaldı.`}
                  </p>
                </div>
                <Link href={joinStatus.canJoin ? `/mentor/classroom/${booking.id}` : '#'}>
                  <Button
                    size="lg"
                    variant={isLive ? "default" : "outline"}
                    disabled={!joinStatus.canJoin}
                  >
                    <Video className="w-5 h-5 mr-2" />
                    {isLive ? 'Derse Katıl' : joinStatus.canJoin ? 'Dersi Başlat' : `${Math.ceil(joinStatus.minutesUntilStart)} dk`}
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
                  <AvatarFallback className="bg-teal-100 text-teal-600 text-xl">
                    {booking.studentName?.charAt(0).toUpperCase() || 'O'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{booking.studentName || 'Öğrenci'}</h3>
                  <p className="text-sm text-gray-500">Öğrenci</p>
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

          {/* Session Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Seans Bilgileri
                </CardTitle>
                {canReschedule() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRescheduleModal(true)}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Saati Güncelle
                  </Button>
                )}
              </div>
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
              {/* Reschedule count info */}
              {booking.status === BookingStatus.Confirmed && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Kalan saat değişikliği hakkı: {2 - (booking.rescheduleCountMentor ?? 0)}/2
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question Responses */}
          {booking.questionResponses && booking.questionResponses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Öğrenci Cevapları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.questionResponses.map((qr) => (
                  <div key={qr.questionId} className="border-b last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">{qr.questionText}</span>
                      {qr.isRequired && (
                        <Badge variant="destructive" className="text-xs">Zorunlu</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">{qr.answerText}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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
                <span className="text-2xl font-bold text-teal-600">
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

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Seans Saatini Güncelle</CardTitle>
                  <CardDescription>
                    Yeni tarih ve saat seçin. Öğrenci onayladıktan sonra güncellenir. (Kalan hak: {2 - (booking.rescheduleCountMentor ?? 0)}/2)
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowRescheduleModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection - Horizontal scrollable date buttons */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tarih Seçin</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: 30 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i + 1);
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const isSelected = rescheduleDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setRescheduleDate(dateStr)}
                          className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg border text-xs transition-colors ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:bg-teal-50'
                          }`}
                        >
                          <span className="font-medium">{format(d, 'dd', { locale: tr })}</span>
                          <span className={isSelected ? 'text-teal-100' : 'text-gray-500'}>{format(d, 'MMM', { locale: tr })}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-gray-400'}`}>{format(d, 'EEE', { locale: tr })}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                {rescheduleDate && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {format(new Date(rescheduleDate + 'T00:00:00'), 'dd MMMM yyyy, EEEE', { locale: tr })} - Müsait Saatler
                    </label>
                    {loadingSlots ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">Uygun saatler hesaplanıyor...</p>
                      </div>
                    ) : rescheduleSlots.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">Bu tarihte müsait saat yok</p>
                        <p className="text-xs mt-1">Başka bir tarih seçin</p>
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
                                  ? 'border-teal-600 bg-teal-50 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50'
                              }`}
                            >
                              <div className={`text-sm font-semibold ${isSelected ? 'text-teal-700' : 'text-gray-900'}`}>
                                {startTime}
                              </div>
                              <div className={`text-[10px] ${isSelected ? 'text-teal-500' : 'text-gray-400'}`}>
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
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-teal-900">
                      Seçilen: {format(new Date(selectedSlot.startAt), 'dd MMMM yyyy, HH:mm', { locale: tr })} - {format(new Date(selectedSlot.endAt), 'HH:mm')}
                    </p>
                    <p className="text-xs text-teal-700 mt-1">
                      Öğrenci onayladıktan sonra seans saati güncellenecektir.
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
                    Vazgeç
                  </Button>
                  <Button
                    onClick={handleReschedule}
                    className="flex-1"
                    disabled={!selectedSlot || rescheduling}
                  >
                    {rescheduling ? 'Gönderiliyor...' : 'Talep Gönder'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
