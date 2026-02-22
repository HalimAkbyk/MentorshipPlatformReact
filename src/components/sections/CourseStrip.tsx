'use client';

import { Star, BookOpen, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getCoverImageStyle } from '@/components/ui/cover-image-editor';
import { useFeaturedCourses } from '@/lib/hooks/use-homepage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PublicCourseDto } from '@/lib/types/models';

/* ── Helpers ── */
function formatDuration(totalSec: number): string {
  if (!totalSec || totalSec <= 0) return '0 dk';
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours} saat ${minutes} dk`;
  if (hours > 0) return `${hours} saat`;
  return `${minutes} dk`;
}

function formatPrice(price: number): string {
  if (!price || price === 0) return 'Ucretsiz';
  return `₺${price.toLocaleString('tr-TR')}`;
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    Beginner: 'Baslangic',
    Intermediate: 'Orta',
    Advanced: 'Ileri',
    AllLevels: 'Tum Seviyeler',
  };
  return map[level] ?? level;
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <Card className="overflow-hidden border border-gray-200 animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded" />
          <div className="h-5 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
        <div className="h-4 w-1/3 bg-gray-100 rounded" />
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <div className="h-6 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </Card>
  );
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center col-span-full">
      <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-gray-300" />
      </div>
      <p className="text-gray-600 font-medium">Henuz egitim bulunmuyor.</p>
      <p className="text-sm text-gray-500 mt-1">Yakinda yeni egitimler eklenecek.</p>
    </div>
  );
}

/* ── Course Card (Figma) ── */
function CourseCard({ course }: { course: PublicCourseDto }) {
  return (
    <Link href={`/public/courses/${course.id}`} className="block group">
      <Card className="overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 h-full">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          {course.coverImageUrl ? (
            <img
              src={course.coverImageUrl}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={getCoverImageStyle(course.coverImagePosition, course.coverImageTransform)}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-teal-400/30 via-green-500/20 to-emerald-400/30 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-gray-300" />
            </div>
          )}
          {/* Discount badge */}
          {course.originalPrice && course.originalPrice > course.price && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white rounded-md text-xs font-medium">
              %{Math.round((1 - course.price / course.originalPrice) * 100)} Indirim
            </div>
          )}
          {/* Level badge */}
          {course.level && (
            <span className="absolute top-3 left-3 px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs font-medium">
              {levelLabel(course.level)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />{formatDuration(course.totalDurationSec)}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />{course.totalLectures} ders
            </span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">{course.title}</h3>
          <p className="text-sm text-gray-600 mb-3 truncate">{course.mentorName}</p>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">{course.ratingAvg > 0 ? course.ratingAvg.toFixed(1) : '--'}</span>
            {course.ratingCount > 0 && (
              <span className="text-xs text-gray-500">({course.ratingCount})</span>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${!course.price || course.price === 0 ? 'text-teal-600' : 'text-gray-900'}`}>
                {formatPrice(course.price)}
              </span>
              {course.originalPrice && course.originalPrice > course.price && (
                <span className="text-sm text-gray-400 line-through">₺{course.originalPrice.toLocaleString('tr-TR')}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ── Main Component ── */
export default function CourseStrip() {
  const { data: courses, isLoading, isError } = useFeaturedCourses();

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Populer Kurslar</h2>
          <p className="text-lg text-gray-600">Mentorlerimizin hazirladigi en cok tercih edilen kurslar</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : !courses || courses.length === 0 || isError ? (
            <EmptyState />
          ) : (
            courses.slice(0, 6).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))
          )}
        </div>

        <div className="text-center mt-10">
          <Link href="/public/courses">
            <Button size="lg" variant="outline" className="border-2 border-teal-300 hover:bg-teal-50 gap-2">
              Tum Kurslari Gor
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
