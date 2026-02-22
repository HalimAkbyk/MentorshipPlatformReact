'use client';

import { Star } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTestimonials } from '@/lib/hooks/use-homepage';
import { Card } from '@/components/ui/card';
import type { TestimonialDto } from '@/lib/api/homepage';

/* ── Skeleton ── */
function TestimonialSkeleton() {
  return (
    <Card className="p-6 border-2 border-gray-100 animate-pulse">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="space-y-2 mb-5">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="space-y-1">
          <div className="h-4 bg-gray-100 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-32" />
        </div>
      </div>
    </Card>
  );
}

/* ── Testimonial Card (Figma) ── */
function TestimonialCard({ testimonial }: { testimonial: TestimonialDto }) {
  const initials = testimonial.studentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-6 border-2 border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all">
      {/* Star rating */}
      <div className="flex gap-1 mb-3">
        {[...Array(testimonial.rating)].map((_, j) => (
          <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {[...Array(5 - testimonial.rating)].map((_, j) => (
          <Star key={`empty-${j}`} className="w-4 h-4 text-gray-200" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-gray-700 mb-5 text-sm leading-relaxed italic">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Score improvement */}
      {testimonial.scoreBefore != null && testimonial.scoreAfter != null && (
        <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium rounded-lg px-3 py-1.5 mb-4">
          TYT: {testimonial.scoreBefore} &rarr; {testimonial.scoreAfter}
          <span className="font-bold">(+{testimonial.scoreAfter - testimonial.scoreBefore})</span>
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          {testimonial.studentAvatar ? (
            <AvatarImage src={testimonial.studentAvatar} alt={testimonial.studentName} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-green-500 text-white text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-sm font-medium text-gray-900">{testimonial.studentName}</div>
          <div className="text-xs text-gray-500">{testimonial.university}</div>
        </div>
      </div>

      {/* Mentor */}
      <p className="text-xs text-gray-500 mt-2">
        Mentor: {testimonial.mentorName}
      </p>
    </Card>
  );
}

/* ── Main Component ── */
export default function TestimonialCarousel() {
  const { data: testimonials, isLoading } = useTestimonials();

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Basari Hikayeleri</h2>
          <p className="text-lg text-gray-600">Binlerce ogrenci kariyerlerine bizimle yon veriyor</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <TestimonialSkeleton key={i} />)
            : testimonials?.map((t) => <TestimonialCard key={t.id} testimonial={t} />)
          }
        </div>
      </div>
    </section>
  );
}
