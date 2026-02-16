'use client';

import { motion, type Variants } from 'framer-motion';
import { Star } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTestimonials } from '@/lib/hooks/use-homepage';
import type { TestimonialDto } from '@/lib/api/homepage';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function TestimonialSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg animate-pulse">
      <div className="h-10 w-10 bg-lime-100 rounded mb-4" />
      <div className="space-y-2 mb-6">
        <div className="h-4 bg-navy-50 rounded w-full" />
        <div className="h-4 bg-navy-50 rounded w-5/6" />
        <div className="h-4 bg-navy-50 rounded w-4/6" />
      </div>
      <div className="h-8 bg-lime-50 rounded-lg w-2/3 mb-6" />
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-navy-50" />
        <div className="space-y-2">
          <div className="h-4 bg-navy-50 rounded w-24" />
          <div className="h-3 bg-navy-50 rounded w-32" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Star rating                                                        */
/* ------------------------------------------------------------------ */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-4 h-4"
          fill={i < rating ? '#FBBF24' : 'none'}
          stroke={i < rating ? '#FBBF24' : '#D1D5DB'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial card                                                   */
/* ------------------------------------------------------------------ */

function TestimonialCard({ testimonial }: { testimonial: TestimonialDto }) {
  const diff =
    testimonial.scoreBefore != null && testimonial.scoreAfter != null
      ? testimonial.scoreAfter - testimonial.scoreBefore
      : null;

  const initials = testimonial.studentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      variants={cardVariants}
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Decorative quote mark */}
      <div className="text-6xl font-serif text-lime-100 leading-none select-none mb-2">
        &ldquo;
      </div>

      {/* Quote */}
      <p className="text-navy-400 italic text-sm leading-relaxed mb-6">
        {testimonial.quote}
      </p>

      {/* Score improvement badge */}
      {diff != null && (
        <div className="inline-flex items-center gap-1.5 bg-lime-50 border border-lime-200 text-lime-700 text-sm font-medium rounded-lg px-3 py-1.5 mb-6">
          <span>TYT: {testimonial.scoreBefore} &rarr; {testimonial.scoreAfter}</span>
          <span className="font-bold">(+{diff})</span>
        </div>
      )}

      {/* Student info */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-16 h-16 border-[3px] border-lime-300">
          {testimonial.studentAvatar ? (
            <AvatarImage
              src={testimonial.studentAvatar}
              alt={testimonial.studentName}
            />
          ) : null}
          <AvatarFallback className="bg-navy-50 text-navy-600 font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="font-heading font-bold text-navy-600 text-sm truncate">
            {testimonial.studentName}
          </p>
          <p className="text-xs text-navy-300 truncate">
            {testimonial.university}
          </p>
        </div>
      </div>

      {/* Star rating */}
      <div className="mb-2">
        <StarRating rating={testimonial.rating} />
      </div>

      {/* Mentor attribution */}
      <p className="text-xs text-navy-300">
        Mentor: {testimonial.mentorName}
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function TestimonialCarousel() {
  const { data: testimonials, isLoading } = useTestimonials();

  return (
    <section className="py-20 bg-lime-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy-600">
            Ogrencilerimiz Ne Diyor?
          </h2>
          <p className="mt-4 text-navy-300 text-lg max-w-2xl mx-auto">
            Binlerce ogrenci mentorluk hizmeti ile hedeflerine ulasti
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <TestimonialSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {testimonials?.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
