'use client';

import { useStaticPage } from '@/lib/hooks/use-cms';

function HardcodedTerms() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">1. Genel Hükümler</h2>
        <p className="text-gray-600 leading-relaxed">
          Bu kullanım şartları, degisimmentorluk.com (&quot;Platform&quot;) üzerinden sunulan hizmetlerin kullanımına ilişkin koşulları düzenler. Platformu kullanarak bu şartları kabul etmiş sayılırsınız.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">2. Hizmet Tanımı</h2>
        <p className="text-gray-600 leading-relaxed">
          Platform, mentorler ile danışanlar (öğrenciler) arasında online mentorluk hizmeti sağlar. Mentorler bağımsız hizmet sağlayıcılarıdır ve Platform bir aracılık hizmeti sunmaktadır.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">3. Üyelik ve Hesap</h2>
        <p className="text-gray-600 leading-relaxed">
          Platforma üye olmak için geçerli bir e-posta adresi ve doğru kişisel bilgiler gereklidir. Hesabınızın güvenliğinden siz sorumlusunuz.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">4. Ödeme ve İade</h2>
        <p className="text-gray-600 leading-relaxed">
          Ödemeler Iyzico altyapısı üzerinden güvenlice işlenir. Ders başlama saatinden en az 24 saat önce yapılan iptallerde tam iade yapılır. 24 saatten az kalan iptallerde iade yapılmaz.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">5. Mentor Sorumlulukları</h2>
        <p className="text-gray-600 leading-relaxed">
          Mentorler, belirledikleri saatlerde müsait olmak, profesyonel bir tutum sergilemek ve platformun kurallarını takip etmekle yükümlüdür.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">6. Danışan Sorumlulukları</h2>
        <p className="text-gray-600 leading-relaxed">
          Danışanlar, randevularına zamanında katılmak, mentorlere karşı saygı çerçevesinde davranmak ve platform kurallarını takip etmekle yükümlüdür.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">7. İçerik ve Fikri Mülkiyet</h2>
        <p className="text-gray-600 leading-relaxed">
          Platformdaki tüm içerikler (tasarım, logo, metin, yazılım) degisimmentorluk.com&apos;a aittir. İzinsiz kopyalanması veya dağıtılması yasaktır.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">8. İletişim</h2>
        <p className="text-gray-600 leading-relaxed">
          Bu şartlar hakkında sorularınız için{' '}
          <a href="mailto:destek@degisimmentorluk.com" className="text-teal-600 hover:underline">destek@degisimmentorluk.com</a>
          {' '}adresinden bize ulaşabilirsiniz.
        </p>
      </section>
    </div>
  );
}

export default function TermsPage() {
  const { data: page, isLoading } = useStaticPage('kullanim-sartlari');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">{page?.title || 'Kullanım Şartları'}</h1>
          <p className="text-teal-100">Son güncelleme: Şubat 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-12">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        ) : page?.content ? (
          <div className="prose prose-gray max-w-none bg-white rounded-2xl border border-gray-200 p-8" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <HardcodedTerms />
        )}
      </div>
    </div>
  );
}
