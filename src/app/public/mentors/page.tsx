'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, Filter, Grid3X3, List, Star, Award, Users,
  ChevronLeft, ChevronRight, GraduationCap, X, ArrowRight,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { useMentors } from '../../../lib/hooks/use-mentors';
import { formatCurrency } from '../../../lib/utils/format';
import { ROUTES } from '../../../lib/constants/routes';
import { useCategoryNames } from '../../../lib/hooks/use-categories';
import { cn } from '../../../lib/utils/cn';

const sortOptions = [
  { value: 'recommended', label: 'Önerilen' },
  { value: 'rating', label: 'Puan (Yüksek)' },
  { value: 'price_low', label: 'Fiyat (Düşük)' },
  { value: 'price_high', label: 'Fiyat (Yüksek)' },
  { value: 'newest', label: 'En Yeni' },
];

const priceRangeOptions = [
  { value: '', label: 'Tüm Fiyatlar' },
  { value: '0-100', label: '0 - 100 TL' },
  { value: '100-300', label: '100 - 300 TL' },
  { value: '300+', label: '300 TL +' },
];

export default function MentorsPage() {
  const categoryNames = useCategoryNames('Offering');
  const CATEGORIES = [
    { label: 'Tümü', value: '' },
    ...categoryNames.map((name) => ({ label: name, value: name })),
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [priceRange, setPriceRange] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const minPrice = priceRange === '0-100' ? 0 : priceRange === '100-300' ? 100 : priceRange === '300+' ? 300 : undefined;
  const maxPrice = priceRange === '0-100' ? 100 : priceRange === '100-300' ? 300 : undefined;

  const { data, isLoading } = useMentors({
    searchTerm: searchTerm || undefined,
    category: category || undefined,
    sortBy: sortBy !== 'recommended' ? sortBy : undefined,
    minPrice,
    maxPrice,
    page,
    pageSize: 20,
  });

  const activeFilterCount =
    (category ? 1 : 0) + (priceRange ? 1 : 0) + (sortBy !== 'recommended' ? 1 : 0);

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategory('');
    setSortBy('recommended');
    setPriceRange('');
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Hero */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-green-500 py-8 md:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-5">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">
              Mentor Bul
            </h1>
            <p className="text-teal-100 text-sm md:text-base max-w-lg mx-auto">
              Alanında uzman mentorlerle tanışarak kariyerine yön ver
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-1.5 flex flex-col sm:flex-row gap-1.5">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Üniversite, bölüm veya mentor adı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-0 shadow-none focus-visible:ring-0 h-10 text-sm"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-6 bg-gradient-to-r from-teal-600 to-green-600 text-white text-sm font-semibold rounded-md hover:from-teal-700 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5" />
                Ara
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200',
                category === cat.value
                  ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-600'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
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

            {/* View Toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'grid' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Result Count + Clear */}
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
            <span className="text-xs text-gray-500 ml-auto">
              <strong className="text-gray-700">{data.totalCount}</strong> mentor
            </span>
          )}
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="sm:hidden bg-white p-3 rounded-lg shadow-sm border mb-4 space-y-2">
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
                {CATEGORIES.find(c => c.value === category)?.label}
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
            {sortBy !== 'recommended' && (
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setSortBy('recommended'); setPage(1); }}>
                {sortOptions.find(s => s.value === sortBy)?.label}
                <X className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex flex-col gap-3'}>
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200" />
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data?.items.map((mentor) => (
                  <Link key={mentor.userId} href={ROUTES.MENTOR_PROFILE(mentor.userId)}>
                    <Card className="overflow-hidden border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full">
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-teal-50 to-green-50">
                        {mentor.avatarUrl ? (
                          <img src={mentor.avatarUrl} alt={mentor.displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center">
                              <span className="text-2xl font-bold text-white">{mentor.displayName.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>
                        )}
                        {mentor.isVerified && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full text-[10px] font-medium flex items-center gap-0.5 shadow-sm">
                            <Award className="w-2.5 h-2.5" /> Doğrulanmış
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm text-gray-900 truncate mb-0.5">{mentor.displayName}</h3>
                        <p className="text-xs text-teal-600 font-medium truncate mb-0.5">{mentor.headline || mentor.department}</p>
                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mb-2">
                          <GraduationCap className="w-3 h-3 shrink-0" />{mentor.university}
                        </p>

                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-xs text-gray-900">{mentor.ratingAvg.toFixed(1)}</span>
                            <span className="text-[10px] text-gray-400">({mentor.ratingCount})</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                            <Users className="w-3 h-3" />{mentor.ratingCount}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          {mentor.hourlyRate ? (
                            <div>
                              <span className="text-base font-bold text-gray-900">{formatCurrency(mentor.hourlyRate)}</span>
                              <span className="text-gray-400 text-[10px]">/saat</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                          <span className="text-xs text-teal-600 font-medium flex items-center gap-0.5 group-hover:gap-1 transition-all">
                            İncele <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="flex flex-col gap-3">
                {data?.items.map((mentor) => (
                  <Link key={mentor.userId} href={ROUTES.MENTOR_PROFILE(mentor.userId)}>
                    <Card className="p-3 border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-300 cursor-pointer">
                      <div className="flex gap-3 items-center">
                        {mentor.avatarUrl ? (
                          <img src={mentor.avatarUrl} alt={mentor.displayName} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center shrink-0">
                            <span className="text-lg font-bold text-white">{mentor.displayName.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{mentor.displayName}</h3>
                            {mentor.isVerified && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full text-[10px] font-medium shrink-0">
                                <Award className="w-2.5 h-2.5" /> Doğrulanmış
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-teal-600 font-medium truncate">{mentor.headline || mentor.department}</p>
                          <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> {mentor.university}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-0.5 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-xs">{mentor.ratingAvg.toFixed(1)}</span>
                          <span className="text-[10px] text-gray-400">({mentor.ratingCount})</span>
                        </div>
                        <div className="hidden sm:block text-right shrink-0">
                          {mentor.hourlyRate ? (
                            <>
                              <span className="text-sm font-bold text-gray-900">{formatCurrency(mentor.hourlyRate)}</span>
                              <span className="text-gray-400 text-[10px]">/saat</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                        <span className="text-xs text-teal-600 font-medium flex items-center gap-0.5 shrink-0">
                          İncele <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {data?.items.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Mentor bulunamadı</h3>
                <p className="text-gray-500 text-sm mb-3">Farklı anahtar kelimeler ya da filtre ayarları deneyin</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    <X className="w-3.5 h-3.5 mr-1.5" /> Tüm Filtreleri Temizle
                  </Button>
                )}
              </div>
            )}

            {data && data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-8">
                <Button variant="outline" size="sm" disabled={!data.hasPreviousPage} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1 text-xs h-8">
                  <ChevronLeft className="w-3.5 h-3.5" /> Önceki
                </Button>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (data.totalPages <= 7) return true;
                      if (p === 1 || p === data.totalPages) return true;
                      if (Math.abs(p - data.pageNumber) <= 1) return true;
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
                            data.pageNumber === item
                              ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          {item}
                        </button>
                      )
                    )}
                </div>
                <Button variant="outline" size="sm" disabled={!data.hasNextPage} onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} className="gap-1 text-xs h-8">
                  Sonraki <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
