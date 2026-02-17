'use client';

import { motion } from 'framer-motion';
import {
  Search,
  ChevronRight,
  GraduationCap,
  Star,
  Users,
  CheckCircle2,
  BookOpen,
  Video,
  CalendarCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

const scaleInRight = {
  hidden: { opacity: 0, scale: 0.88, x: 30 },
  visible: { opacity: 1, scale: 1, x: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/* ------------------------------------------------------------------ */
/*  Helper: auth-aware CTA                                             */
/* ------------------------------------------------------------------ */

function useCta() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return { label: 'Paketleri İncele', href: '/public/courses' };
  }

  const roles = user.roles ?? [];

  if (roles.includes(UserRole.Mentor)) {
    return { label: 'Mentor Panelim', href: '/mentor/dashboard' };
  }
  if (roles.includes(UserRole.Student)) {
    return { label: 'Panelime Git', href: '/student/dashboard' };
  }

  return { label: 'Paketleri İncele', href: '/public/courses' };
}

/* ------------------------------------------------------------------ */
/*  Animated "How It Works" steps (right column)                       */
/* ------------------------------------------------------------------ */

interface HowStep {
  num: number;
  icon: LucideIcon;
  title: string;
  desc: string;
  products: string[];
  gradient: string;
  iconBg: string;
}

const HOW_STEPS: HowStep[] = [
  {
    num: 1,
    icon: Search,
    title: 'Keşfet & Seç',
    desc: 'İhtiyacına uygun eğitim ürününü bul. Mentorları incele, kurslara göz at veya grup derslerini keşfet.',
    products: ['1:1 Ders', 'Video Kurs', 'Grup Dersi'],
    gradient: 'from-lime-500 to-lime-600',
    iconBg: 'bg-lime-50 text-lime-600',
  },
  {
    num: 2,
    icon: CalendarCheck,
    title: 'Planla & Kayıt Ol',
    desc: 'Uygun zamanı seç, ödeme yap ve hemen başla. Güvenli ödeme altyapısıyla tek tıkla kayıt ol.',
    products: ['Esnek Takvim', 'Güvenli Ödeme', 'Anında Erişim'],
    gradient: 'from-teal-400 to-teal-500',
    iconBg: 'bg-teal-50 text-teal-600',
  },
  {
    num: 3,
    icon: Sparkles,
    title: 'Öğren & Gelişim',
    desc: 'Canlı derslerle bire bir öğren, video kurslarla kendi hızında ilerle, sınavlarla kendini test et.',
    products: ['Canlı Video', 'İlerleme Takibi', 'Sertifika'],
    gradient: 'from-violet-500 to-violet-600',
    iconBg: 'bg-violet-50 text-violet-600',
  },
];

function DecorativeVisual() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % HOW_STEPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const step = HOW_STEPS[activeStep];

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Main card */}
      <div className="relative rounded-2xl bg-white/80 backdrop-blur-sm border border-navy-100 shadow-xl p-6 space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-navy-600 text-sm">Nasıl Çalışır?</p>
            <p className="text-xs text-navy-300">3 adımda başla</p>
          </div>
        </div>

        {/* Animated step content */}
        <div className="relative min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="space-y-4"
            >
              {/* Step number + icon */}
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-md`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy-300 uppercase tracking-wider">
                      Adım {step.num}
                    </span>
                  </div>
                  <p className="font-heading font-bold text-navy-600 text-base">
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-navy-400 leading-relaxed">
                {step.desc}
              </p>

              {/* Product tags */}
              <div className="flex flex-wrap gap-2">
                {step.products.map((product) => (
                  <span
                    key={product}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${step.iconBg}`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {product}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {HOW_STEPS.map((s, i) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(i)}
              className={`transition-all duration-300 rounded-full ${
                i === activeStep
                  ? 'w-8 h-2.5 bg-gradient-to-r from-lime-500 to-teal-400'
                  : 'w-2.5 h-2.5 bg-navy-200 hover:bg-navy-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating accent elements */}
      <motion.div
        className="absolute -top-4 -right-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-400/20 to-lime-500/20 backdrop-blur-sm border border-white/40"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-3 -left-3 h-14 w-14 rounded-xl bg-gradient-to-br from-lime-500/20 to-violet-400/20 backdrop-blur-sm border border-white/40"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Social proof badges                                                */
/* ------------------------------------------------------------------ */

const proofItems = [
  { text: '2.500+ öğrenci', icon: Users },
  { text: '300+ mentor', icon: BookOpen },
  { text: '%94 memnuniyet', icon: Star },
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function HeroCarousel() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const cta = useCta();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/public/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section
      className="relative overflow-hidden bg-[var(--bg-hero)]"
      style={{ minHeight: 520 }}
    >
      {/* Mesh gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--gradient-mesh)' }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Left column: text ── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Headline */}
            <motion.h1
              variants={fadeInLeft}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-navy-600 leading-tight"
            >
              YKS&apos;de{' '}
              <span className="text-lime-500">Fark Yarat</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInLeft}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-lg text-navy-300 max-w-lg"
            >
              Türkiye&apos;nin en iyi mentorlarından birebir destek al,
              video derslerle hazırlan ve hedefine bir adım daha yaklaş.
            </motion.p>

            {/* Search bar */}
            <motion.form
              variants={fadeInLeft}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              onSubmit={handleSearch}
              className="relative max-w-lg"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-navy-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ders veya mentor ara..."
                  className="
                    w-full h-14 pl-12 pr-4 rounded-2xl
                    bg-white border border-navy-100
                    text-navy-600 placeholder:text-navy-200
                    focus:outline-none focus:border-lime-500
                    focus:ring-2 focus:ring-lime-500/20
                    transition-all duration-200
                    text-base
                  "
                />
              </div>
            </motion.form>

            {/* CTA button */}
            <motion.div
              variants={fadeInLeft}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Link href={cta.href}>
                <button
                  className="
                    inline-flex items-center gap-2
                    rounded-xl px-8 py-4
                    text-white font-semibold text-base
                    shadow-lg shadow-lime-500/25
                    transition-all duration-200
                    hover:scale-[1.03] hover:shadow-xl hover:shadow-lime-500/30
                    active:scale-[0.98]
                  "
                  style={{ background: 'var(--gradient-cta)' }}
                >
                  {cta.label}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </Link>
            </motion.div>

            {/* Social proof badges */}
            <motion.div
              variants={stagger}
              className="flex flex-wrap gap-4 pt-2"
            >
              {proofItems.map((item) => (
                <motion.div
                  key={item.text}
                  variants={fadeInUp}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex items-center gap-2 text-sm text-navy-400"
                >
                  <CheckCircle2 className="h-4.5 w-4.5 text-lime-500 flex-shrink-0" />
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right column: decorative visual (hidden on small screens) ── */}
          <motion.div
            variants={scaleInRight}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            className="hidden lg:block"
          >
            <DecorativeVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
