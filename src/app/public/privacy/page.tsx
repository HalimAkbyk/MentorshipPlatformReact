'use client';

import { useStaticPage } from '@/lib/hooks/use-cms';

function HardcodedPrivacy() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">1. Veri Sorumlusu</h2>
        <p className="text-gray-600 leading-relaxed">
          degisimmentorluk.com (&quot;Platform&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi işlemekteyiz.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">2. Toplanan Veriler</h2>
        <p className="text-gray-600 leading-relaxed mb-4">Platformumuzu kullanırken aşağıdaki kişisel veriler toplanabilir:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Kimlik bilgileri (ad, soyad)</li>
          <li>İletişim bilgileri (e-posta, telefon)</li>
          <li>Eğitim bilgileri (üniversite, bölüm, mezuniyet yılı)</li>
          <li>Ödeme bilgileri (Iyzico üzerinden işlenir, kart bilgileri saklanmaz)</li>
          <li>Kullanım verileri (oturum bilgileri, tercihler)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">3. Verilerin İşlenmesi Amacı</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Üyelik ve hesap yönetimi</li>
          <li>Mentorluk hizmetinin sunulması</li>
          <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
          <li>İletişim ve destek hizmetleri</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">4. Verilerin Aktarılması</h2>
        <p className="text-gray-600 leading-relaxed">
          Kişisel verileriniz, hizmet sağlayıcılarımız (ödeme altyapısı, sunucu hizmeti) ile paylaşılabilir. Üçüncü taraflarla sadece yasal zorunluluk halinde paylaşılır.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">5. Çerezler (Cookies)</h2>
        <p className="text-gray-600 leading-relaxed">
          Platformumuz, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanır. Tarayıcı ayarlarınızdan çerez tercihlerinizi yönetebilirsiniz.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">6. Veri Güvenliği</h2>
        <p className="text-gray-600 leading-relaxed">
          SSL/TLS şifreleme, güvenli sunucu altyapısı ve erişim kontrolleri gibi teknik ve idari tedbirler uygulanmaktadır.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">7. KVKK Kapsamındaki Haklarınız</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
          <li>Silinmesini veya yok edilmesini isteme</li>
          <li>Aleyhine bir sonuç çıkması halinde itiraz etme</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-900">8. İletişim</h2>
        <p className="text-gray-600 leading-relaxed">
          KVKK kapsamındaki haklarınızı kullanmak için{' '}
          <a href="mailto:destek@degisimmentorluk.com" className="text-teal-600 hover:underline">destek@degisimmentorluk.com</a>
          {' '}adresinden bize ulaşabilirsiniz.
        </p>
      </section>
    </div>
  );
}

export default function PrivacyPage() {
  const { data: page, isLoading } = useStaticPage('gizlilik-politikasi');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">{page?.title || 'Gizlilik Politikası ve KVKK'}</h1>
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
          <HardcodedPrivacy />
        )}
      </div>
    </div>
  );
}
