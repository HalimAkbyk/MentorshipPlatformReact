export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Gizlilik Politikası ve KVKK</h1>
        <p className="text-sm text-gray-500 mb-8">Son güncelleme: Şubat 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Veri Sorumlusu</h2>
            <p className="text-gray-600 leading-relaxed">
              degisimmentorluk.com (&quot;Platform&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi işlemekteyiz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Toplanan Veriler</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Platformumuzu kullanırken aşağıdaki kişisel veriler toplanabilir:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Kimlik bilgileri (ad, soyad)</li>
              <li>İletişim bilgileri (e-posta, telefon)</li>
              <li>Eğitim bilgileri (üniversite, bölüm, mezuniyet yılı)</li>
              <li>Ödeme bilgileri (Iyzico üzerinden işlenir, kart bilgileri saklanmaz)</li>
              <li>Kullanım verileri (oturum bilgileri, tercihler)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Verilerin İşlenmesi Amacı</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Üyelik ve hesap yönetimi</li>
              <li>Mentorluk hizmetinin sunulması</li>
              <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
              <li>İletişim ve destek hizmetleri</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Verilerin Aktarılması</h2>
            <p className="text-gray-600 leading-relaxed">
              Kişisel verileriniz, hizmet sağlayıcılarımız (ödeme altyapısı, sunucu hizmeti) ile paylaşabilir. Üçüncü taraflarla verileriniz sadece yasal zorunluluk halinde paylaşılır. Kart bilgileriniz platformumuzda saklanmaz, Iyzico tarafından güvenle işlenir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Cerezler (Cookies)</h2>
            <p className="text-gray-600 leading-relaxed">
              Platformumuz, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanır. Oturum çerezleri, giriş durumunuzu korumak için gereklidir. Tarayıcı ayarlarınızdan çerez tercihlerinizi yönetebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Veri Güvenliği</h2>
            <p className="text-gray-600 leading-relaxed">
              Kişisel verilerinizin güvenliğini sağlamak için SSL/TLS şifreleme, güvenli sunucu altyapısı ve erişim kontrolleri gibi teknik ve idari tedbirler uygulanmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. KVKK Kapsamındaki Haklarınız</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              KVKK&apos;nin 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>Silinmesini veya yok edilmesini isteme</li>
              <li>İşlenen verilerin üçüncü kişilere bildirilmesini isteme</li>
              <li>Aleyhine bir sonuç çıkması halinde itiraz etme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. İletişim</h2>
            <p className="text-gray-600 leading-relaxed">
              KVKK kapsamındaki haklarınızı kullanmak veya sorularınız için{' '}
              <a href="mailto:destek@degisimmentorluk.com" className="text-primary-600 hover:underline">
                destek@degisimmentorluk.com
              </a>{' '}
              adresinden bize ulaşabilirsiniz.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
