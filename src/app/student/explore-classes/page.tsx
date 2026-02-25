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
  ArrowRight,
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
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Hero */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-green-500 py-8 md:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-5">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">
              Grup Dersleri
            </h1>
            <p className="text-teal-100 text-sm md:text-base max-w-lg mx-auto">
              Uzman mentorların grup derslerine katılın
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
                  placeholder="Ders adı veya konu ara..."
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
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setPage(1); }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap',
                    category === cat.value
                      ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-600'
                  )}
                >
                  {cat.label}
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
                <strong className="text-gray-700">{data.totalCount}</strong> ders
              </span>
            )}
          </div>
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
            {sortBy !== 'soonest' && (
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => { setSortBy('soonest'); setPage(1); }}>
                {sortOptions.find(s => s.value === sortBy)?.label}
                <X className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
        )}

        {/* Classes Grid */}
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
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((gc) => (
                <Link key={gc.id} href={gc.mentorUserId === user?.id ? '/mentor/group-classes' : `/student/group-classes/${gc.id}`}>
                  <Card className="h-full hover:shadow-lg hover:border-teal-300 transition-all duration-300 cursor-pointer group border border-gray-200 overflow-hidden">
                    {/* Cover Image */}
                    {gc.coverImageUrl ? (
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        <img src={gc.coverImageUrl} alt={gc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center">
                        <Users className="w-10 h-10 text-teal-300" />
                      </div>
                    )}

                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {gc.category}
                        </Badge>
                        {gc.enrolledCount >= gc.capacity && (
                          <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0">Dolu</Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{gc.title}</h3>

                      {gc.description && (
                        <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">{gc.description}</p>
                      )}

                      <div className="flex items-center gap-1.5 mb-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={gc.mentorAvatar ?? undefined} />
                          <AvatarFallback className="text-[8px]">
                            {gc.mentorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-gray-500 truncate">{gc.mentorName}</span>
                      </div>

                      <div className="space-y-0.5 text-[11px] text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {formatDateTime(gc.startAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          {formatTime(gc.startAt)} - {formatTime(gc.endAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 shrink-0" />
                          {gc.enrolledCount}/{gc.capacity} katılımcı
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-base font-bold text-teal-700">
                          {formatCurrency(gc.pricePerSeat, gc.currency)}
                        </span>
                        {gc.mentorUserId === user?.id ? (
                          <span className="text-xs text-indigo-600 font-medium flex items-center gap-0.5">
                            <Settings className="w-3 h-3" /> Yönet
                          </span>
                        ) : gc.currentUserEnrollmentStatus === 'Confirmed' || gc.currentUserEnrollmentStatus === 'Attended' ? (
                          <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">Kayıtlı</Badge>
                        ) : gc.currentUserEnrollmentStatus === 'PendingPayment' ? (
                          <span className="text-[10px] text-amber-600 font-medium">Ödeme Bekliyor</span>
                        ) : (
                          <span className="text-xs text-teal-600 font-medium flex items-center gap-0.5 group-hover:gap-1 transition-all">
                            {gc.enrolledCount >= gc.capacity ? 'Dolu' : 'Katıl'} <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
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
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Grup dersi bulunamadı</h3>
            <p className="text-gray-500 text-sm mb-3">Farklı anahtar kelimeler ya da filtre ayarları deneyin</p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="w-3.5 h-3.5 mr-1.5" /> Tüm Filtreleri Temizle
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
