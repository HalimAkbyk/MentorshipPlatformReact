import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupportPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-heading mb-4">İletişim ve Destek</h1>
          <p className="text-xl text-gray-600">
            Size yardımcı olmaktan mutluluk duyarız
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-500" />
                E-posta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">Genel sorular ve destek için:</p>
              <a
                href="mailto:destek@degisimmentorluk.com"
                className="text-primary-600 hover:underline font-medium"
              >
                destek@degisimmentorluk.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary-500" />
                Telefon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">Bizi arayın:</p>
              <a
                href="tel:+905331408819"
                className="text-primary-600 hover:underline font-medium"
              >
                0 533 140 88 19
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Adres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Sancaktepe / İstanbul
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                Çalışma Saatleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Pazartesi - Cuma: 09:00 - 18:00
              </p>
              <p className="text-gray-600">
                Cumartesi: 10:00 - 14:00
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 bg-primary-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold font-heading mb-4">Hızlı Destek</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Sıkça sorulan sorular için{' '}
            <a href="/public/faq" className="text-primary-600 hover:underline font-medium">
              SSS sayfamızı
            </a>{' '}
            ziyaret edebilirsiniz. Cevabınızı bulamadınız mı? Bize e-posta gönderin, en kısa sürede döneceğiz.
          </p>
        </div>
      </div>
    </div>
  );
}
