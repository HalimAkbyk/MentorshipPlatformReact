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
  Users,
  GraduationCap,
  Filter,
  X,
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
  { value: 'newest', label: 'En Yeni' },
  { value: 'popular', label: 'En Popüler' },
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'price-asc', label: 'Fiyat (Düşük)' },
  { value: 'price-desc', label: 'Fiyat (Yüksek)' },
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
    { value: '', label: 'Tüm Kategoriler' },
    ...categoryNames.map((name) => ({ value: name, label: name })),
  ];

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 12;

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
      {/* Compact Hero */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-green-500 py-8 md:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-5">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">
              Video Eğitimler
            </h1>
            <p className="text-teal-100 text-sm md:text-base max-w-lg mx-auto">
              Uzman eğitmenlerden video derslerle kendinizi geliştirin
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-1.5 flex flex-col sm:flex-row gap-1.5">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Kurs adı, konu veya eğitmen ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 border-0 shadow-none focus:outline-none h-10 text-sm rounded-md"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {/* Categories + Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          {/* Category Pills */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-1.5 pb-1">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setCategory(opt.value === category ? '' : opt.value); setPage(1); }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap',
                    category === opt.value
                      ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-600'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showFilters ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtre
              {activeFilterCount > 0 && (
                <span className="bg-teal-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <select
                value={level}
                onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
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
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                {priceRangeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
              >
                <X className="w-3 h-3" />
                Temizle
              </button>
            )}
            {data && (
              <span className="text-xs text-gray-500">
                <strong className="text-gray-700">{data.totalCount}</strong> kurs
              </span>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="sm:hidden bg-white p-3 rounded-lg shadow-sm border mb-4 space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Seviye</label>
              <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white">
                {levelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Fiyat Aralığı</label>
              <select value={priceRange} onChange={(e) => { setPriceRange(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white">
                {priceRangeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Sıralama</label>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white">
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="text-[10px] text-gray-500">Aktif:</span>
            {category && (
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setCategory(''); setPage(1); }}>
                {categoryOptions.find(c => c.value === category)?.label}
                <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {level && (
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setLevel(''); setPage(1); }}>
                {getLevelLabel(level as CourseLevel)}
                <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {priceRange && (
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setPriceRange(''); setPage(1); }}>
                {priceRangeOptions.find(p => p.value === priceRange)?.label}
                <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {sortBy !== 'newest' && (
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setSortBy('newest'); setPage(1); }}>
                {sortOptions.find(s => s.value === sortBy)?.label}
                <X className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
        )}

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200" />
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden hover:shadow-lg hover:border-teal-300 transition-all duration-300 cursor-pointer group border border-gray-200"
                onClick={() => router.push(ROUTES.COURSE_DETAIL(course.id))}
              >
                {/* Cover Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={getCoverImageStyle(course.coverImagePosition, course.coverImageTransform)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-white/40" />
                    </div>
                  )}
                  {/* Level Badge */}
                  <Badge className={cn('absolute top-2 left-2 text-[10px] font-medium', getLevelColor(course.level))}>
                    {getLevelLabel(course.level)}
                  </Badge>
                  {/* Price overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-6">
                    <span className="text-white font-bold text-xs">
                      {course.price === 0 ? 'Ücretsiz' : formatCurrency(course.price, course.currency)}
                    </span>
                  </div>
                </div>

                <CardContent className="p-3">
                  {/* Category tag */}
                  {course.category && (
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-teal-600 mb-0.5 block">
                      {categoryOptions.find(c => c.value === course.category)?.label || course.category}
                    </span>
                  )}

                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-teal-600 transition-colors leading-snug">
                    {course.title}
                  </h3>

                  {course.shortDescription && (
                    <p className="text-[11px] text-gray-500 mb-1.5 line-clamp-2 leading-relaxed">
                      {course.shortDescription}
                    </p>
                  )}

                  {/* Mentor */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {course.mentorAvatar ? (
                      <img src={course.mentorAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-teal-600">
                          {course.mentorName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-[11px] text-gray-500 truncate">{course.mentorName}</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs font-bold text-amber-600">{course.ratingAvg.toFixed(1)}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] text-gray-400">({course.ratingCount})</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-0.5">
                      <BookOpen className="w-3 h-3" />
                      {course.totalLectures} ders
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDuration(course.totalDurationSec)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Users className="w-3 h-3" />
                      {course.enrollmentCount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Kurs bulunamadı</h3>
            <p className="text-gray-500 text-sm mb-3">Farklı anahtar kelimeler ya da filtre ayarları deneyin</p>
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Tüm Filtreleri Temizle
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-8">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1 text-xs h-8">
              <ChevronLeft className="w-3.5 h-3.5" /> Önceki
            </Button>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - page) <= 1) return true;
                  return false;
                })
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  typeof item === 'string' ? (
                    <span key={`e-${idx}`} className="px-1.5 text-gray-400 text-xs">...</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200',
                        page === item
                          ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="gap-1 text-xs h-8">
              Sonraki <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-5 md:p-6 text-center border border-teal-100">
          <GraduationCap className="w-8 h-8 text-teal-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-900 mb-1">Kayıtlı Kurslarını Görmek İster misin?</h3>
          <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
            Daha önce satın aldığın kurslara kaldığı yerden devam edebilirsin.
          </p>
          <Button onClick={() => router.push(ROUTES.STUDENT_COURSES)} variant="outline" size="sm" className="border-teal-300 text-xs">
            Kurslarım
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
