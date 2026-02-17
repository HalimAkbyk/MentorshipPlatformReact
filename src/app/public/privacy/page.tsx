'use client';

import { useStaticPage } from '@/lib/hooks/use-cms';

function HardcodedPrivacy() {
  return (
    <div className="prose prose-gray max-w-none space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">1. Veri Sorumlusu</h2>
        <p className="text-gray-600 leading-relaxed">
          degisimmentorluk.com (&quot;Platform&quot;) olarak, 6698 sayili Kisisel Verilerin Korunmasi Kanunu (&quot;KVKK&quot;) kapsaminda veri sorumlusu sifatiyla kisisel verilerinizi islemekteyiz.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">2. Toplanan Veriler</h2>
        <p className="text-gray-600 leading-relaxed mb-4">Platformumuzu kullanirken asagidaki kisisel veriler toplanabilir:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Kimlik bilgileri (ad, soyad)</li>
          <li>Iletisim bilgileri (e-posta, telefon)</li>
          <li>Egitim bilgileri (universite, bolum, mezuniyet yili)</li>
          <li>Odeme bilgileri (Iyzico uzerinden islenir, kart bilgileri saklanmaz)</li>
          <li>Kullanim verileri (oturum bilgileri, tercihler)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">3. Verilerin Islenmesi Amaci</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Uyelik ve hesap yonetimi</li>
          <li>Mentorluk hizmetinin sunulmasi</li>
          <li>Odeme islemlerinin gerceklestirilmesi</li>
          <li>Iletisim ve destek hizmetleri</li>
          <li>Yasal yukumluluklerin yerine getirilmesi</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">4. Verilerin Aktarilmasi</h2>
        <p className="text-gray-600 leading-relaxed">
          Kisisel verileriniz, hizmet saglayicilarimiz (odeme altyapisi, sunucu hizmeti) ile paylasabilir. Ucuncu taraflarla sadece yasal zorunluluk halinde paylasilir.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">5. Cerezler (Cookies)</h2>
        <p className="text-gray-600 leading-relaxed">
          Platformumuz, kullanici deneyimini iyilestirmek amaciyla cerezler kullanir. Tarayici ayarlarinizdan cerez tercihlerinizi yonetebilirsiniz.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">6. Veri Guvenligi</h2>
        <p className="text-gray-600 leading-relaxed">
          SSL/TLS sifreleme, guvenli sunucu altyapisi ve erisim kontrolleri gibi teknik ve idari tedbirler uygulanmaktadir.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">7. KVKK Kapsamindaki Haklariniz</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Kisisel verilerinizin islenip islenmedigini ogrenme</li>
          <li>Islenmisse buna iliskin bilgi talep etme</li>
          <li>Eksik veya yanlis islenmisse duzeltilmesini isteme</li>
          <li>Silinmesini veya yok edilmesini isteme</li>
          <li>Aleyhine bir sonuc cikmasi halinde itiraz etme</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4">8. Iletisim</h2>
        <p className="text-gray-600 leading-relaxed">
          KVKK kapsamindaki haklarinizi kullanmak icin{' '}
          <a href="mailto:destek@degisimmentorluk.com" className="text-primary-600 hover:underline">destek@degisimmentorluk.com</a>
          {' '}adresinden bize ulasabilirsiniz.
        </p>
      </section>
    </div>
  );
}

export default function PrivacyPage() {
  const { data: page, isLoading } = useStaticPage('gizlilik-politikasi');

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">{page?.title || 'Gizlilik Politikasi ve KVKK'}</h1>
        <p className="text-sm text-gray-500 mb-8">Son guncelleme: Subat 2026</p>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        ) : page?.content ? (
          <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <HardcodedPrivacy />
        )}
      </div>
    </div>
  );
}
