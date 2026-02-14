import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { UserPlus, Search, Calendar, Video, Star, Shield } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Nasıl Çalışır?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            MentorHub ile hedef üniversiteni kazanmış öğrencilerden mentorluk almak çok kolay
          </p>
        </div>
      </section>

      {/* For Students */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Danışanlar İçin
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-primary-600" />
                </div>
                <CardTitle>1. Mentör Bul</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Üniversite ve bölüme göre filtrele, sana uygun mentörü keşfet
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary-600" />
                </div>
                <CardTitle>2. Randevu Al</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Uygun saati seç, güvenli ödeme yap, onay bekle
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-primary-600" />
                </div>
                <CardTitle>3. Ders Yap</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Online video konferans ile bire bir mentorluk al
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Mentors */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Mentörler İçin
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                  <UserPlus className="w-6 h-6 text-accent-600" />
                </div>
                <CardTitle>1. Kayıt Ol</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Profil oluştur, üniversite bilgilerini doğrula
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-accent-600" />
                </div>
                <CardTitle>2. Uygunluk Ekle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Takvimini ayarla, ücretini belirle, hizmete başla
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-accent-600" />
                </div>
                <CardTitle>3. Kazan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Mentorluk yap, değerlendirme al, kazanç elde et
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 text-primary-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">
              Güvenli ve Kolay
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Tüm mentörler doğrulanır, ödemeler güvenli bir şekilde saklanır ve
              ders tamamlandıktan sonra aktarılır. İptal ve iade kurallarımız
              her iki tarafı da korur.
            </p>
            <Link href="/auth/signup">
              <Button size="lg">Hemen Başla</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}