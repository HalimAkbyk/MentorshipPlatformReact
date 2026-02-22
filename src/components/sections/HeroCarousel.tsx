'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, TrendingUp, Users, Award, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { Button } from '@/components/ui/button';

/* Auth-aware CTA */
function useCta() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return { label: 'Ucretsiz Deneme Baslat', href: '/public/mentors' };
  }

  const roles = user.roles ?? [];

  if (roles.includes(UserRole.Mentor)) {
    return { label: 'Mentor Panelim', href: '/mentor/dashboard' };
  }
  if (roles.includes(UserRole.Student)) {
    return { label: 'Panelime Git', href: '/student/dashboard' };
  }

  return { label: 'Ucretsiz Deneme Baslat', href: '/public/mentors' };
}

/* Animation variants */
const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.3, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function HeroCarousel() {
  const cta = useCta();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50 pt-16 pb-24">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-teal-400 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-green-400 rounded-full blur-3xl opacity-15" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Promo badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500/10 to-green-500/10 backdrop-blur-sm rounded-full border border-teal-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
            </span>
            <span className="text-sm text-gray-700">
              Bu ay %20 indirim! Ilk 100 kayit icin gecerli
            </span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.h1
              variants={fadeInLeft}
              className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 mb-6 leading-tight"
            >
              Sana Uygun{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-green-600">
                Mentoru Bul
              </span>
              <br />
              Hedeflerine Ulas
            </motion.h1>

            <motion.p
              variants={fadeInLeft}
              className="text-lg text-gray-600 mb-8 leading-relaxed"
            >
              500+ uzman mentor arasindan sana en uygun olani sec. Bire bir gorusmeler,
              grup dersleri veya video kurslarla ogren. Mentorler kendi fiyatlarini belirliyor,
              sen tercih ediyorsun!
            </motion.p>

            <motion.div
              variants={fadeInLeft}
              className="flex flex-col sm:flex-row gap-3 mb-10"
            >
              <Link href={cta.href}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white shadow-lg shadow-teal-500/25 group px-8 w-full sm:w-auto"
                >
                  {cta.label}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/public/how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-teal-300 hover:border-teal-400 hover:bg-teal-50 group px-8 w-full sm:w-auto"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Demo Izle
                </Button>
              </Link>
            </motion.div>

            {/* Stats container */}
            <motion.div
              variants={fadeInLeft}
              className="grid grid-cols-3 gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-teal-100 shadow-lg"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <div className="text-2xl font-bold text-teal-600">2.5K+</div>
                </div>
                <div className="text-xs text-gray-600">Aktif Ogrenci</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-4 h-4 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">500+</div>
                </div>
                <div className="text-xs text-gray-600">Uzman Mentor</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <div className="text-2xl font-bold text-emerald-600">4.9/5</div>
                </div>
                <div className="text-xs text-gray-600">Memnuniyet</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column - Image with floating cards */}
          <motion.div
            variants={fadeInRight}
            initial="hidden"
            animate="visible"
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500 to-green-500 rounded-3xl opacity-20 blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
              alt="Ogrenciler"
              className="relative rounded-3xl shadow-2xl w-full object-cover h-[480px]"
            />
            {/* Floating card - Active users */}
            <motion.div
              className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-3"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <div className="text-sm font-medium text-gray-900">25 kisi su an aktif</div>
                  <div className="text-xs text-gray-500">Son 10 dk&apos;da 8 eslesme</div>
                </div>
              </div>
            </motion.div>
            {/* Floating card - Success match */}
            <motion.div
              className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-3"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Basarili Eslesme!</div>
                  <div className="text-xs text-gray-500">Ayse, frontend mentor buldu</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
