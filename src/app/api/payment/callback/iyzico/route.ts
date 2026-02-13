import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072/api';

/**
 * Iyzico Callback Handler (Frontend Proxy)
 *
 * Iyzico ödeme tamamlandığında bu endpoint'e POST yapar (form data ile token gönderir).
 * Bu route token'ı backend'e forward eder, ödemeyi doğrular ve sonuca göre
 * success veya failed sayfasına yönlendirir.
 *
 * Neden frontend'de? Koyeb free tier'da dış kaynaklardan gelen doğrudan
 * istekler (Iyzico callback) Koyeb edge network tarafından düşürülüyor.
 * Frontend (Vercel) ise her zaman erişilebilir.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    console.log('📥 Iyzico callback received - Token:', token);

    if (!token) {
      console.error('❌ No token in Iyzico callback');
      return NextResponse.redirect(new URL('/api/payment/failed', request.url));
    }

    // Backend'e token'ı gönder (ödemeyi doğrula)
    const backendUrl = `${BACKEND_API_URL}/payments/verify-callback`;
    console.log('📤 Forwarding to backend:', backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const result = await backendResponse.json();
    console.log('📨 Backend response:', backendResponse.status, result);

    if (backendResponse.ok && result.isSuccess !== false) {
      return NextResponse.redirect(new URL('/api/payment/success', request.url));
    } else {
      console.error('❌ Payment verification failed:', result);
      return NextResponse.redirect(new URL('/api/payment/failed', request.url));
    }
  } catch (error) {
    console.error('❌ Iyzico callback error:', error);
    return NextResponse.redirect(new URL('/api/payment/failed', request.url));
  }
}

// GET handler - kullanıcı doğrudan URL'e girerse
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/payment/failed', request.url));
}
