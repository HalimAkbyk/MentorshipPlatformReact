import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


import { Search, Calendar, Video, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Derece Yapan Öğrencilerle
          <br />
          <span className="text-primary-600">Birebir Mentorluk</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Hedef üniversiteni kazanmış öğrencilerden bire bir mentorluk al.
          Program çıkarma, deneme analizi ve motivasyon desteği.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/mentors">
            <Button size="lg" className="w-full sm:w-auto">
              Mentör Bul
            </Button>
          </Link>
          <Link href="/signup?role=mentor">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Mentör Ol
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nasıl Çalışır?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Search className="w-12 h-12 text-primary-600 mb-4" />
                <CardTitle>1. Mentör Bul</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Üniversite ve bölüme göre filtrele, sana uygun mentörü bul
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="w-12 h-12 text-primary-600 mb-4" />
                <CardTitle>2. Randevu Al</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Uygun saati seç, güvenli ödeme yap
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Video className="w-12 h-12 text-primary-600 mb-4" />
                <CardTitle>3. Ders Yap</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Online video konferans ile bire bir ders al
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Star className="w-12 h-12 text-primary-600 mb-4" />
                <CardTitle>4. Değerlendir</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Deneyimini paylaş, yorum yap
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Hedefine Ulaşmak İçin İlk Adımı At</h2>
        <p className="text-gray-600 mb-8">
          Binlerce öğrenci mentorluk desteği ile hedef üniversitesini kazandı
        </p>
        <Link href="/public/mentors">
          <Button size="lg">Mentörleri Keşfet</Button>
        </Link>
      </section>

      
    </div>
  );
}