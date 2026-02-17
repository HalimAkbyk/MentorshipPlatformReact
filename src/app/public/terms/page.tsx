'use client';

import { useStaticPage } from '@/lib/hooks/use-cms';

function HardcodedTerms() {
  return (
    <div className="prose prose-gray max-w-none space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">1. Genel Hukumler</h2>
        <p className="text-gray-600 leading-relaxed">
          Bu kullanim sartlari, degisimmentorluk.com (&quot;Platform&quot;) uzerinden sunulan hizmetlerin kullanimina iliskin kosullari duzenler. Platformu kullanarak bu sartlari kabul etmis sayilirsiniz.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">2. Hizmet Tanimi</h2>
        <p className="text-gray-600 leading-relaxed">
          Platform, mentorler ile danisanlar (ogrenciler) arasinda online mentorluk hizmeti saglar. Mentorler bagimsiz hizmet saglayicilaridir ve Platform bir aracilik hizmeti sunmaktadir.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">3. Uyelik ve Hesap</h2>
        <p className="text-gray-600 leading-relaxed">
          Platforma uye olmak icin gecerli bir e-posta adresi ve dogru kisisel bilgiler gereklidir. Hesabinizin guvenliginden siz sorumlusunuz.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">4. Odeme ve Iade</h2>
        <p className="text-gray-600 leading-relaxed">
          Odemeler Iyzico altyapisi uzerinden guvenlice islenir. Ders baslama saatinden en az 24 saat once yapilan iptallerde tam iade yapilir. 24 saatten az kalan iptallerde iade yapilmaz.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">5. Mentor Sorumluluklari</h2>
        <p className="text-gray-600 leading-relaxed">
          Mentorler, belirledikleri saatlerde musait olmak, profesyonel bir tutum sergilemek ve platformun kurallarini takip etmekle yukumludur.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">6. Danisan Sorumluluklari</h2>
        <p className="text-gray-600 leading-relaxed">
          Danisanlar, randevularina zamaninda katilmak, mentorlere karsi saygi cercevesinde davranmak ve platform kurallarini takip etmekle yukumludur.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">7. Icerik ve Fikri Mulkiyet</h2>
        <p className="text-gray-600 leading-relaxed">
          Platformdaki tum icerikler (tasarim, logo, metin, yazilim) degisimmentorluk.com&apos;a aittir. Izinsiz kopyalanmasi veya dagitilmasi yasaktir.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">8. Iletisim</h2>
        <p className="text-gray-600 leading-relaxed">
          Bu sartlar hakkinda sorulariniz icin{' '}
          <a href="mailto:destek@degisimmentorluk.com" className="text-primary-600 hover:underline">destek@degisimmentorluk.com</a>
          {' '}adresinden bize ulasabilirsiniz.
        </p>
      </section>
    </div>
  );
}

export default function TermsPage() {
  const { data: page, isLoading } = useStaticPage('kullanim-sartlari');

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">{page?.title || 'Kullanim Sartlari'}</h1>
        <p className="text-sm text-gray-500 mb-8">Son guncelleme: Subat 2026</p>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        ) : page?.content ? (
          <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <HardcodedTerms />
        )}
      </div>
    </div>
  );
}
