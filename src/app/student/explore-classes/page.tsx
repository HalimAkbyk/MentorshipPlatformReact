'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGroupClasses } from '@/lib/hooks/use-classes';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils/format';
import {
  Users,
  Calendar,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  Filter,
  X,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useCategoryNames } from '@/lib/hooks/use-categories';
import { FeatureGate } from '@/components/feature-gate';
import { cn } from '@/lib/utils/cn';

const sortOptions = [
  { value: 'soonest', label: 'Yaklaşan' },
  { value: 'newest', label: 'En Yeni' },
  { value: 'popular', label: 'En Popüler' },
  { value: 'price_low', label: 'Fiyat (Düşük)' },
  { value: 'price_high', label: 'Fiyat (Yüksek)' },
];

const priceRangeOptions = [
  { value: '', label: 'Tüm Fiyatlar' },
  { value: '0-100', label: '0 - 100 TL' },
  { value: '100-300', label: '100 - 300 TL' },
  { value: '300+', label: '300 TL +' },
];

function ExploreClassesContent() {
  const user = useAuthStore((s) => s.user);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryNames = useCategoryNames('GroupClass');
  const CATEGORIES = [
    { label: 'Tümü', value: '' },
    ...categoryNames.map((name) => ({ label: name, value: name })),
  ];

  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('soonest');
  const [priceRange, setPriceRange] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useGroupClasses({
    category: category || undefined,
    search: debouncedSearch || undefined,
    sortBy: sortBy !== 'soonest' ? sortBy : undefined,
    page,
    pageSize: 12,
  });

  // Client-side price filter
  const filteredItems = data?.items.filter((gc) => {
    if (!priceRange) return true;
    if (priceRange === '0-100') return gc.pricePerSeat >= 0 && gc.pricePerSeat <= 100;
    if (priceRange === '100-300') return gc.pricePerSeat > 100 && gc.pricePerSeat <= 300;
    if (priceRange === '300+') return gc.pricePerSeat > 300;
    return true;
  });

  const activeFilterCount =
    (category ? 1 : 0) + (priceRange ? 1 : 0) + (sortBy !== 'soonest' ? 1 : 0);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('');
    setSortBy('soonest');
    setPriceRange('');
    setPage(1);
  }, []);

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Grup Dersleri
            </h1>
            <p className="text-teal-100 text-lg max-w-2xl mx-auto">
              Uzman mentorların grup derslerine katılın
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
                  placeholder="Ders adı veya konu ara..."
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
        {/* Category Pills */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setCategory(cat.value);
                  setPage(1);
                }}
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
                <strong className="text-gray-700">{data.totalCount}</strong> ders bulundu
              </span>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="sm:hidden bg-white p-4 rounded-xl shadow-sm border mb-6 space-y-3">
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
                {CATEGORIES.find(c => c.value === category)?.label}
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
            {sortBy !== 'soonest' && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setSortBy('soonest'); setPage(1); }}
              >
                {sortOptions.find(s => s.value === sortBy)?.label}
                <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        )}

        {/* Classes Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-40 bg-gray-200" />
                <CardContent className="pt-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((gc) => (
                <Link key={gc.id} href={gc.mentorUserId === user?.id ? '/mentor/group-classes' : `/student/group-classes/${gc.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    {gc.coverImageUrl && (
                      <div className="h-40 bg-gray-100 rounded-t-lg overflow-hidden">
                        <img
                          src={gc.coverImageUrl}
                          alt={gc.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className={gc.coverImageUrl ? 'pt-4' : 'pt-6'}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {gc.category}
                        </Badge>
                        {gc.enrolledCount >= gc.capacity && (
                          <Badge className="bg-red-100 text-red-700 text-xs">Dolu</Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{gc.title}</h3>

                      {gc.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{gc.description}</p>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={gc.mentorAvatar ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {gc.mentorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{gc.mentorName}</span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateTime(gc.startAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(gc.startAt)} - {formatTime(gc.endAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {gc.enrolledCount}/{gc.capacity} katılımcı
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <span className="text-lg font-bold text-teal-700">
                          {formatCurrency(gc.pricePerSeat, gc.currency)}
                        </span>
                        {gc.mentorUserId === user?.id ? (
                          <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200">
                            <Settings className="w-3.5 h-3.5 mr-1" />
                            Yönet
                          </Button>
                        ) : gc.currentUserEnrollmentStatus === 'Confirmed' || gc.currentUserEnrollmentStatus === 'Attended' ? (
                          <Badge className="bg-green-100 text-green-700">Kayıtlı</Badge>
                        ) : gc.currentUserEnrollmentStatus === 'PendingPayment' ? (
                          <Button size="sm" variant="outline" className="text-amber-600 border-amber-200">
                            Ödeme Bekliyor
                          </Button>
                        ) : (
                          <Button size="sm" disabled={gc.enrolledCount >= gc.capacity}>
                            {gc.enrolledCount >= gc.capacity ? 'Dolu' : 'Katıl'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (data.totalPages <= 7) return true;
                    if (p === 1 || p === data.totalPages) return true;
                    if (Math.abs(p - data.pageNumber) <= 1) return true;
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
                  disabled={!data.hasNextPage}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  className="rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold font-heading mb-2 text-gray-700">Grup dersi bulunamadı</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Arama veya filtre kriterlerinize uygun grup dersi bulunamadı. Farklı bir arama yapmayı ya da filtreleri temizlemeyi deneyin.
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters}>
                <X className="w-4 h-4 mr-2" />
                Tüm Filtreleri Temizle
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExploreClassesPage() {
  return (
    <FeatureGate flag="group_classes_enabled">
      <ExploreClassesContent />
    </FeatureGate>
  );
}
