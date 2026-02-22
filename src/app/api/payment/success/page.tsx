'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, BookOpen, Users, ArrowRight, Shield, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const courseId = searchParams.get('courseId');

  let redirectUrl: string;
  let successMessage: string;
  let buttonLabel: string;
  let secondaryUrl: string;
  let secondaryLabel: string;

  switch (type) {
    case 'Course':
    case 'course':
      redirectUrl = courseId ? `/student/courses/${courseId}/learn` : '/student/courses';
      successMessage = 'Kurs satın alımınız başarıyla tamamlandı!';
      buttonLabel = 'Kursa Git';
      secondaryUrl = '/student/courses';
      secondaryLabel = 'Kurslarım';
      break;
    case 'GroupClass':
      redirectUrl = '/student/my-classes';
      successMessage = 'Grup dersine kaydınız başarıyla tamamlandı!';
      buttonLabel = 'Derslerime Git';
      secondaryUrl = '/student/explore-classes';
      secondaryLabel = 'Diğer Dersleri Keşfet';
      break;
    case 'Booking':
    default:
      redirectUrl = '/student/bookings';
      successMessage = 'Mentorluk seansınız başarıyla rezerve edildi!';
      buttonLabel = 'Görüşmelerime Git';
      secondaryUrl = '/student/messages';
      secondaryLabel = 'Mentora Mesaj Gönder';
      break;
  }

  useEffect(() => {
    setTimeout(() => {
      router.push(redirectUrl);
    }, 5000);
  }, [router, redirectUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 px-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="pt-10 pb-8 px-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarılı!</h1>
          <p className="text-gray-600 mb-6">{successMessage}</p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Durum</span>
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Onaylandı
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Ödeme Yöntemi</span>
              <span className="text-gray-900">Iyzico Güvencesi</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href={redirectUrl} className="block">
              <Button className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white py-5 shadow-lg shadow-teal-500/25">
                {buttonLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href={secondaryUrl} className="block">
              <Button variant="outline" className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 py-5">
                <MessageSquare className="w-4 h-4 mr-2" />
                {secondaryLabel}
              </Button>
            </Link>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Iyzico güvencesiyle güvenli ödeme</span>
          </div>

          <p className="text-xs text-gray-400 mt-3">5 saniye içinde otomatik yönlendirileceksiniz...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
        <Card className="w-full max-w-md border-0 shadow-2xl mx-4">
          <CardContent className="pt-10 pb-8 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Ödeme Başarılı!</h1>
            <p className="text-gray-600 mb-4">Yönlendiriliyorsunuz...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
