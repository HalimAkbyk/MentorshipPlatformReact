'use client';

import { motion, type Variants } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' },
  },
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function PromoBanner() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative overflow-hidden rounded-3xl p-8 md:p-12"
          style={{ background: 'var(--gradient-promo)' }}
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left content */}
            <motion.div variants={fadeInLeft} className="space-y-5">
              {/* Badge */}
              <span className="inline-block bg-white/20 text-white rounded-full px-4 py-1 text-sm font-medium backdrop-blur-sm">
                Özel Teklif
              </span>

              {/* Headline */}
              <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white leading-tight">
                İlk Dersin Ücretsiz!
              </h2>

              {/* Subtitle */}
              <p className="text-white/90 text-lg max-w-md">
                Hemen kayıt ol ve ilk mentorluk seansını ücretsiz dene.
              </p>

              {/* CTA */}
              <Link href="/auth/signup">
                <button className="inline-flex items-center gap-2 bg-white text-navy-600 hover:bg-lime-50 rounded-xl px-8 py-4 font-semibold text-base transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] mt-2">
                  Ücretsiz Dene
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
            </motion.div>

            {/* Right decorative shapes */}
            <motion.div
              variants={fadeInRight}
              className="hidden lg:flex items-center justify-center relative h-64"
              aria-hidden="true"
            >
              {/* Large circle */}
              <div className="absolute w-48 h-48 rounded-full bg-white/10" />

              {/* Medium circle offset */}
              <div className="absolute -top-4 right-12 w-32 h-32 rounded-full bg-white/[0.07]" />

              {/* Small circle */}
              <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-white/15" />

              {/* Tiny accent circle */}
              <div className="absolute top-8 left-8 w-12 h-12 rounded-full bg-white/20" />

              {/* Ring */}
              <div className="absolute bottom-8 left-16 w-28 h-28 rounded-full border-2 border-white/15" />
            </motion.div>
          </div>

          {/* Background decorative circles (visible on all sizes) */}
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.06]"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/[0.05]"
            aria-hidden="true"
          />
        </motion.div>
      </div>
    </section>
  );
}
