'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Award,
  Users,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { useMentors } from '../../../lib/hooks/use-mentors';
import { formatCurrency } from '../../../lib/utils/format';
import { ROUTES } from '../../../lib/constants/routes';

const CATEGORIES = [
  'Tumu',
  'Yazilim',
  'Matematik',
  'Dil',
  'Muzik',
  'Bilim',
  'Is/Kariyer',
  'Sanat',
  'Spor/Saglik',
];

export default function MentorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [university, setUniversity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('Tumu');
  const [sortBy, setSortBy] = useState('recommended');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMentors({
    searchTerm,
    university: university || undefined,
    page,
    pageSize: 20,
  });

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
              Alaninda uzman mentorlerle tanisarak kariyerine yon ver
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-3 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Universite, bolum veya mentor adi ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-0 shadow-none focus-visible:ring-0 h-12 text-base"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 sm:w-44"
              >
                <option value="recommended">Onerilen</option>
                <option value="rating">Puan (Yuksek)</option>
                <option value="price_low">Fiyat (Dusuk)</option>
                <option value="price_high">Fiyat (Yuksek)</option>
              </select>
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

      <div className="container mx-auto px-4 py-8">
        {/* Category Pills + View Toggle Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Toggle + Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 ${showFilters ? 'border-teal-300 text-teal-600' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtreler
            </Button>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-teal-100 text-teal-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Izgara gorunumu"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-teal-100 text-teal-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Liste gorunumu"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Universite</label>
                <Input
                  placeholder="Universite filtrele"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Minimum Fiyat</label>
                <Input type="number" placeholder="TL" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Maximum Fiyat</label>
                <Input type="number" placeholder="TL" />
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && (
          <p className="text-sm text-gray-600 mb-4">
            {data?.totalCount || 0} mentor bulundu
          </p>
        )}

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className={
            viewMode === 'grid'
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
          }>
            {[...Array(6)].map((_, i) =>
              viewMode === 'grid' ? (
                <Card key={i} className="animate-pulse overflow-hidden">
                  <div className="h-56 bg-gray-200" />
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-10 bg-gray-200 rounded mt-4" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card key={i} className="animate-pulse">
                  <div className="p-4 flex gap-4 items-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="h-10 w-24 bg-gray-200 rounded" />
                  </div>
                </Card>
              )
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.items.map((mentor) => (
                  <Link key={mentor.userId} href={ROUTES.MENTOR_PROFILE(mentor.userId)}>
                    <Card className="overflow-hidden border border-gray-200 hover:border-teal-300 hover:shadow-xl transition-all duration-300 group cursor-pointer h-full">
                      {/* Image Area */}
                      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-teal-50 to-green-50">
                        {mentor.avatarUrl ? (
                          <img
                            src={mentor.avatarUrl}
                            alt={mentor.displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center">
                              <span className="text-4xl font-bold text-white">
                                {mentor.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Verified Badge */}
                        {mentor.isVerified && (
                          <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full text-xs font-medium flex items-center gap-1 shadow-md">
                            <Award className="w-3 h-3" />
                            Dogrulanmis
                          </div>
                        )}

                        {/* Online Indicator */}
                        <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                          </span>
                          Cevrimici
                        </div>
                      </div>

                      {/* Info Area */}
                      <CardContent className="pt-4 pb-5 px-5">
                        <h3 className="font-semibold text-lg text-gray-900 truncate mb-0.5">
                          {mentor.displayName}
                        </h3>
                        <p className="text-sm text-teal-600 font-medium truncate mb-1">
                          {mentor.headline || mentor.department}
                        </p>
                        <p className="text-xs text-gray-500 truncate mb-3 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {mentor.university}
                        </p>

                        {/* Rating + Students */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-sm text-gray-900">
                              {mentor.ratingAvg.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({mentor.ratingCount})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="w-3.5 h-3.5" />
                            {mentor.ratingCount} ogrenci
                          </div>
                        </div>

                        {/* Price + CTA */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          {mentor.hourlyRate ? (
                            <div>
                              <span className="text-xl font-bold text-gray-900">
                                {formatCurrency(mentor.hourlyRate)}
                              </span>
                              <span className="text-gray-500 text-xs">/saat</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Fiyat belirtilmemis</span>
                          )}
                          <button className="px-4 py-2 bg-gradient-to-r from-teal-600 to-green-600 text-white text-sm font-medium rounded-lg hover:from-teal-700 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md">
                            Profili Gor
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="flex flex-col gap-4">
                {data?.items.map((mentor) => (
                  <Link key={mentor.userId} href={ROUTES.MENTOR_PROFILE(mentor.userId)}>
                    <Card className="p-4 border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <div className="flex gap-4 items-center">
                        {/* Avatar */}
                        {mentor.avatarUrl ? (
                          <img
                            src={mentor.avatarUrl}
                            alt={mentor.displayName}
                            className="w-20 h-20 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center shrink-0">
                            <span className="text-2xl font-bold text-white">
                              {mentor.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">
                              {mentor.displayName}
                            </h3>
                            {mentor.isVerified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full text-xs font-medium shrink-0">
                                <Award className="w-3 h-3" />
                                Dogrulanmis
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-teal-600 font-medium truncate mb-0.5">
                            {mentor.headline || mentor.department}
                          </p>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {mentor.university}
                          </p>
                        </div>

                        {/* Rating */}
                        <div className="hidden sm:flex items-center gap-1 shrink-0">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-sm">{mentor.ratingAvg.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({mentor.ratingCount})</span>
                        </div>

                        {/* Price */}
                        <div className="hidden sm:block text-right shrink-0">
                          {mentor.hourlyRate ? (
                            <>
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(mentor.hourlyRate)}
                              </span>
                              <span className="text-gray-500 text-xs">/saat</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>

                        {/* CTA */}
                        <button className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-green-600 text-white text-sm font-medium rounded-lg hover:from-teal-700 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md shrink-0">
                          Incele
                        </button>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {data?.items.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Mentor bulunamadi</h3>
                <p className="text-gray-500 text-sm">Farkli anahtar kelimeler deneyebilirsiniz</p>
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Onceki
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show first, last, current, and neighbors
                      if (p === 1 || p === data.totalPages) return true;
                      if (Math.abs(p - data.pageNumber) <= 1) return true;
                      return false;
                    })
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      typeof item === 'string' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                            data.pageNumber === item
                              ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasNextPage}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  className="gap-1"
                >
                  Sonraki
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
