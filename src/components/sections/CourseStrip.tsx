'use client';

import { motion } from 'framer-motion';
import { getCoverImageStyle } from '@/components/ui/cover-image-editor';
import { Star, BookOpen, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useFeaturedCourses } from '@/lib/hooks/use-homepage';
import type { PublicCourseDto } from '@/lib/types/models';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDuration(totalSec: number): string {
  if (!totalSec || totalSec <= 0) return '0 dk';
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours} saat ${minutes} dk`;
  if (hours > 0) return `${hours} saat`;
  return `${minutes} dk`;
}

function formatPrice(price: number): string {
  if (!price || price === 0) return 'Ücretsiz';
  return `₺${price.toLocaleString('tr-TR')}`;
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    Beginner: 'Başlangıç',
    Intermediate: 'Orta',
    Advanced: 'İleri',
    AllLevels: 'Tüm Seviyeler',
  };
  return map[level] ?? level;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/* ------------------------------------------------------------------ */
/*  Skeleton card                                                      */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="w-[280px] lg:w-full flex-shrink-0 rounded-xl border border-navy-100 bg-white overflow-hidden">
      {/* Image placeholder */}
      <div className="h-[158px] bg-gradient-to-br from-navy-50 to-navy-100 animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)]" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-navy-100 animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)]" />
        <div className="h-4 w-1/2 rounded bg-navy-50 animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)]" />
        <div className="h-3 w-2/3 rounded bg-navy-50 animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)]" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-3 w-20 rounded bg-navy-50 animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)]" />
          <div className="h-5 w-16 rounded bg-navy-100 animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)]" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Course card                                                        */
/* ------------------------------------------------------------------ */

function CourseCard({ course }: { course: PublicCourseDto }) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <Link href={`/public/courses/${course.id}`} className="block group">
        <div
          className="
            w-[280px] lg:w-full flex-shrink-0 rounded-xl
            border border-navy-100 bg-white
            shadow-sm overflow-hidden
            transition-all duration-300
            group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-lime-400
          "
        >
          {/* Cover image */}
          <div className="relative h-[158px] overflow-hidden">
            {course.coverImageUrl ? (
              <img
                src={course.coverImageUrl}
                alt={course.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                style={getCoverImageStyle(course.coverImagePosition, course.coverImageTransform)}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-teal-400/30 via-lime-500/20 to-sage-400/30 flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-navy-200" />
              </div>
            )}

            {/* Level badge */}
            {course.level && (
              <span className="absolute top-2.5 left-2.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-lime-50/90 text-lime-700 backdrop-blur-sm">
                {levelLabel(course.level)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-2.5">
            {/* Title */}
            <h3 className="font-heading font-bold text-navy-600 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
              {course.title}
            </h3>

            {/* Mentor */}
            <p className="text-xs text-navy-300 truncate">
              {course.mentorName}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-amber-600">
                {course.ratingAvg > 0 ? course.ratingAvg.toFixed(1) : '--'}
              </span>
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              {course.ratingCount > 0 && (
                <span className="text-xs text-navy-300">
                  ({course.ratingCount.toLocaleString('tr-TR')})
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-navy-300">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {course.totalLectures} ders
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(course.totalDurationSec)}
              </span>
            </div>

            {/* Price */}
            <div className="pt-1 border-t border-navy-50">
              <span
                className={`text-lg font-bold ${
                  !course.price || course.price === 0
                    ? 'text-lime-600'
                    : 'text-navy-600'
                }`}
              >
                {formatPrice(course.price)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-navy-50 flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-navy-200" />
      </div>
      <p className="text-navy-400 font-medium">Henüz eğitim bulunmuyor.</p>
      <p className="text-sm text-navy-300 mt-1">
        Yakında yeni eğitimler eklenecek.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function CourseStrip() {
  const { data: courses, isLoading, isError } = useFeaturedCourses();

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-navy-600">
              Popüler Eğitimler
            </h2>
            <p className="text-navy-300 mt-1 text-sm">
              En çok tercih edilen video eğitimler
            </p>
          </div>
          <Link
            href="/public/courses"
            className="
              hidden sm:inline-flex items-center gap-1
              text-sm font-semibold text-lime-600
              hover:text-lime-700 transition-colors
            "
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error / empty */}
        {!isLoading && (isError || !courses || courses.length === 0) && (
          <EmptyState />
        )}

        {/* Course cards */}
        {!isLoading && courses && courses.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="
              flex gap-5 overflow-x-auto pb-4
              scrollbar-thin
              lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0
            "
          >
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </motion.div>
        )}

        {/* Mobile "see all" link */}
        <div className="mt-6 sm:hidden text-center">
          <Link
            href="/public/courses"
            className="inline-flex items-center gap-1 text-sm font-semibold text-lime-600 hover:text-lime-700 transition-colors"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
