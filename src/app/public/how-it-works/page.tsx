'use client';

import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Search, Calendar, Video, Rocket, UserPlus, Star, Shield, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { pickDefaultDashboard } from '@/lib/utils/auth-redirect';
import { FadeInSection, FadeInDiv, StaggerGrid, StaggerItem } from '@/components/motion';

export default function HowItWorksPage() {
  const { user, isAuthenticated } = useAuthStore();

  const ctaHref = isAuthenticated
    ? pickDefaultDashboard(user?.roles)
    : '/auth/signup';
  const ctaLabel = isAuthenticated ? 'Panelime Git' : 'Hemen Başla';

  const studentSteps = [
    { icon: Search, title: 'Mentor Bul', desc: 'Üniversite ve bölüme göre filtrele, sana uygun mentoru keşfet', step: 1 },
    { icon: Calendar, title: 'Randevu Al', desc: 'Uygun saati seç, güvenli ödeme yap, onay bekle', step: 2 },
    { icon: Video, title: 'Ders Yap', desc: 'Online video konferans ile bire bir mentorluk al', step: 3 },
    { icon: Rocket, title: 'Hedefine Ulaş', desc: 'Düzenli mentorluk ile hayalindeki üniversiteyi kazan', step: 4 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <FadeInDiv>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Nasıl Çalışır?
            </h1>
            <p className="text-teal-100 text-lg max-w-2xl mx-auto">
              Değişim Mentorluk ile hedef üniversiteni kazanmış öğrencilerden mentorluk almak çok kolay
            </p>
          </FadeInDiv>
        </div>
      </div>

      {/* Steps */}
      <FadeInSection className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">4 Kolay Adım</h2>
          <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">Mentorluğa başlamak için tek yapmanız gereken bu adımları takip etmek</p>

          {/* Steps with connecting line */}
          <div className="relative max-w-5xl mx-auto">
            <div className="hidden md:block absolute top-14 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-teal-200 via-green-200 to-emerald-200" />

            <StaggerGrid className="grid md:grid-cols-4 gap-8">
              {studentSteps.map((step, i) => (
                <StaggerItem key={i} className="text-center relative">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-green-600 shadow-xl flex items-center justify-center mx-auto">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white shadow-md border-2 border-teal-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-teal-600">{step.step}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </div>
      </FadeInSection>

      {/* Guarantees */}
      <FadeInSection className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border-2 border-teal-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Para İade Garantisi</h3>
                <p className="text-sm text-gray-600">24 saat öncesine kadar ücretsiz iptal ve %100 iade. Ödemeleriniz Iyzico güvencesiyle korunur.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border-2 border-teal-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Doğrulanmış Mentorler</h3>
                <p className="text-sm text-gray-600">Tüm mentorler üniversite ve kimlik doğrulamasından geçer. Kaliteli mentorluk garantisi.</p>
              </div>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* CTA */}
      <FadeInSection className="pb-20">
        <div className="container mx-auto px-4 text-center">
          <Link href={ctaHref}>
            <Button size="lg" className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white px-10 py-6 text-lg shadow-lg shadow-teal-500/25">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </FadeInSection>
    </div>
  );
}
