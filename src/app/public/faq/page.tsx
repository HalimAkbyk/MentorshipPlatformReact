'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const faqs = [
  {
    q: 'Mentorluk nedir?',
    a: 'Mentorluk, hedef universitesini kazanmis ya da derece yapmis ogrencilerin, sinava hazirlanan ogrencilere birebir online gorusmeler araciligiyla rehberlik etmesidir. Ders anlatimi degil, strateji, motivasyon ve yol haritasi olusturma odaklidir.',
  },
  {
    q: 'Nasil kayit olurum?',
    a: 'Ana sayfadaki "Uye Ol" butonuna tiklayarak danisan (ogrenci) veya mentor olarak kayit olabilirsiniz. Kayit islemi ucretsizdir.',
  },
  {
    q: 'Mentor ile nasil gorusme yaparim?',
    a: 'Mentorler sayfasindan size uygun mentoru secin, uygun saat dilimini belirleyin ve odemenizi yapin. Onaylanan randevunuzda online video gorusme ile mentorunuzle bulusursunuz.',
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
    a: 'Mentor olmak icin kayit olduktan sonra universite ve kimlik dogrulamasi yapmaniz gerekir. Basvurunuz admin tarafindan incelendikten sonra onaylanir ve ders vermeye baslayabilirsiniz.',
  },
  {
    q: 'Teknik bir sorun yasarsam ne yapmaliyim?',
    a: 'Destek sayfamizdan bize ulasabilir veya destek@degisimmentorluk.com adresine e-posta gonderebilirsiniz. En kisa surede size donecegiz.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Sikca Sorulan Sorular</h1>
          <p className="text-xl text-gray-600">
            Merak ettiginiz her sey burada
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-gray-400 transition-transform shrink-0 ml-4',
                    openIndex === i && 'rotate-180'
                  )}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
