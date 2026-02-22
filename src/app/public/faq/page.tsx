'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useStaticPage } from '@/lib/hooks/use-cms';
import Link from 'next/link';

const faqs = [
  {
    q: 'Mentorluk nedir?',
    a: 'Mentorluk, hedef universitesini kazanmis ya da derece yapmis ogrencilerin, sinava hazirlanan ogrencilere birebir online gorusmeler araciligiyla rehberlik etmesidir.',
  },
  {
    q: 'Nasil kayit olurum?',
    a: 'Ana sayfadaki "Uye Ol" butonuna tiklayarak danisan (ogrenci) veya mentor olarak kayit olabilirsiniz. Kayit islemi ucretsizdir.',
  },
  {
    q: 'Mentor ile nasil gorusme yaparim?',
    a: 'Mentorler sayfasindan size uygun mentoru secin, uygun saat dilimini belirleyin ve odemenizi yapin. Onaylanan randevunuzda online video gorusme ile mentorunuzla bulusursunuz.',
  },
  {
    q: 'Ucretlendirme nasil calisiyor?',
    a: 'Her mentor kendi ucretini belirler. Danisanlardan mentor ucretine ek olarak %7 platform bedeli alinir. Mentorlerden tamamlanan dersler uzerinden %15 komisyon kesilir.',
  },
  {
    q: 'Odeme guvenligi nasil saglaniyor?',
    a: 'Tum odemeler Iyzico altyapisi uzerinden guvenlice islenir. Odemeniz ders tamamlanana kadar platformda saklanir ve ders sonrasinda mentore aktarilir.',
  },
  {
    q: 'Randevumu iptal edebilir miyim?',
    a: 'Evet, ders baslama saatinden 24 saat oncesine kadar ucretsiz iptal yapabilirsiniz. 24 saatten az kalan iptallerde ucret iadesi yapilmaz.',
  },
  {
    q: 'Mentor olmak icin ne gerekiyor?',
    a: 'Mentor olmak icin kayit olduktan sonra universite ve kimlik dogrulamasi yapmaniz gerekir. Basvurunuz admin tarafindan incelendikten sonra onaylanir.',
  },
  {
    q: 'Teknik bir sorun yasarsam ne yapmaliyim?',
    a: 'Destek sayfamizdan bize ulasabilir veya destek@degisimmentorluk.com adresine e-posta gonderebilirsiniz.',
  },
];

function HardcodedFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-teal-200 transition-colors">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">{faq.q}</span>
            <ChevronDown className={cn('w-5 h-5 text-teal-600 transition-transform shrink-0 ml-4', openIndex === i && 'rotate-180')} />
          </button>
          {openIndex === i && (
            <div className="px-6 pb-4 text-gray-600 leading-relaxed">{faq.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FaqPage() {
  const { data: page, isLoading } = useStaticPage('sss');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">{page?.title || 'Sıkça Sorulan Sorular'}</h1>
          <p className="text-teal-100 text-lg">Merak ettiğiniz her şey burada</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-12">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded-xl w-full" />
            <div className="h-16 bg-gray-200 rounded-xl w-full" />
            <div className="h-16 bg-gray-200 rounded-xl w-full" />
          </div>
        ) : page?.content ? (
          <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <HardcodedFaq />
        )}

        <div className="text-center mt-12 p-8 bg-white rounded-2xl border border-gray-100">
          <HelpCircle className="w-10 h-10 text-teal-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cevabınızı bulamadınız mı?</h3>
          <p className="text-gray-600 text-sm mb-4">Destek ekibimiz size yardımcı olmaktan mutluluk duyar</p>
          <Link href="/public/support">
            <Button className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white">
              Destek Ekibine Ulaşın
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
