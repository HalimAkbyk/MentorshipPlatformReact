'use client';

import { motion, type Variants } from 'framer-motion';
import { Users, GraduationCap, Star, Video } from 'lucide-react';
import { useCountUp } from '@/lib/hooks/use-count-up';
import { usePlatformStatistics } from '@/lib/hooks/use-homepage';
import type { LucideIcon } from 'lucide-react';

/* ────────────────────────── Types ────────────────────────── */

interface StatItemConfig {
  icon: LucideIcon;
  label: string;
  key: 'totalStudents' | 'activeMentors' | 'averageRating' | 'totalSessions';
  suffix?: string;
  decimals?: number;
}

/* ────────────────────── Stat definitions ─────────────────── */

const STAT_ITEMS: StatItemConfig[] = [
  {
    icon: Users,
    label: 'Mutlu Ogrenci',
    key: 'totalStudents',
    suffix: '+',
  },
  {
    icon: GraduationCap,
    label: 'Aktif Mentor',
    key: 'activeMentors',
    suffix: '+',
  },
  {
    icon: Star,
    label: 'Ortalama Puan',
    key: 'averageRating',
    decimals: 1,
  },
  {
    icon: Video,
    label: 'Tamamlanan Ders',
    key: 'totalSessions',
    suffix: '+',
  },
];

/* ───────────────────── Framer variants ───────────────────── */

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/* ──────────────────── Single Stat Cell ───────────────────── */

interface StatCellProps {
  icon: LucideIcon;
  label: string;
  end: number;
  suffix?: string;
  decimals?: number;
}

function StatCell({ icon: Icon, label, end, suffix = '', decimals = 0 }: StatCellProps) {
  const { ref, formattedValue } = useCountUp({
    end,
    duration: 2000,
    decimals,
    suffix,
  });

  return (
    <motion.div variants={itemVariants} className="text-center py-4 md:py-0">
      <div ref={ref} className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white/[0.06]">
          <Icon className="h-8 w-8 text-lime-400" />
        </div>
        <span className="font-heading text-4xl md:text-5xl font-extrabold text-white tabular-nums tracking-tight">
          {formattedValue}
        </span>
        <span className="text-sm text-navy-300">{label}</span>
      </div>
    </motion.div>
  );
}

/* ──────────────────── Skeleton Loader ────────────────────── */

function StatSkeleton() {
  return (
    <div className="text-center py-4 md:py-0 animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-white/[0.06]" />
        <div className="h-10 w-24 rounded bg-white/[0.06]" />
        <div className="h-4 w-20 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

/* ────────────────── Main StatsSection ────────────────────── */

export default function StatsSection() {
  const { data: stats, isLoading } = usePlatformStatistics();

  return (
    <section
      className="py-16 md:py-20 relative overflow-hidden"
      style={{ background: 'var(--gradient-stats)' }}
    >
      {/* Subtle decorative glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 bg-lime-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-teal-400/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {isLoading || !stats
            ? STAT_ITEMS.map((item) => <StatSkeleton key={item.key} />)
            : STAT_ITEMS.map((item) => (
                <StatCell
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  end={stats[item.key]}
                  suffix={item.suffix}
                  decimals={item.decimals}
                />
              ))}
        </motion.div>
      </div>
    </section>
  );
}
