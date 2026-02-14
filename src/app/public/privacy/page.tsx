export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Gizlilik Politikasi ve KVKK</h1>
        <p className="text-sm text-gray-500 mb-8">Son guncelleme: Subat 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Veri Sorumlusu</h2>
            <p className="text-gray-600 leading-relaxed">
              degisimmentorluk.com (&quot;Platform&quot;) olarak, 6698 sayili Kisisel Verilerin Korunmasi Kanunu (&quot;KVKK&quot;) kapsaminda veri sorumlusu sifatiyla kisisel verilerinizi islemekteyiz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Toplanan Veriler</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Platformumuzu kullanirken asagidaki kisisel veriler toplanabilir:
            </p>
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
            <p className="text-gray-600 leading-relaxed mb-4">
              Kisisel verileriniz asagidaki amaclarla islenmektedir:
            </p>
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
              Kisisel verileriniz, hizmet saglayicilarimiz (odeme altyapisi, sunucu hizmeti) ile paylasabilir. Ucuncu taraflarla verileriniz sadece yasal zorunluluk halinde paylasılır. Kart bilgileriniz platformumuzda saklanmaz, Iyzico tarafindan guvenle islenir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Cerezler (Cookies)</h2>
            <p className="text-gray-600 leading-relaxed">
              Platformumuz, kullanici deneyimini iyilestirmek amaciyla cerezler kullanir. Oturum cerezleri, giris durumunuzu korumak icin gereklidir. Tarayici ayarlarinizdan cerez tercihlerinizi yonetebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Veri Guveniligi</h2>
            <p className="text-gray-600 leading-relaxed">
              Kisisel verilerinizin guvenligini saglamak icin SSL/TLS sifreleme, guvenli sunucu altyapisi ve erisim kontrolleri gibi teknik ve idari tedbirler uygulanmaktadir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. KVKK Kapsamindaki Haklariniz</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              KVKK&apos;nin 11. maddesi kapsaminda asagidaki haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Kisisel verilerinizin islenip islenmedigini ogrenme</li>
              <li>Islenmisse buna iliskin bilgi talep etme</li>
              <li>Isleme amacini ve amacina uygun kullanilip kullanilmadigini ogrenme</li>
              <li>Eksik veya yanlis islenmisse duzeltilmesini isteme</li>
              <li>Silinmesini veya yok edilmesini isteme</li>
              <li>Islenen verilerin ucuncu kisilere bildirilmesini isteme</li>
              <li>Aleyhine bir sonuc cikmasi halinde itiraz etme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Iletisim</h2>
            <p className="text-gray-600 leading-relaxed">
              KVKK kapsamindaki haklarinizi kullanmak veya sorulariniz icin{' '}
              <a href="mailto:destek@degisimmentorluk.com" className="text-primary-600 hover:underline">
                destek@degisimmentorluk.com
              </a>{' '}
              adresinden bize ulasabilirsiniz.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
