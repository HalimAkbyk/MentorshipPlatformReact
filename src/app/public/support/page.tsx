'use client';

import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStaticPage } from '@/lib/hooks/use-cms';

function HardcodedSupport() {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { icon: Mail, title: 'E-posta', content: 'Genel sorular ve destek için:', link: 'mailto:destek@degisimmentorluk.com', linkText: 'destek@degisimmentorluk.com', gradient: 'from-teal-500 to-cyan-500' },
          { icon: Phone, title: 'Telefon', content: 'Bizi arayın:', link: 'tel:+905331408819', linkText: '0 533 140 88 19', gradient: 'from-green-500 to-emerald-500' },
          { icon: MapPin, title: 'Adres', content: 'Sancaktepe / İstanbul', link: null, linkText: null, gradient: 'from-emerald-500 to-teal-500' },
          { icon: Clock, title: 'Çalışma Saatleri', content: 'Pzt-Cum: 09:00-18:00 | Cmt: 10:00-14:00', link: null, linkText: null, gradient: 'from-cyan-500 to-teal-500' },
        ].map((item, i) => (
          <Card key={i} className="border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">{item.content}</p>
              {item.link && item.linkText && (
                <a href={item.link} className="text-teal-600 hover:underline font-medium">
                  {item.linkText}
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 bg-gradient-to-br from-teal-50 to-green-50 border border-teal-200 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Hızlı Destek</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Sıkça sorulan sorular için{' '}
          <a href="/public/faq" className="text-teal-600 hover:underline font-medium">SSS sayfamızı</a>
          {' '}ziyaret edebilirsiniz. Cevabınızı bulamadınız mı? Bize e-posta gönderin, en kısa sürede döneceğiz.
        </p>
      </div>
    </>
  );
}

export default function SupportPage() {
  const { data: page, isLoading } = useStaticPage('destek');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">{page?.title || 'İletişim ve Destek'}</h1>
          <p className="text-teal-100 text-lg">Size yardımcı olmaktan mutluluk duyarız</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        {isLoading ? (
          <div className="animate-pulse grid md:grid-cols-2 gap-6">
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-40 bg-gray-200 rounded-xl" />
          </div>
        ) : page?.content ? (
          <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <HardcodedSupport />
        )}
      </div>
    </div>
  );
}
