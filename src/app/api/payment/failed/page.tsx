'use client';

import { useRouter } from 'next/navigation';
import { XCircle, RotateCcw, Headphones, Home, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="pt-10 pb-8 px-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
            <XCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarısız</h1>
          <p className="text-gray-600 mb-6">
            Ödeme işlemi tamamlanamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.
          </p>

          {/* Error Reasons */}
          <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-red-800">
              <AlertCircle className="w-4 h-4" />
              Olası Nedenler
            </div>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                Yetersiz bakiye veya limit aşımı
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                Kart bilgilerinde hata
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                Banka tarafından reddedilme
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                Zaman aşımı
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => router.back()}
              className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white py-5 shadow-lg shadow-teal-500/25"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Tekrar Dene
            </Button>
            <Link href="/public/support" className="block">
              <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 py-5">
                <Headphones className="w-4 h-4 mr-2" />
                Destek
              </Button>
            </Link>
            <Link href="/public" className="block">
              <Button variant="ghost" className="w-full text-gray-500">
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Button>
            </Link>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Kartınızdan herhangi bir ücret kesilmemiştir</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
