'use client';

import { motion, type Variants } from 'framer-motion';
import { Check, ChevronRight, TrendingUp, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: 0.15, ease: 'easeOut' },
  },
};

/* ------------------------------------------------------------------ */
/*  Floating stat cards (left visual)                                  */
/* ------------------------------------------------------------------ */

function FloatingCards() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-80">
      {/* Earnings card */}
      <motion.div
        className="absolute top-4 left-4 right-8 bg-white rounded-2xl shadow-xl p-6 border border-navy-100"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-lime-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-lime-600" />
          </div>
          <div>
            <p className="text-xs text-navy-300">Bu Ay</p>
            <p className="font-heading font-bold text-navy-600 text-sm">Kazanc</p>
          </div>
        </div>
        <p className="font-heading text-3xl font-extrabold text-navy-600">
          12,500+
          <span className="text-lg text-navy-300 font-normal ml-1">TL</span>
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-lime-600 text-xs font-semibold">
          <TrendingUp className="w-3.5 h-3.5" />
          +32% gecen aya gore
        </div>
      </motion.div>

      {/* Rating card */}
      <motion.div
        className="absolute bottom-4 right-4 left-8 bg-white rounded-2xl shadow-xl p-5 border border-navy-100"
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="font-heading font-bold text-navy-600">4.9</p>
            <p className="text-xs text-navy-300">Ortalama Puan</p>
          </div>
          <div className="ml-auto flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Background decorative elements */}
      <div
        className="absolute -top-3 -right-3 w-24 h-24 rounded-2xl bg-gradient-to-br from-lime-500/10 to-teal-400/10 border border-white/40"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-2 -left-2 w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400/10 to-lime-500/10 border border-white/40"
        aria-hidden="true"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth-aware CTA                                                     */
/* ------------------------------------------------------------------ */

function useMentorCta() {
  const { user, isAuthenticated } = useAuthStore();

  if (isAuthenticated && user) {
    const roles = user.roles ?? [];
    if (roles.includes(UserRole.Mentor)) {
      return { label: 'Mentor Panelim', href: '/mentor/dashboard' };
    }
  }

  return { label: 'Basvur', href: '/auth/signup?role=mentor' };
}

/* ------------------------------------------------------------------ */
/*  Checklist items                                                    */
/* ------------------------------------------------------------------ */

const checklistItems = [
  'Kendi fiyatini belirle',
  'Esnek calisma saatleri',
  'Guvenli odeme sistemi',
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function BecomeMentor() {
  const cta = useMentorCta();

  return (
    <section className="py-20 bg-navy-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Left: decorative cards */}
          <motion.div variants={fadeInLeft} className="hidden lg:block">
            <FloatingCards />
          </motion.div>

          {/* Right: content */}
          <motion.div variants={fadeInRight} className="space-y-6">
            {/* Badge */}
            <span className="inline-block bg-lime-100 text-lime-700 rounded-full px-4 py-1.5 text-sm font-semibold">
              Mentor Ol
            </span>

            {/* Headline */}
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy-600 leading-tight">
              Bilgini Paylas, Gelir Elde Et
            </h2>

            {/* Description */}
            <p className="text-navy-300 text-lg max-w-md">
              Uzmanlik alaninda ogrencilere yol goster, kendi programini olustur
              ve her dersen kazanc sagla.
            </p>

            {/* Checklist */}
            <ul className="space-y-3">
              {checklistItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-lime-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-lime-600" strokeWidth={3} />
                  </div>
                  <span className="text-navy-500 font-medium">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="pt-2">
              <Link href={cta.href}>
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-10 py-4 text-white font-semibold text-base shadow-lg shadow-lime-500/25 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-lime-500/30 active:scale-[0.98]"
                  style={{ background: 'var(--gradient-cta)' }}
                >
                  {cta.label}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
