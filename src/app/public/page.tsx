'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { Search, Calendar, Video, Star, BarChart3, Target, Heart, ChevronRight, GraduationCap, Users, Clock, Shield } from 'lucide-react';
import { FadeInSection, FadeInDiv, StaggerGrid, StaggerItem, ScaleInDiv } from '@/components/motion';

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const isStudent = isAuthenticated && user?.roles.includes(UserRole.Student);
  const isMentor = isAuthenticated && user?.roles.includes(UserRole.Mentor);

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50 to-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeInDiv>
              <p className="text-primary-500 font-semibold mb-4 tracking-wide">
                350+ ogrenciye ilham vermenin heyecanini yasiyoruz.
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-900 mb-6 leading-tight">
                &ldquo;<span className="text-primary-500">Ogrencinin</span> halinden{' '}
                <span className="text-primary-500">Ogrenci</span> anlar.&rdquo;
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                YKS&apos;ye hazirlanan ogrencilere birebir rehberlik ve akademik destek sunan mentorluk platformu.
                Derece yapmis ogrenciler ve mentorluk egitimi almis uzmanlar tarafindan sunulan bu hizmet,
                her ogrencinin kendi temposuna uygun bir calisma sureci olusturmasini saglar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/public/mentors">
                  <Button size="lg" className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-8 py-6 text-base font-semibold w-full sm:w-auto">
                    Mentor Bul
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
                {isStudent ? (
                  <Link href="/student/dashboard">
                    <Button size="lg" variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-50 rounded-lg px-8 py-6 text-base w-full sm:w-auto">
                      Panelime Git
                    </Button>
                  </Link>
                ) : isMentor ? (
                  <Link href="/mentor/dashboard">
                    <Button size="lg" variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-50 rounded-lg px-8 py-6 text-base w-full sm:w-auto">
                      Mentor Panelim
                    </Button>
                  </Link>
                ) : (
                  <Link href="/public/pricing">
                    <Button size="lg" variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-50 rounded-lg px-8 py-6 text-base w-full sm:w-auto">
                      Paketleri Incele
                    </Button>
                  </Link>
                )}
              </div>
            </FadeInDiv>

            {/* Hero Visual */}
            <ScaleInDiv className="hidden md:flex justify-center relative" delay={0.2}>
              <div className="relative">
                <div className="w-80 h-80 lg:w-96 lg:h-96 bg-primary-500 rounded-3xl rotate-6 opacity-10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 -rotate-3">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-primary-500" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">100+ Derece Mentor</div>
                        <div className="text-sm text-gray-500">Turkiye geneli</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center text-sm font-bold text-accent-700">AYT</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div className="bg-primary-500 h-3 rounded-full" style={{width: '85%'}}></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center text-sm font-bold text-accent-700">TYT</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div className="bg-accent-500 h-3 rounded-full" style={{width: '90%'}}></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-sm font-bold text-primary-700">YKS</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div className="bg-primary-400 h-3 rounded-full" style={{width: '75%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScaleInDiv>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <FadeInSection className="bg-primary-500 py-8">
        <div className="container mx-auto px-4">
          <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              { value: '100+', label: 'Derece Mentor' },
              { value: '350+', label: 'Mutlu Ogrenci' },
              { value: '1000+', label: 'Tamamlanan Ders' },
              { value: '4.8', label: 'Ortalama Puan' },
            ].map((stat, i) => (
              <StaggerItem key={i}>
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                <div className="text-primary-100 text-sm mt-1">{stat.label}</div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </FadeInSection>

      {/* Features Section */}
      <FadeInSection className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-4">
              Neden <span className="text-primary-500">Degisim Mentorluk?</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Basarili ogrencilerin tecrubelerinden yararlanarak sinav surecini daha verimli yonet
            </p>
          </div>
          <StaggerGrid className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: 'Birebir Danismanlik', desc: 'Derece ogrencileriyle birebir goruserek sinav surecini daha verimli yonet.' },
              { icon: Target, title: 'Strateji ve Taktikler', desc: 'Basarili ogrencilerin uyguladigi sinav tekniklerini ogren ve yol haritani olustur.' },
              { icon: Heart, title: 'Motivasyon ve Rehberlik', desc: 'Sinav stresini yonet, dogru calisma aliskanliklari edin ve hedeflerine emin adimlarla ilerle.' },
            ].map((feature, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </FadeInSection>

      {/* How It Works */}
      <FadeInSection className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary-500 font-semibold mb-2 uppercase tracking-wider text-sm">SIKCA SORULAN SORULAR</p>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900">
              Mentorluk Sistemimiz <span className="text-gray-400">Nasil Isliyor?</span>
            </h2>
          </div>
          <StaggerGrid className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Search, title: '1. Mentor Bul', desc: 'Universite ve bolume gore filtrele, sana uygun mentoru bul' },
              { icon: Calendar, title: '2. Randevu Al', desc: 'Uygun saati sec, guvenli odeme yap' },
              { icon: Video, title: '3. Ders Yap', desc: 'Online video konferans ile bire bir ders al' },
              { icon: Star, title: '4. Degerlendir', desc: 'Deneyimini paylas, mentor hakkinda yorum yap' },
            ].map((step, i) => (
              <StaggerItem key={i}>
                <div className="text-center group">
                  <div className="w-20 h-20 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-500 transition-colors">
                    <step.icon className="w-10 h-10 text-primary-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </FadeInSection>

      {/* Testimonials */}
      <FadeInSection className="py-20 bg-primary-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-4">
              Ogrencilerimiz Ne Diyor?
            </h2>
          </div>
          <StaggerGrid className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Ahmet Akif', role: 'Mezun Uye', text: 'Mentorluk surecinde yalniz olmadigimi hissettim. Motivasyonum dustugunde bile yanindaydi.' },
              { name: 'Berkan Simsek', role: '12. Sinif', text: 'Calisma tempomun bana gore belirlenmesi oldu. Hangi konularda eksik oldugumu tespit etti.' },
              { name: 'Seyda Ahlat', role: '11. Sinif', text: 'Mentorluk hizmeti aldim ve tyt kismini tamamladik. Kofamin rahat oldugu bir yil oldu.' },
            ].map((t, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-primary-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-500">{t.role}</div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex gap-1 mt-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent-500 text-accent-500" />
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </FadeInSection>

      {/* CTA Section - Mentor Ol */}
      <FadeInSection className="py-20 bg-gradient-to-r from-primary-600 to-primary-500">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-100 font-semibold mb-2 uppercase tracking-wider text-sm">BIZE KATILIN</p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-6">Mentor Ol</h2>
          <p className="text-primary-100 mb-8 max-w-lg mx-auto">
            Derece yapmis bir ogrenciysen, tecrubeni paylasarak diger ogrencilere yardim edebilirsin.
          </p>
          {isMentor ? (
            <Link href="/mentor/dashboard">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 rounded-full px-10 py-6 text-base font-semibold">
                Mentor Panelim
              </Button>
            </Link>
          ) : (
            <Link href="/auth/signup?role=mentor">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 rounded-full px-10 py-6 text-base font-semibold">
                Basvur
              </Button>
            </Link>
          )}
        </div>
      </FadeInSection>

      {/* Trust Badges */}
      <FadeInSection className="py-12">
        <div className="container mx-auto px-4">
          <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'Guvenli Odeme' },
              { icon: Users, label: 'Onaylanmis Mentorler' },
              { icon: Video, label: 'HD Video Gorusme' },
              { icon: Clock, label: '7/24 Destek' },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div className="flex items-center gap-3 justify-center text-gray-600">
                  <item.icon className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </FadeInSection>
    </div>
  );
}
