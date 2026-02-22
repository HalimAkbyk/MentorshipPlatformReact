'use client';

import { useState, useCallback } from 'react';
import { getCoverImageStyle } from '@/components/ui/cover-image-editor';
import { useRouter } from 'next/navigation';
import { Search, Star, ChevronLeft, ChevronRight, BookOpen, Clock, SlidersHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePublicCourses } from '@/lib/hooks/use-courses';
import { CourseLevel } from '@/lib/types/enums';
import { ROUTES } from '@/lib/constants/routes';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { useCategoryNames } from '@/lib/hooks/use-categories';

const levelOptions = [
  { value: '', label: 'Tüm Seviyeler' },
  { value: CourseLevel.Beginner, label: 'Başlangıç' },
  { value: CourseLevel.Intermediate, label: 'Orta' },
  { value: CourseLevel.Advanced, label: 'İleri' },
  { value: CourseLevel.AllLevels, label: 'Tüm Seviyeler' },
];

const sortOptions = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'popular', label: 'En Popüler' },
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'price-asc', label: 'Fiyat (Düşükten Yükseğe)' },
  { value: 'price-desc', label: 'Fiyat (Yüksekten Düşüğe)' },
];

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}s ${minutes}dk`;
  }
  return `${minutes}dk`;
}

export default function CourseCatalogPage() {
  const router = useRouter();
  const categoryNames = useCategoryNames('Course');
  const categoryOptions = [
    { value: '', label: 'Tüm Kategoriler' },
    ...categoryNames.map((name) => ({ value: name, label: name })),
  ];
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data, isLoading } = usePublicCourses({
    search: search || undefined,
    category: category || undefined,
    level: level || undefined,
    sortBy,
    page,
    pageSize,
  });

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Search */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white text-center">
            Kurs Kataloğu
          </h1>
          <p className="text-teal-100 text-center mb-8 max-w-2xl mx-auto">
            Uzman eğitmenlerden öğrenerek kendinizi geliştirin
          </p>

          <div className="bg-white rounded-xl shadow-lg p-3 flex flex-col sm:flex-row items-center gap-3 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 flex-1 w-full">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Kurs adı, eğitmen veya konu ara..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 outline-none text-gray-700 placeholder-gray-400 w-full"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none flex-1 sm:flex-none focus:ring-2 focus:ring-teal-300"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white">Ara</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <SlidersHorizontal className="w-5 h-5 text-teal-600" />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
          >
            {levelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {data && (
            <span className="ml-auto text-sm text-gray-500">
              {data.totalCount} kurs bulundu
            </span>
          )}
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-44 bg-gray-200" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.items.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden border border-gray-200 hover:border-teal-300 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => router.push(ROUTES.COURSE_DETAIL(course.id))}
              >
                {/* Cover Image */}
                <div className="relative h-44 overflow-hidden">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={getCoverImageStyle(course.coverImagePosition, course.coverImageTransform)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-green-600 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  {/* Level Badge */}
                  <Badge className="absolute top-2 left-2 bg-teal-50 text-teal-700 border border-teal-200 text-xs">
                    {course.level === CourseLevel.Beginner && 'Başlangıç'}
                    {course.level === CourseLevel.Intermediate && 'Orta'}
                    {course.level === CourseLevel.Advanced && 'İleri'}
                    {course.level === CourseLevel.AllLevels && 'Tüm Seviyeler'}
                  </Badge>
                </div>

                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-teal-600 transition-colors">
                    {course.title}
                  </h3>
                  {course.shortDescription && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {course.shortDescription}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mb-3">{course.mentorName}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-gray-900">
                      {course.ratingAvg.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({course.ratingCount})
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.totalLectures} ders
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(course.totalDurationSec)}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {course.price === 0 ? (
                        <span className="text-green-600">Ücretsiz</span>
                      ) : (
                        formatCurrency(course.price, course.currency)
                      )}
                    </span>
                    <Button size="sm" className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white text-xs">
                      İncele
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Kurs bulunamadı</h3>
            <p className="text-gray-500 mb-6">
              Arama kriterlerinize uygun kurs bulunamadı. Filtreleri değiştirmeyi deneyin.
            </p>
            <Button
              variant="outline"
              className="border-teal-300 text-teal-700 hover:bg-teal-50"
              onClick={() => {
                setSearch('');
                setCategory('');
                setLevel('');
                setSortBy('newest');
                setPage(1);
              }}
            >
              Filtreleri Temizle
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-gray-200 hover:border-teal-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 7) return true;
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (p - prev > 1) acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                typeof item === 'string' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      page === item
                        ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-700 border border-gray-200'
                    )}
                  >
                    {item}
                  </button>
                )
              )}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border-gray-200 hover:border-teal-300"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
