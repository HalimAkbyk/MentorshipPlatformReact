'use client';

import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Check } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { pickDefaultDashboard } from '@/lib/utils/auth-redirect';
import { FadeInSection, FadeInDiv, StaggerGrid, StaggerItem } from '@/components/motion';

export default function PricingPage() {
  const { user, isAuthenticated } = useAuthStore();

  const ctaHref = isAuthenticated
    ? pickDefaultDashboard(user?.roles)
    : '/auth/signup';
  const ctaLabel = isAuthenticated ? 'Panelime Git' : 'Hemen Basla';

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <FadeInDiv className="text-center mb-12">
          <h1 className="text-4xl font-bold font-heading mb-4">Ucretlendirme</h1>
          <p className="text-xl text-gray-600">
            Seffaf ve adil fiyatlandirma
          </p>
        </FadeInDiv>

        <StaggerGrid className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* For Students */}
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Danisanlar Icin</CardTitle>
                <CardDescription>
                  Sadece aldigin dersler icin ode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-3xl font-bold mb-2">
                    +%7 <span className="text-lg font-normal text-gray-600">platform bedeli</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Mentorun belirledigi fiyata ek olarak
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span>Ucretsiz kayit</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span>Guvenli odeme</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span>24 saat oncesine kadar iptal</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span>%100 iade garantisi</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* For Mentors */}
          <StaggerItem>
            <Card className="border-primary-200 bg-primary-50">
              <CardHeader>
                <CardTitle>Mentorler Icin</CardTitle>
                <CardDescription>
                  Kendi ucretini sen belirle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-3xl font-bold mb-2">
                    %15 <span className="text-lg font-normal text-gray-600">komisyon</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tamamlanan derslerden
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span>Ucretsiz kayit ve profil</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span>Kendi fiyatini belirle</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span>Hizli odeme (24 saat)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span>IBAN a direkt transfer</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerGrid>

        <FadeInDiv className="text-center mt-12" delay={0.3}>
          <p className="text-gray-600 mb-6">
            Sorulariniz mi var?{' '}
            <Link href="/public/faq" className="text-primary-600 hover:underline">SSS</Link>{' '}
            sayfamizi ziyaret edin
          </p>
          <Link href={ctaHref}>
            <Button size="lg">{ctaLabel}</Button>
          </Link>
        </FadeInDiv>
      </div>
    </div>
  );
}
