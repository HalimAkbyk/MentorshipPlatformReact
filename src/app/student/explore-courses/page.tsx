'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getCoverImageStyle } from '@/components/ui/cover-image-editor';
import { useRouter } from 'next/navigation';
import {
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  SlidersHorizontal,
  Users,
  GraduationCap,
  Filter,
  X,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePublicCourses } from '@/lib/hooks/use-courses';
import { CourseLevel } from '@/lib/types/enums';
import { ROUTES } from '@/lib/constants/routes';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { useCategoryNames } from '@/lib/hooks/use-categories';

// ---------- Filter Options ----------

const levelOptions = [
  { value: '', label: 'Tüm Seviyeler', icon: '📚' },
  { value: CourseLevel.Beginner, label: 'Başlangıç', icon: '🌱' },
  { value: CourseLevel.Intermediate, label: 'Orta', icon: '📈' },
  { value: CourseLevel.Advanced, label: 'İleri', icon: '🚀' },
  { value: CourseLevel.AllLevels, label: 'Tüm Seviyeler', icon: '🎯' },
];

const sortOptions = [
  { value: 'newest', label: 'En Yeni', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { value: 'popular', label: 'En Popüler', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { value: 'rating', label: 'En Yüksek Puan', icon: <Star className="w-3.5 h-3.5" /> },
  { value: 'price-asc', label: 'Fiyat: Düşükten Yükseğe', icon: null },
  { value: 'price-desc', label: 'Fiyat: Yüksekten Düşüğe', icon: null },
];

const priceRangeOptions = [
  { value: '', label: 'Tüm Fiyatlar' },
  { value: 'free', label: 'Ücretsiz' },
  { value: '0-100', label: '0 - 100 TL' },
  { value: '100-500', label: '100 - 500 TL' },
  { value: '500+', label: '500 TL +' },
];

// ---------- Helpers ----------

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}s ${minutes}dk`;
  return `${minutes}dk`;
}

function getLevelLabel(level: CourseLevel): string {
  switch (level) {
    case CourseLevel.Beginner: return 'Başlangıç';
    case CourseLevel.Intermediate: return 'Orta';
    case CourseLevel.Advanced: return 'İleri';
    case CourseLevel.AllLevels: return 'Tüm Seviyeler';
    default: return '';
  }
}

function getLevelColor(level: CourseLevel): string {
  switch (level) {
    case CourseLevel.Beginner: return 'bg-green-100 text-green-700';
    case CourseLevel.Intermediate: return 'bg-yellow-100 text-yellow-700';
    case CourseLevel.Advanced: return 'bg-red-100 text-red-700';
    case CourseLevel.AllLevels: return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

// ---------- Component ----------

export default function StudentExploreCoursesPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryNames = useCategoryNames('Course');
  const categoryOptions = [
    { value: '', label: 'Tüm Kategoriler', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    ...categoryNames.map((name) => ({ value: name, label: name, color: 'bg-gray-50 text-gray-700 hover:bg-gray-100' })),
  ];

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 12;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = usePublicCourses({
    search: debouncedSearch || undefined,
    category: category || undefined,
    level: level || undefined,
    sortBy,
    page,
    pageSize,
  });

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  const activeFilterCount =
    (category ? 1 : 0) + (level ? 1 : 0) + (priceRange ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('');
    setLevel('');
    setSortBy('newest');
    setPriceRange('');
    setPage(1);
  }, []);

  // Client-side price filter (since backend may not have priceRange param)
  const filteredItems = data?.items.filter((course) => {
    if (!priceRange) return true;
    if (priceRange === 'free') return course.price === 0;
    if (priceRange === '0-100') return course.price >= 0 && course.price <= 100;
    if (priceRange === '100-500') return course.price > 100 && course.price <= 500;
    if (priceRange === '500+') return course.price > 500;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Video Eğitimler
            </h1>
            <p className="text-teal-100 text-lg max-w-2xl mx-auto">
              Uzman eğitmenlerden video derslerle kendinizi geliştirin
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-3 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Kurs adı, konu veya eğitmen ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 border-0 shadow-none focus:outline-none h-12 text-base rounded-lg"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Category Chips */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setCategory(opt.value === category ? '' : opt.value); setPage(1); }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border',
                  category === opt.value
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : `${opt.color} border-transparent`
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3 rounded-xl shadow-sm border">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              showFilters ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <Filter className="w-4 h-4" />
            Filtreler
            {activeFilterCount > 0 && (
              <span className="bg-teal-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quick Filters (always visible) */}
          <div className="hidden sm:flex items-center gap-2 flex-1">
            <select
              value={level}
              onChange={(e) => { setLevel(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              {levelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>

            <select
              value={priceRange}
              onChange={(e) => { setPriceRange(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              {priceRangeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Result Count + Clear */}
          <div className="flex items-center gap-3 ml-auto">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Temizle
              </button>
            )}
            {data && (
              <span className="text-sm text-gray-500">
                <strong className="text-gray-700">{data.totalCount}</strong> kurs bulundu
              </span>
            )}
          </div>
        </div>

        {/* Expandable Mobile Filters */}
        {showFilters && (
          <div className="sm:hidden bg-white p-4 rounded-xl shadow-sm border mb-6 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Seviye</label>
              <select
                value={level}
                onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {levelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fiyat Aralığı</label>
              <select
                value={priceRange}
                onChange={(e) => { setPriceRange(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {priceRangeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sıralama</label>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">Aktif filtreler:</span>
            {category && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setCategory(''); setPage(1); }}
              >
                {categoryOptions.find(c => c.value === category)?.label}
                <X className="w-3 h-3" />
              </Badge>
            )}
            {level && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setLevel(''); setPage(1); }}
              >
                {getLevelLabel(level as CourseLevel)}
                <X className="w-3 h-3" />
              </Badge>
            )}
            {priceRange && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setPriceRange(''); setPage(1); }}
              >
                {priceRangeOptions.find(p => p.value === priceRange)?.label}
                <X className="w-3 h-3" />
              </Badge>
            )}
            {sortBy !== 'newest' && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setSortBy('newest'); setPage(1); }}
              >
                {sortOptions.find(s => s.value === sortBy)?.label}
                <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        )}

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
        ) : filteredItems && filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-sm"
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
                    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/40" />
                    </div>
                  )}
                  {/* Level Badge */}
                  <Badge className={cn('absolute top-2.5 left-2.5 text-xs font-medium', getLevelColor(course.level))}>
                    {getLevelLabel(course.level)}
                  </Badge>
                  {/* Price Badge */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                    <span className="text-white font-bold text-sm">
                      {course.price === 0 ? 'Ücretsiz' : formatCurrency(course.price, course.currency)}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Category tag */}
                  {course.category && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-teal-600 mb-1 block">
                      {categoryOptions.find(c => c.value === course.category)?.label || course.category}
                    </span>
                  )}

                  <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-teal-600 transition-colors text-sm leading-snug">
                    {course.title}
                  </h3>

                  {course.shortDescription && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">
                      {course.shortDescription}
                    </p>
                  )}

                  {/* Mentor */}
                  <div className="flex items-center gap-2 mb-3">
                    {course.mentorAvatar ? (
                      <img src={course.mentorAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-teal-600">
                          {course.mentorName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500">{course.mentorName}</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-0.5">
                      <span className="text-sm font-bold text-amber-600">
                        {course.ratingAvg.toFixed(1)}
                      </span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-[11px] text-gray-400">
                      ({course.ratingCount} değerlendirme)
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.totalLectures} ders
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(course.totalDurationSec)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course.enrollmentCount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold font-heading mb-2 text-gray-700">Kurs bulunamadı</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Arama veya filtre kriterlerinize uygun kurs bulunamadı. Farklı bir arama yapmayı ya da filtreleri temizlemeyi deneyin.
            </p>
            <Button variant="outline" onClick={clearAllFilters}>
              <X className="w-4 h-4 mr-2" />
              Tüm Filtreleri Temizle
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
              className="rounded-lg"
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
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border'
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
              className="rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-6 md:p-8 text-center border border-teal-100">
          <GraduationCap className="w-10 h-10 text-teal-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold font-heading text-gray-900 mb-2">Kayıtlı Kurslarını Görmek İster misin?</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Daha önce satın aldığın kurslara kaldığı yerden devam edebilirsin.
          </p>
          <Button onClick={() => router.push(ROUTES.STUDENT_COURSES)} variant="outline" className="border-teal-300">
            Kurslarım
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
