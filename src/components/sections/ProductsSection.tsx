'use client';

import { MessageSquare, Users, Video, Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const products = [
  {
    icon: MessageSquare,
    name: 'Bire Bir Gorusme',
    desc: 'Ozel seanslar',
    range: '₺150 - ₺500',
    period: '/ saat',
    gradient: 'from-teal-500 to-cyan-600',
    features: ['Kisisellestirilmis ogrenme', 'Esnek zamanlama', 'Kayit ve tekrar izleme', 'Anlik geri bildirim'],
    count: '350+ mentor',
    btnGradient: 'from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700',
    featured: false,
  },
  {
    icon: Users,
    name: 'Grup Dersleri',
    desc: 'Kucuk grup egitimleri',
    range: '₺80 - ₺250',
    period: '/ ders',
    gradient: 'from-green-500 to-emerald-600',
    features: ['Max 10 kisilik gruplar', 'Toplulukla ogrenme', 'Uygun fiyatlar', 'Networking firsati'],
    count: '180+ ders',
    btnGradient: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    featured: true,
  },
  {
    icon: Video,
    name: 'Video Kurslar',
    desc: 'Onceden kaydedilmis',
    range: '₺299 - ₺1.499',
    period: '/ kurs',
    gradient: 'from-emerald-500 to-teal-600',
    features: ['Omur boyu erisim', 'Kendi hizinda ogrenme', 'Indirilebilir kaynaklar', 'Sertifika programlari'],
    count: '120+ kurs',
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
            <span className="text-sm text-teal-700">3 Farkli Ogrenme Yolu</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Pazaryerimizde Neler Sunuluyor?
          </h2>
          <p className="text-lg text-gray-600">
            Mentorlerimiz farkli formatlarda hizmet sunuyor. Fiyatlari kendileri belirliyor.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={i}
                className={`p-6 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  s.featured ? 'border-green-300 shadow-lg' : 'border-gray-100 hover:border-teal-200'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-5 shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.name}</h3>
                <p className="text-gray-600 mb-4 text-sm">{s.desc}</p>
                <div className="mb-5">
                  <span className="text-3xl font-bold text-gray-900">{s.range}</span>
                  <span className="text-gray-500 text-sm">{s.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {s.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/public/mentors">
                  <Button
                    className={`w-full bg-gradient-to-r ${s.btnGradient} text-white`}
                  >
                    Kesfet
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
