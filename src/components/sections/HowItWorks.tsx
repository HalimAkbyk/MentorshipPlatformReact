'use client';

import { motion, type Variants } from 'framer-motion';
import { Search, CalendarCheck, Video, Star } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/* ------------------------------------------------------------------ */
/*  Step data                                                          */
/* ------------------------------------------------------------------ */

const steps = [
  {
    number: 1,
    icon: Search,
    title: 'Mentor Bul',
    description: 'Üniversite ve bölüme göre filtrele, sana uygun mentörü keşfet',
  },
  {
    number: 2,
    icon: CalendarCheck,
    title: 'Randevu Al',
    description: 'Uygun saati seç, güvenli ödeme yap',
  },
  {
    number: 3,
    icon: Video,
    title: 'Online Ders',
    description: 'Video konferans ile birebir ders al',
  },
  {
    number: 4,
    icon: Star,
    title: 'Değerlendir',
    description: 'Deneyimini paylaş, mentor hakkında yorum yap',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HowItWorks() {
  return (
    <section className="py-20 bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy-600">
            Nasıl Çalışır?
          </h2>
          <p className="mt-4 text-navy-300 text-lg max-w-2xl mx-auto">
            Dört basit adımda hedeflerine ulaşmaya başla
          </p>
        </div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6"
        >
          {/* Connecting line — horizontal on desktop */}
          <div
            className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 border-t-2 border-dashed border-teal-200"
            aria-hidden="true"
          />

          {/* Connecting line — vertical on mobile/tablet */}
          <div
            className="lg:hidden absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-teal-200"
            aria-hidden="true"
          />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={stepVariants}
                className="relative flex flex-col items-center text-center z-10"
              >
                {/* Step number circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-lime-500/25"
                  style={{ background: 'var(--gradient-cta)' }}
                >
                  {step.number}
                </div>

                {/* Icon container */}
                <div className="mt-5 w-12 h-12 rounded-2xl bg-navy-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-navy-600" />
                </div>

                {/* Title */}
                <h3 className="mt-4 font-heading font-bold text-navy-600 text-lg">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-navy-300 text-sm max-w-[220px]">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
