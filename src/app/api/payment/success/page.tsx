'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push('/student/bookings');
    }, 3000);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Ödeme Başarılı!</h1>
        <p className="text-gray-600 mb-4">
          Rezervasyonunuz onaylandı. Yönlendiriliyorsunuz...
        </p>
        <Button onClick={() => router.push('/student/bookings')}>
          Rezervasyonlarım
        </Button>
      </div>
    </div>
  );
}