'use client';

import { useState } from 'react';
import { useGroupClasses } from '@/lib/hooks/use-classes';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import Link from 'next/link';
import { useCategoryNames } from '@/lib/hooks/use-categories';
import { FeatureGate } from '@/components/feature-gate';

function ExploreClassesContent() {
  const user = useAuthStore((s) => s.user);
  const categoryNames = useCategoryNames('GroupClass');
  const CATEGORIES = [
    { label: 'Tümü', value: '' },
    ...categoryNames.map((name) => ({ label: name, value: name })),
  ];
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGroupClasses({
    category: category || undefined,
    search: search || undefined,
    page,
    pageSize: 12,
  });

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
                <Input
                  className="pl-10 border-0 shadow-none focus-visible:ring-0 h-12 text-base"
                  placeholder="Ders ara..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
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

      {/* Classes Grid */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((gc) => (
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
                        <Badge className="bg-green-100 text-green-700">Kayıtlı ✓</Badge>
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
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <span className="text-sm text-gray-500">
                Toplam {data.totalCount} ders
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  {data.pageNumber} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Şu an açık grup dersi bulunmuyor</p>
            <p className="text-sm text-gray-500 mt-1">
              Yeni grup dersleri eklendiğinde burada görünecek
            </p>
          </CardContent>
        </Card>
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
