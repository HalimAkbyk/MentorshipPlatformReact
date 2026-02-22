'use client';

import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Check, Users, GraduationCap, Briefcase, CreditCard, Shield, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { pickDefaultDashboard } from '@/lib/utils/auth-redirect';
import { FadeInSection, FadeInDiv, StaggerGrid, StaggerItem } from '@/components/motion';

export default function PricingPage() {
  const { user, isAuthenticated } = useAuthStore();

  const ctaHref = isAuthenticated
    ? pickDefaultDashboard(user?.roles)
    : '/auth/signup';
  const ctaLabel = isAuthenticated ? 'Panelime Git' : 'Hemen Başla';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <FadeInDiv>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Ücretlendirme</h1>
            <p className="text-teal-100 text-lg max-w-2xl mx-auto">
              Şeffaf ve adil fiyatlandırma — gizli ücret yok
            </p>
          </FadeInDiv>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-10 pb-16">
        <StaggerGrid className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* For Students */}
          <StaggerItem>
            <Card className="border-2 border-gray-100 hover:border-teal-300 hover:shadow-xl transition-all duration-300 h-full">
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Danışanlar İçin</CardTitle>
                <CardDescription>
                  Sadece aldığın dersler için öde
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6 py-4 bg-teal-50 rounded-xl">
                  <div className="text-3xl font-bold text-teal-600 mb-1">
                    +%7
                  </div>
                  <p className="text-sm text-gray-600">
                    platform bedeli
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    'Ücretsiz kayıt',
                    'Güvenli ödeme (Iyzico)',
                    '24 saat öncesine kadar iptal',
                    '%100 iade garantisi',
                    'HD video görüşme',
                    'Taksit seçeneği',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={ctaHref} className="block mt-6">
                  <Button className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white py-5">
                    {ctaLabel}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* For Mentors */}
          <StaggerItem>
            <Card className="border-2 border-teal-200 bg-gradient-to-b from-teal-50/50 to-white hover:shadow-xl transition-all duration-300 relative h-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 bg-gradient-to-r from-teal-500 to-green-500 text-white text-xs rounded-full font-medium">
                  Popüler
                </span>
              </div>
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Mentorler İçin</CardTitle>
                <CardDescription>
                  Kendi ücretini sen belirle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6 py-4 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    %15
                  </div>
                  <p className="text-sm text-gray-600">
                    komisyon (tamamlanan derslerden)
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    'Ücretsiz kayıt ve profil',
                    'Kendi fiyatını belirle',
                    'Hızlı ödeme (24 saat)',
                    'IBAN\'a direkt transfer',
                    'Detaylı kazanç analizi',
                    'Esnek müsaitlik takvimi',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={ctaHref} className="block mt-6">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-5">
                    Mentor Ol
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerGrid>

        {/* Payment Methods + Guarantee */}
        <FadeInDiv delay={0.3} className="mt-12 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: CreditCard, title: 'Güvenli Ödeme', desc: 'Iyzico altyapısı ile 256-bit SSL şifreleme' },
              { icon: Shield, title: 'Para İade Garantisi', desc: 'Memnun kalmazsanız %100 iade' },
              { icon: Zap, title: 'Hızlı Transfer', desc: 'Mentor ödemeleri 24 saat içinde' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-600 mb-4">
              Sorularınız mı var?{' '}
              <Link href="/public/faq" className="text-teal-600 hover:underline font-medium">SSS</Link>{' '}
              sayfamızı ziyaret edin
            </p>
          </div>
        </FadeInDiv>
      </div>
    </div>
  );
}
