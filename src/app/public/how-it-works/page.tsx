'use client';

import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { UserPlus, Search, Calendar, Video, Star, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { pickDefaultDashboard } from '@/lib/utils/auth-redirect';
import { FadeInSection, FadeInDiv, StaggerGrid, StaggerItem } from '@/components/motion';

export default function HowItWorksPage() {
  const { user, isAuthenticated } = useAuthStore();

  const ctaHref = isAuthenticated
    ? pickDefaultDashboard(user?.roles)
    : '/auth/signup';
  const ctaLabel = isAuthenticated ? 'Panelime Git' : 'Hemen Başla';

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <FadeInSection className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6">
            Nasıl Çalışır?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Değişim Mentorluk ile hedef üniversiteni kazanmış öğrencilerden mentorluk almak çok kolay
          </p>
        </div>
      </FadeInSection>

      {/* For Students */}
      <FadeInSection className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-heading text-center mb-12">
            Danışanlar İçin
          </h2>
          <StaggerGrid className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: '1. Mentor Bul', desc: 'Üniversite ve bölüme göre filtrele, sana uygun mentoru keşfet', color: 'primary' },
              { icon: Calendar, title: '2. Randevu Al', desc: 'Uygun saati seç, güvenli ödeme yap, onay bekle', color: 'primary' },
              { icon: Video, title: '3. Ders Yap', desc: 'Online video konferans ile bire bir mentorluk al', color: 'primary' },
            ].map((step, i) => (
              <StaggerItem key={i}>
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{step.desc}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </FadeInSection>

      {/* For Mentors */}
      <FadeInSection className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-heading text-center mb-12">
            Mentorler İçin
          </h2>
          <StaggerGrid className="grid md:grid-cols-3 gap-8">
            {[
              { icon: UserPlus, title: '1. Kayıt Ol', desc: 'Profil oluştur, üniversite bilgilerini doğrula' },
              { icon: Calendar, title: '2. Uygunluk Ekle', desc: 'Takvimini ayarla, ücretini belirle, hizmete başla' },
              { icon: Star, title: '3. Kazan', desc: 'Mentorluk yap, değerlendirme al, kazanç elde et' },
            ].map((step, i) => (
              <StaggerItem key={i}>
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-accent-600" />
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{step.desc}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </FadeInSection>

      {/* Safety */}
      <FadeInSection className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 text-primary-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold font-heading mb-6">
              Güvenli ve Kolay
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Tüm mentorler doğrulanır, ödemeler güvenli bir şekilde saklanır ve
              ders tamamlandıktan sonra aktarılır. İptal ve iade kurallarımız
              her iki tarafı da korur.
            </p>
            <Link href={ctaHref}>
              <Button size="lg">{ctaLabel}</Button>
            </Link>
          </div>
        </div>
      </FadeInSection>
    </div>
  );
}
