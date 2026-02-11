'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Ödeme Başarısız</h1>
        <p className="text-gray-600 mb-4">
          Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.
        </p>
        <Button onClick={() => router.back()}>
          Geri Dön
        </Button>
      </div>
    </div>
  );
}