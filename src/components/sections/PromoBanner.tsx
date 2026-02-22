'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PromoBanner() {
  return (
    <section className="py-20 bg-gradient-to-br from-teal-600 via-green-600 to-emerald-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-white">Ilk seans ucretsiz! Para iade garantisi</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
            Kariyerinde Sicrama Yapmaya Hazir misin?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Bugun basla ve hayalindeki kariyere ulasmak icin gerekli rehberligi al.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-white text-teal-600 hover:bg-gray-100 shadow-xl group px-8 w-full sm:w-auto"
              >
                Ucretsiz Denemeyi Baslat
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/public/mentors">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 px-8 w-full sm:w-auto"
              >
                Mentorleri Incele
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
