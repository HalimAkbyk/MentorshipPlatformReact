import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Ücretlendirme</h1>
          <p className="text-xl text-gray-600">
            Şeffaf ve adil fiyatlandırma
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* For Students */}
          <Card>
            <CardHeader>
              <CardTitle>Danışanlar İçin</CardTitle>
              <CardDescription>
                Sadece aldığın dersler için öde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-3xl font-bold mb-2">
                  +%7 <span className="text-lg font-normal text-gray-600">platform bedeli</span>
                </div>
                <p className="text-sm text-gray-600">
                  Mentörün belirlediği fiyata ek olarak
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span>Ücretsiz kayıt</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span>Güvenli ödeme</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span>24 saat öncesine kadar iptal</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span>%100 iade garantisi</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* For Mentors */}
          <Card className="border-primary-200 bg-primary-50">
            <CardHeader>
              <CardTitle>Mentörler İçin</CardTitle>
              <CardDescription>
                Kendi ücretini sen belirle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-3xl font-bold mb-2">
                  %15 <span className="text-lg font-normal text-gray-600">komisyon</span>
                </div>
                <p className="text-sm text-gray-600">
                  Tamamlanan derslerden
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span>Ücretsiz kayıt ve profil</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span>Kendi fiyatını belirle</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span>Hızlı ödeme (24 saat)</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span>IBAN'a direkt transfer</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Sorularınız mı var? <Link href="/public/faq" className="text-primary-600 hover:underline">SSS</Link> sayfamızı ziyaret edin
          </p>
          <Link href="/auth/signup">
            <Button size="lg">Hemen Başla</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}