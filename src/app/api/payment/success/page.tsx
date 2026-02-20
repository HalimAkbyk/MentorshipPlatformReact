'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const courseId = searchParams.get('courseId');

  // Determine redirect URL and message based on order type
  let redirectUrl: string;
  let successMessage: string;
  let buttonLabel: string;

  switch (type) {
    case 'Course':
    case 'course':
      redirectUrl = courseId ? `/student/courses/${courseId}/learn` : '/student/courses';
      successMessage = 'Kurs satın alımınız tamamlandı. Yönlendiriliyorsunuz...';
      buttonLabel = 'Kursa Git';
      break;
    case 'GroupClass':
      redirectUrl = '/student/my-classes';
      successMessage = 'Grup dersine kaydınız tamamlandı. Yönlendiriliyorsunuz...';
      buttonLabel = 'Derslerim';
      break;
    case 'Booking':
    default:
      redirectUrl = '/student/bookings';
      successMessage = 'Rezervasyonunuz onaylandı. Yönlendiriliyorsunuz...';
      buttonLabel = 'Rezervasyonlarım';
      break;
  }

  useEffect(() => {
    setTimeout(() => {
      router.push(redirectUrl);
    }, 3000);
  }, [router, redirectUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Ödeme Başarılı!</h1>
        <p className="text-gray-600 mb-4">{successMessage}</p>
        <Button onClick={() => router.push(redirectUrl)}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ödeme Başarılı!</h1>
          <p className="text-gray-600 mb-4">Yönlendiriliyorsunuz...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
