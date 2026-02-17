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
      toast.error(err?.response?.data?.errors?.[0] || 'Kayıt oluşturulamadı');
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
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
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Ödeme</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              dangerouslySetInnerHTML={{ __html: checkoutHtml }}
              id="iyzipay-checkout-form"
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFull = groupClass.enrolledCount >= groupClass.capacity;
  const isOwnClass = groupClass.mentorUserId === user?.id;
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
              {isFull && <Badge className="bg-red-100 text-red-700">Dolu</Badge>}
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
                <div className="text-3xl font-bold text-primary-700">
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

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={isFull || enrolling}
                    onClick={handleEnrollAndPay}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {enrolling
                      ? 'İşleniyor...'
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
