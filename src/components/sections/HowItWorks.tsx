'use client';

import { Search, Calendar, Video, Rocket, Shield, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

const steps = [
  { icon: Search, num: '01', title: 'Mentor/Ders Sec', desc: 'Alanina, deneyimine ve musaitlik durumuna gore filtrele.' },
  { icon: Calendar, num: '02', title: 'Rezervasyon Yap', desc: 'Takvimden uygun zamani sec. Guvenli odeme ile hemen rezerve et.' },
  { icon: Video, num: '03', title: 'Ogrenmeye Basla', desc: 'Canli gorusme, grup dersi veya video kursla ogrenmeye basla.' },
  { icon: Rocket, num: '04', title: 'Ilerle & Basar', desc: 'Ilerleme takibi, geri bildirimler ve sertifikalarla hedeflerine ulas.' },
];

const guarantees = [
  { icon: Shield, title: 'Para Iade Garantisi', desc: 'Ilk seansinizdan memnun kalmazsaniz, %100 iade' },
  { icon: TrendingUp, title: 'Basari Garantisi', desc: '3 ay duzenli katilimda %80+ memnuniyet garantisi' },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Nasil Calisir?</h2>
          <p className="text-lg text-gray-600">4 basit adimda ogrenme yolculuguna basla</p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-14 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-teal-200 via-green-200 to-emerald-200" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="text-center relative">
                <div className="relative mb-5 inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center shadow-xl relative z-10">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white border-[3px] border-green-100 flex items-center justify-center z-20 shadow-md">
                    <span className="text-xs font-bold text-teal-600">{step.num}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Guarantee cards */}
        <div className="max-w-3xl mx-auto mt-14 grid md:grid-cols-2 gap-4">
          {guarantees.map((g) => {
            const Icon = g.icon;
            return (
              <Card key={g.title} className="p-5 border-2 border-teal-200 bg-gradient-to-br from-white to-teal-50/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{g.title}</h4>
                    <p className="text-sm text-gray-600">{g.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
