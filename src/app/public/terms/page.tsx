export default function TermsPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Kullanım Şartları</h1>
        <p className="text-sm text-gray-500 mb-8">Son güncelleme: Şubat 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Genel Hükümler</h2>
            <p className="text-gray-600 leading-relaxed">
              Bu kullanım şartları, degisimmentorluk.com (&quot;Platform&quot;) üzerinden sunulan hizmetlerin kullanımına ilişkin koşulları düzenler. Platformu kullanarak bu şartları kabul etmiş sayılırsınız.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Hizmet Tanımı</h2>
            <p className="text-gray-600 leading-relaxed">
              Platform, mentorler ile danışanlar (öğrenciler) arasında online mentorluk hizmeti sağlar. Mentorler bağımsız hizmet sağlayıcılarıdır ve Platform bir aracılık hizmeti sunmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Üyelik ve Hesap</h2>
            <p className="text-gray-600 leading-relaxed">
              Platforma üye olmak için geçerli bir e-posta adresi ve doğru kişisel bilgiler gereklidir.
              Hesabınızın güvenliğinden siz sorumlusunuz. Hesap bilgilerinizi üçüncü kişilerle paylaşmayınız.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Ödeme ve İade</h2>
            <p className="text-gray-600 leading-relaxed">
              Ödemeler Iyzico altyapısı üzerinden güvenlice işlenir. Ders başlama saatinden en az 24 saat önce yapılan iptallerde tam iade yapılır. 24 saatten az kalan iptallerde iade yapılmaz. Tamamlanan dersler için iade talep edilemez.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Mentor Sorumlulukları</h2>
            <p className="text-gray-600 leading-relaxed">
              Mentorler, belirledikleri saatlerde müsait olmak, profesyonel bir tutum sergilemek ve platformun kurallarını takip etmekle yükümlüdür. Mentorler bağımsız çalışanlardır ve Platform ile aralarında işçi-işveren ilişkisi bulunmamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Danışan Sorumlulukları</h2>
            <p className="text-gray-600 leading-relaxed">
              Danışanlar, randevularına zamanında katılmak, mentorlere karşı saygı çerçevesinde davranmak ve platform kurallarını takip etmekle yükümlüdür.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. İçerik ve Fikri Mülkiyet</h2>
            <p className="text-gray-600 leading-relaxed">
              Platformdaki tüm içerikler (tasarım, logo, metin, yazılım) degisimmentorluk.com&apos;a aittir. İzinsiz kopyalanması veya dağıtılması yasaktır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. İletişim</h2>
            <p className="text-gray-600 leading-relaxed">
              Bu şartlar hakkında sorularınız için{' '}
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
