'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const faqs = [
  {
    q: 'Mentorluk nedir?',
    a: 'Mentorluk, hedef üniversitesini kazanmış ya da derece yapmış öğrencilerin, sınava hazırlanan öğrencilere birebir online görüşmeler aracılığıyla rehberlik etmesidir. Ders anlatımı değil, strateji, motivasyon ve yol haritası oluşturma odaklıdır.',
  },
  {
    q: 'Nasıl kayıt olurum?',
    a: 'Ana sayfadaki "Üye Ol" butonuna tıklayarak danışan (öğrenci) veya mentor olarak kayıt olabilirsiniz. Kayıt işlemi ücretsizdir.',
  },
  {
    q: 'Mentor ile nasıl görüşme yaparım?',
    a: 'Mentorler sayfasından size uygun mentoru seçin, uygun saat dilimini belirleyin ve ödemenizi yapın. Onaylanan randevunuzda online video görüşme ile mentorunuzla buluşursunuz.',
  },
  {
    q: 'Ücretlendirme nasıl çalışıyor?',
    a: 'Her mentor kendi ücretini belirler. Danışanlardan mentor ücretine ek olarak %7 platform bedeli alınır. Mentorlerden tamamlanan dersler üzerinden %15 komisyon kesilir.',
  },
  {
    q: 'Ödeme güvenliği nasıl sağlanıyor?',
    a: 'Tüm ödemeler Iyzico altyapısı üzerinden güvenlice işlenir. Ödemeniz ders tamamlanana kadar platformda saklanır ve ders sonrasında mentore aktarılır.',
  },
  {
    q: 'Randevumu iptal edebilir miyim?',
    a: 'Evet, ders başlama saatinden 24 saat öncesine kadar ücretsiz iptal yapabilirsiniz. 24 saatten az kalan iptallerde ücret iadesi yapılmaz.',
  },
  {
    q: 'Mentor olmak için ne gerekiyor?',
    a: 'Mentor olmak için kayıt olduktan sonra üniversite ve kimlik doğrulaması yapmanız gerekir. Başvurunuz admin tarafından incelendikten sonra onaylanır ve ders vermeye başlayabilirsiniz.',
  },
  {
    q: 'Teknik bir sorun yaşarsam ne yapmalıyım?',
    a: 'Destek sayfamızdan bize ulaşabilir veya destek@degisimmentorluk.com adresine e-posta gönderebilirsiniz. En kısa sürede size döneceğiz.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-heading mb-4">Sıkça Sorulan Sorular</h1>
          <p className="text-xl text-gray-600">
            Merak ettiğiniz her şey burada
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
