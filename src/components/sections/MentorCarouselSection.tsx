'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { MentorListItem } from '@/lib/types/models';

/* ────────────────────────── Props ────────────────────────── */

interface MentorCarouselSectionProps {
  title: string;
  icon: string;
  mentors: MentorListItem[];
  isLoading?: boolean;
  viewAllHref?: string;
}

/* ────────────────────── Framer variants ──────────────────── */

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

/* ──────────────────── Skeleton Card ──────────────────────── */

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[280px] rounded-2xl border border-navy-100 bg-white p-6 animate-pulse">
      {/* Avatar skeleton */}
      <div className="flex justify-center mb-4">
        <div className="w-[72px] h-[72px] rounded-full bg-navy-100" />
      </div>
      {/* Name */}
      <div className="h-5 w-32 mx-auto rounded bg-navy-100 mb-2" />
      {/* University */}
      <div className="h-4 w-40 mx-auto rounded bg-navy-50 mb-1" />
      {/* Department */}
      <div className="h-4 w-28 mx-auto rounded bg-navy-50 mb-3" />
      {/* Rating */}
      <div className="h-4 w-24 mx-auto rounded bg-navy-50 mb-4" />
      {/* Button */}
      <div className="h-9 w-full rounded-lg bg-navy-50" />
    </div>
  );
}

/* ──────────────────── Empty State ────────────────────────── */

function EmptyState() {
  return (
    <div className="flex items-center justify-center w-full py-16">
      <div className="text-center">
        <div className="text-4xl mb-3">🎓</div>
        <p className="text-navy-300 text-sm">
          Henüz mentor bulunamadı. Yakında burada olacaklar!
        </p>
      </div>
    </div>
  );
}

/* ──────────────────── Online Dot ─────────────────────────── */

/** Deterministic pseudo-random "online" status based on mentor id. */
function isOnline(userId: string): boolean {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 3 === 0; // ~33% appear online
}

/* ──────────────────── Mentor Card ────────────────────────── */

function MentorCard({ mentor }: { mentor: MentorListItem }) {
  const initials = mentor.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const online = useMemo(() => isOnline(mentor.userId), [mentor.userId]);

  return (
    <Link
      href={`/public/mentors/${mentor.userId}`}
      className="block flex-shrink-0 w-[280px] group"
    >
      <div
        className="relative rounded-2xl border border-navy-100 bg-white p-6 text-center
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          hover:-translate-y-1.5 hover:shadow-xl hover:border-lime-400"
      >
        {/* ── Avatar ── */}
        <div className="relative mx-auto mb-4 w-fit">
          <Avatar className="h-[72px] w-[72px] border-[3px] border-teal-100">
            {mentor.avatarUrl ? (
              <AvatarImage src={mentor.avatarUrl} alt={mentor.displayName} />
            ) : null}
            <AvatarFallback className="bg-teal-50 text-teal-600 text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Online dot */}
          {online && (
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white animate-pulse-dot" />
          )}

          {/* Verified badge */}
          {mentor.isVerified && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white">
              <BadgeCheck className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        {/* ── Info ── */}
        <h3 className="font-heading font-bold text-navy-600 text-base mb-1 truncate">
          {mentor.displayName}
        </h3>
        <p className="text-sm text-navy-300 truncate">{mentor.university}</p>
        <p className="text-sm text-navy-300 truncate mb-3">{mentor.department}</p>

        {/* ── Rating ── */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-navy-600">
            {mentor.ratingAvg.toFixed(1)}
          </span>
          <span className="text-xs text-navy-300">({mentor.ratingCount})</span>
        </div>

        {/* ── Price badge ── */}
        {mentor.hourlyRate != null && mentor.hourlyRate > 0 && (
          <div className="mb-4">
            <span className="inline-block rounded-lg bg-lime-50 px-3 py-1 text-sm font-semibold text-lime-700">
              {'\u20BA'}{mentor.hourlyRate}/saat
            </span>
          </div>
        )}

        {/* ── CTA ── */}
        <Button
          variant="outline"
          size="sm"
          className="w-full border-lime-400 text-lime-600 hover:bg-lime-50 hover:text-lime-700 font-semibold"
        >
          Profili Gör
        </Button>
      </div>
    </Link>
  );
}

/* ──────────────── Main Carousel Section ──────────────────── */

export default function MentorCarouselSection({
  title,
  icon,
  mentors,
  isLoading = false,
  viewAllHref,
}: MentorCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* ── Scroll state check ── */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, mentors]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -300 : 300;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  /* ── Render ── */
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" role="img" aria-hidden="true">
              {icon}
            </span>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-navy-600">
              {title}
            </h2>
          </div>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-lime-600 hover:text-lime-700 transition-colors"
            >
              Tümünü Gör
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Carousel wrapper */}
        <div className="relative group/carousel">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
                h-10 w-10 items-center justify-center rounded-full
                bg-white border border-navy-100 shadow-lg
                text-navy-400 hover:text-navy-600 hover:border-navy-200
                opacity-0 group-hover/carousel:opacity-100
                transition-all duration-200"
              aria-label="Sola kaydır"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
                h-10 w-10 items-center justify-center rounded-full
                bg-white border border-navy-100 shadow-lg
                text-navy-400 hover:text-navy-600 hover:border-navy-200
                opacity-0 group-hover/carousel:opacity-100
                transition-all duration-200"
              aria-label="Sağa kaydır"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory
              scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden"
          >
            {isLoading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="snap-start">
                  <SkeletonCard />
                </div>
              ))
            ) : mentors.length === 0 ? (
              <EmptyState />
            ) : (
              // Actual mentor cards with stagger animation
              <motion.div
                className="flex gap-5"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
              >
                {mentors.map((mentor) => (
                  <motion.div
                    key={mentor.userId}
                    variants={cardVariants}
                    className="snap-start"
                  >
                    <MentorCard mentor={mentor} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Mobile "View All" link */}
        {viewAllHref && (
          <div className="mt-4 sm:hidden text-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-sm font-semibold text-lime-600 hover:text-lime-700 transition-colors"
            >
              Tümünü Gör
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
