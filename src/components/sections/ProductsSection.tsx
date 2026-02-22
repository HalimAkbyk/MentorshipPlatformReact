'use client';

import { MessageSquare, Users, Video, Check, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const products = [
  {
    icon: MessageSquare,
    name: 'Bire Bir Görüşme',
    desc: 'Kişiye özel mentorluk',
    gradient: 'from-teal-500 to-cyan-600',
    features: [
      'Sana özel plan ve rehberlik',
      'Esnek zamanlama',
      'Bireysel geri bildirim',
      'Derinlemesine çalışma',
      'Canlı görüşme',
    ],
    highlight: 'En hızlı ilerleme yöntemi',
    count: '350+ mentor',
    href: '/public/mentors',
    btnText: 'Mentor Bul',
    btnGradient: 'from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700',
    featured: false,
  },
  {
    icon: Users,
    name: 'Grup Dersleri',
    desc: 'Küçük gruplarla canlı eğitim',
    gradient: 'from-green-500 to-emerald-600',
    features: [
      'Benzer hedefte kişilerle öğrenme',
      'Canlı etkileşim',
      'Soru-cevap imkanı',
      'Networking fırsatı',
      'Programlı ders akışı',
    ],
    highlight: 'Toplulukla öğrenmek isteyenler için',
    count: '180+ ders',
    href: '/student/explore-classes',
    btnText: 'Dersleri Keşfet',
    btnGradient: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    featured: true,
  },
  {
    icon: Video,
    name: 'Video Kurslar',
    desc: 'Kendi hızında öğren',
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'İstediğin zaman erişim',
      'Adım adım anlatımlar',
      'Tekrar izleme imkanı',
      'Kaynak ve materyaller',
      'Yapılandırılmış içerik',
    ],
    highlight: 'Zaman bağımsız öğrenme',
    count: '120+ kurs',
    href: '/student/explore-courses',
    btnText: 'Kursları Keşfet',
    btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
    featured: false,
  },
];

export default function ProductsSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full mb-4 border border-teal-200">
            <Zap className="w-4 h-4 text-teal-600" />
            <span className="text-sm text-teal-700">3 Farklı Öğrenme Yolu</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Nasıl Öğrenmek İstersin?
          </h2>
          <p className="text-lg text-gray-600">
            Sana en uygun mentorluk formatını seç ve hemen başla.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={i}
                className={`p-6 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
                  s.featured ? 'border-green-300 shadow-lg' : 'border-gray-100 hover:border-teal-200'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-5 shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{s.name}</h3>
                <p className="text-gray-600 mb-5 text-sm">{s.desc}</p>

                <ul className="space-y-2.5 mb-5 flex-1">
                  {s.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Güçlü ek satır */}
                <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100">
                  <Star className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-teal-800">{s.highlight}</span>
                </div>

                <Link href={s.href}>
                  <Button
                    className={`w-full bg-gradient-to-r ${s.btnGradient} text-white`}
                  >
                    {s.btnText}
                  </Button>
                </Link>
                <p className="text-center text-xs text-gray-500 mt-2">{s.count} mevcut</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
