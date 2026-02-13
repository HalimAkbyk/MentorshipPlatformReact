import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072/api';

/**
 * Iyzico Callback Handler (Frontend Proxy)
 *
 * Iyzico ödeme tamamlandığında bu endpoint'e POST yapar (form data ile token gönderir).
 * Bu route token'ı backend'e forward eder, ödemeyi doğrular ve sonuca göre
 * success veya failed sayfasına yönlendirir.
 *
 * IMPORTANT: 303 status code kullanılır çünkü Iyzico POST ile gelir,
 * 307 redirect orijinal POST method'unu korur ve sayfa 405 döner.
 * 303 See Other → browser'ı GET'e çevirir.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    console.log('📥 Iyzico callback received - Token:', token);

    if (!token) {
      console.error('❌ No token in Iyzico callback');
      return NextResponse.redirect(new URL('/api/payment/failed', request.url), 303);
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
      return NextResponse.redirect(new URL('/api/payment/success', request.url), 303);
    } else {
      console.error('❌ Payment verification failed:', result);
      return NextResponse.redirect(new URL('/api/payment/failed', request.url), 303);
    }
  } catch (error) {
    console.error('❌ Iyzico callback error:', error);
    return NextResponse.redirect(new URL('/api/payment/failed', request.url), 303);
  }
}

// GET handler - kullanıcı doğrudan URL'e girerse
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/payment/failed', request.url), 303);
}
