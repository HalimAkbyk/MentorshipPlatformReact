'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroupClass, useEnrollInClass } from '@/lib/hooks/use-classes';
import { paymentsApi } from '@/lib/api/payments';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';
import {
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { IyzicoCheckoutForm } from '@/components/payment/IyzicoCheckoutForm';

export default function GroupClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const user = useAuthStore((s) => s.user);

  const { data: groupClass, isLoading } = useGroupClass(classId);
  const enrollMutation = useEnrollInClass();

  const [enrolling, setEnrolling] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const getDurationMinutes = (start: string, end: string) => {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  };

  const handleEnrollAndPay = async () => {
    if (!groupClass) return;

    setEnrolling(true);
    try {
      // Step 1: Enroll
      const { enrollmentId } = await enrollMutation.mutateAsync(classId);

      // Step 2: Create order
      const orderResult = await paymentsApi.createOrder({
        type: 'GroupClass',
        resourceId: enrollmentId,
        buyerName: user?.displayName?.split(' ')[0] || 'User',
        buyerSurname: user?.displayName?.split(' ').slice(1).join(' ') || 'User',
        buyerPhone: user?.phone || '5555555555',
      });

      // Step 3: Show Iyzico checkout
      if (orderResult.checkoutFormContent) {
        setCheckoutHtml(orderResult.checkoutFormContent);
      } else if (orderResult.paymentPageUrl) {
        window.location.href = orderResult.paymentPageUrl;
      } else {
        toast.error('Ödeme formu yüklenemedi');
      }
    } catch (err: any) {
      const errData = err?.response?.data;
      let message = 'Kayıt oluşturulamadı';
      if (errData?.errors) {
        if (Array.isArray(errData.errors) && errData.errors.length > 0) {
          message = errData.errors[0];
        } else if (typeof errData.errors === 'object') {
          const firstField = Object.values(errData.errors)[0];
          if (Array.isArray(firstField) && firstField.length > 0) {
            message = firstField[0] as string;
          }
        }
      } else if (errData?.message) {
        message = errData.message;
      }
      toast.error(message);
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!groupClass) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Grup dersi bulunamadı</p>
        <Link href="/student/explore-classes">
          <Button className="mt-4">Geri Dön</Button>
        </Link>
      </div>
    );
  }

  // Iyzico checkout overlay
  if (checkoutHtml) {
    return (
      <IyzicoCheckoutForm
        checkoutFormContent={checkoutHtml}
        onClose={() => setCheckoutHtml(null)}
      />
    );
  }

  const isFull = groupClass.enrolledCount >= groupClass.capacity;
  const isOwnClass = groupClass.mentorUserId === user?.id;
  const isExpired = groupClass.status === 'Expired' || new Date(groupClass.endAt) < new Date();
  const isStarted = new Date(groupClass.startAt) < new Date();
  const enrollmentStatus = groupClass.currentUserEnrollmentStatus;
  const isEnrolled = enrollmentStatus === 'Confirmed' || enrollmentStatus === 'Attended';
  const isPendingPayment = enrollmentStatus === 'PendingPayment';
  const platformFee = groupClass.pricePerSeat * 0.07;
  const totalPrice = groupClass.pricePerSeat + platformFee;
  const duration = getDurationMinutes(groupClass.startAt, groupClass.endAt);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/student/explore-classes" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Grup Derslerine Dön
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {groupClass.coverImageUrl && (
            <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={groupClass.coverImageUrl}
                alt={groupClass.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{groupClass.category}</Badge>
              {isExpired && <Badge className="bg-orange-100 text-orange-700">Süresi Doldu</Badge>}
              {!isExpired && isStarted && <Badge className="bg-amber-100 text-amber-700">Ders Başladı</Badge>}
              {isFull && !isExpired && <Badge className="bg-red-100 text-red-700">Dolu</Badge>}
            </div>
            <h1 className="text-3xl font-bold font-heading">{groupClass.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={groupClass.mentorAvatar ?? undefined} />
              <AvatarFallback>
                {groupClass.mentorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{groupClass.mentorName}</div>
              <div className="text-sm text-gray-500">Mentor</div>
            </div>
          </div>

          {groupClass.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ders Hakkında</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {groupClass.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side Panel - Booking Card */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-700">
                  {formatCurrency(groupClass.pricePerSeat, groupClass.currency)}
                </div>
                <div className="text-xs text-gray-500">kişi başı</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDateTime(groupClass.startAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {formatTime(groupClass.startAt)} - {formatTime(groupClass.endAt)}{' '}
                    ({duration} dk)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>
                    {groupClass.enrolledCount}/{groupClass.capacity} katılımcı
                  </span>
                </div>
              </div>

              {isOwnClass ? (
                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 rounded-lg p-3">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Bu sizin oluşturduğunuz derstir.</span>
                  </div>
                  <Link href="/mentor/group-classes" className="block">
                    <Button className="w-full" variant="outline">
                      Derslerimi Yönet
                    </Button>
                  </Link>
                </div>
              ) : isEnrolled ? (
                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Bu derse kayıtlısınız</span>
                  </div>
                  {!isExpired && isStarted ? (
                    <Link href={`/student/group-classroom/${groupClass.id}`} className="block">
                      <Button className="w-full" size="lg">
                        Derse Katıl
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/student/my-classes" className="block">
                      <Button className="w-full" variant="outline">
                        Derslerime Git
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="border-t pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ders ücreti</span>
                      <span>{formatCurrency(groupClass.pricePerSeat, groupClass.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform hizmet bedeli</span>
                      <span>{formatCurrency(platformFee, groupClass.currency)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t">
                      <span>Toplam</span>
                      <span>{formatCurrency(totalPrice, groupClass.currency)}</span>
                    </div>
                  </div>

                  {isExpired ? (
                    <div className="text-center p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
                      Bu dersin süresi dolmuştur. Kayıt yapılamaz.
                    </div>
                  ) : isStarted ? (
                    <div className="text-center p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                      Bu ders başlamıştır. Yeni kayıt kabul edilmemektedir.
                    </div>
                  ) : (
                    <>
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={isFull || enrolling}
                        onClick={handleEnrollAndPay}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {enrolling
                          ? 'İşleniyor...'
                          : isPendingPayment
                          ? 'Ödemeyi Tamamla'
                          : isFull
                          ? 'Kontenjan Dolu'
                          : 'Kayıt Ol ve Öde'}
                      </Button>

                      <div className="text-xs text-gray-500 text-center space-y-1">
                        <p>
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          24 saatten önce iptal: %100 iade
                        </p>
                        <p>2-24 saat arası: %50 iade</p>
                        <p>2 saatten az: İade yok</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
