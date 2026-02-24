'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, Filter, Grid3X3, List, Star, Award, Users,
  ChevronLeft, ChevronRight, GraduationCap, X,
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

  // Parse price range into min/max
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
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Mentor Bul
            </h1>
            <p className="text-teal-100 text-lg max-w-2xl mx-auto">
              Alanında uzman mentorlerle tanışarak kariyerine yön ver
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-3 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Üniversite, bölüm veya mentor adı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-0 shadow-none focus-visible:ring-0 h-12 text-base"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-8 bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Ara
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Category Pills */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  category === cat.value
                    ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-600'
                }`}
              >
                {cat.label}
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

          {/* Quick Filters (desktop) */}
          <div className="hidden sm:flex items-center gap-2 flex-1">
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

          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
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
                <strong className="text-gray-700">{data.totalCount}</strong> mentor bulundu
              </span>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="sm:hidden bg-white p-4 rounded-xl shadow-sm border mb-6 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fiyat Aralığı</label>
              <select value={priceRange} onChange={(e) => { setPriceRange(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                {priceRangeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sıralama</label>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
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
              <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setCategory(''); setPage(1); }}>
                {CATEGORIES.find(c => c.value === category)?.label}
                <X className="w-3 h-3" />
              </Badge>
            )}
            {priceRange && (
              <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setPriceRange(''); setPage(1); }}>
                {priceRangeOptions.find(p => p.value === priceRange)?.label}
                <X className="w-3 h-3" />
              </Badge>
            )}
            {sortBy !== 'recommended' && (
              <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setSortBy('recommended'); setPage(1); }}>
                {sortOptions.find(s => s.value === sortBy)?.label}
                <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-56 bg-gray-200" />
                <CardContent className="pt-4"><div className="space-y-3"><div className="h-5 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-10 bg-gray-200 rounded mt-4" /></div></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.items.map((mentor) => (
                  <Link key={mentor.userId} href={ROUTES.MENTOR_PROFILE(mentor.userId)}>
                    <Card className="overflow-hidden border border-gray-200 hover:border-teal-300 hover:shadow-xl transition-all duration-300 group cursor-pointer h-full">
                      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-teal-50 to-green-50">
                        {mentor.avatarUrl ? (
                          <img src={mentor.avatarUrl} alt={mentor.displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center">
                              <span className="text-4xl font-bold text-white">{mentor.displayName.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>
                        )}
                        {mentor.isVerified && (
                          <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full text-xs font-medium flex items-center gap-1 shadow-md">
                            <Award className="w-3 h-3" /> Doğrulanmış
                          </div>
                        )}
                        <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
                          Çevrimiçi
                        </div>
                      </div>
                      <CardContent className="pt-4 pb-5 px-5">
                        <h3 className="font-semibold text-lg text-gray-900 truncate mb-0.5">{mentor.displayName}</h3>
                        <p className="text-sm text-teal-600 font-medium truncate mb-1">{mentor.headline || mentor.department}</p>
                        <p className="text-xs text-gray-500 truncate mb-3 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{mentor.university}</p>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-semibold text-sm text-gray-900">{mentor.ratingAvg.toFixed(1)}</span><span className="text-xs text-gray-500">({mentor.ratingCount})</span></div>
                          <div className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3.5 h-3.5" />{mentor.ratingCount} öğrenci</div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          {mentor.hourlyRate ? (<div><span className="text-xl font-bold text-gray-900">{formatCurrency(mentor.hourlyRate)}</span><span className="text-gray-500 text-xs">/saat</span></div>) : (<span className="text-sm text-gray-400">Fiyat belirtilmemiş</span>)}
                          <button className="px-4 py-2 bg-gradient-to-r from-teal-600 to-green-600 text-white text-sm font-medium rounded-lg hover:from-teal-700 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md">Profili Gör</button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="flex flex-col gap-4">
                {data?.items.map((mentor) => (
                  <Link key={mentor.userId} href={ROUTES.MENTOR_PROFILE(mentor.userId)}>
                    <Card className="p-4 border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <div className="flex gap-4 items-center">
                        {mentor.avatarUrl ? (<img src={mentor.avatarUrl} alt={mentor.displayName} className="w-20 h-20 rounded-xl object-cover shrink-0" />) : (<div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center shrink-0"><span className="text-2xl font-bold text-white">{mentor.displayName.charAt(0).toUpperCase()}</span></div>)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold text-lg text-gray-900 truncate">{mentor.displayName}</h3>{mentor.isVerified && (<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full text-xs font-medium shrink-0"><Award className="w-3 h-3" /> Doğrulanmış</span>)}</div>
                          <p className="text-sm text-teal-600 font-medium truncate mb-0.5">{mentor.headline || mentor.department}</p>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {mentor.university}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 shrink-0"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-semibold text-sm">{mentor.ratingAvg.toFixed(1)}</span><span className="text-xs text-gray-500">({mentor.ratingCount})</span></div>
                        <div className="hidden sm:block text-right shrink-0">{mentor.hourlyRate ? (<><span className="text-lg font-bold text-gray-900">{formatCurrency(mentor.hourlyRate)}</span><span className="text-gray-500 text-xs">/saat</span></>) : (<span className="text-sm text-gray-400">-</span>)}</div>
                        <button className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-green-600 text-white text-sm font-medium rounded-lg hover:from-teal-700 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md shrink-0">İncele</button>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {data?.items.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center"><Search className="w-8 h-8 text-gray-400" /></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Mentor bulunamadı</h3>
                <p className="text-gray-500 text-sm mb-4">Farklı anahtar kelimeler ya da filtre ayarları deneyin</p>
                {activeFilterCount > 0 && (<Button variant="outline" onClick={clearAllFilters}><X className="w-4 h-4 mr-2" /> Tüm Filtreleri Temizle</Button>)}
              </div>
            )}

            {data && data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <Button variant="outline" size="sm" disabled={!data.hasPreviousPage} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1"><ChevronLeft className="w-4 h-4" /> Önceki</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).filter((p) => { if (data.totalPages <= 7) return true; if (p === 1 || p === data.totalPages) return true; if (Math.abs(p - data.pageNumber) <= 1) return true; return false; }).reduce<(number | string)[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...'); acc.push(p); return acc; }, []).map((item, idx) => typeof item === 'string' ? (<span key={`e-${idx}`} className="px-2 text-gray-400 text-sm">...</span>) : (<button key={item} onClick={() => setPage(item)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${data.pageNumber === item ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>{item}</button>))}
                </div>
                <Button variant="outline" size="sm" disabled={!data.hasNextPage} onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} className="gap-1">Sonraki <ChevronRight className="w-4 h-4" /></Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
