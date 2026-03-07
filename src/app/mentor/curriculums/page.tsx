'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurriculums, useDeleteCurriculum, usePublishCurriculum } from '@/lib/hooks/use-curriculum';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import {
  Plus,
  BookOpen,
  Search,
  Pencil,
  Trash2,
  Send,
  Archive,
  Calendar,
  Clock,
  GraduationCap,
} from 'lucide-react';

const STATUS_TABS = [
  { label: 'Tumu', value: '' },
  { label: 'Taslak', value: 'Draft' },
  { label: 'Yayinda', value: 'Published' },
  { label: 'Arsiv', value: 'Archived' },
];

const SUBJECT_LABELS: Record<string, string> = {
  Matematik: 'Matematik',
  Fizik: 'Fizik',
  Kimya: 'Kimya',
  Biyoloji: 'Biyoloji',
  Turkce: 'Turkce',
  Tarih: 'Tarih',
  Cografya: 'Cografya',
  Ingilizce: 'Ingilizce',
  Diger: 'Diger',
};

const LEVEL_LABELS: Record<string, string> = {
  TYT: 'TYT',
  AYT: 'AYT',
  LGS: 'LGS',
  Genel: 'Genel',
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'Draft':
      return <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 border-gray-200">Taslak</Badge>;
    case 'Published':
      return <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Yayinda</Badge>;
    case 'Archived':
      return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Arsiv</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MentorCurriculumsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCurriculums({
    status: statusFilter || undefined,
    search: search.trim() || undefined,
    page,
    pageSize: 12,
  });

  const deleteMutation = useDeleteCurriculum();
  const publishMutation = usePublishCurriculum();

  const items = data?.items ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('Bu mufredati silmek istediginize emin misiniz?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Mufredat silindi');
    } catch {
      // error handled by interceptor
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
      toast.success('Mufredat yayinlandi');
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Mufredatlarim</h1>
            <p className="text-xs text-gray-500">Haftalik mufredat planlari olusturun ve yonetin</p>
          </div>
        </div>
        <Button size="sm" onClick={() => router.push('/mentor/curriculums/create')} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Yeni Mufredat
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => router.push(`/mentor/curriculums/${item.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {item.subject && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                        {SUBJECT_LABELS[item.subject] || item.subject}
                      </span>
                    )}
                    {item.level && (
                      <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-medium">
                        {LEVEL_LABELS[item.level] || item.level}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />
                      {item.totalWeeks} hafta
                    </span>
                    {item.isDefault && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                        Varsayilan
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.createdAt)}
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => router.push(`/mentor/curriculums/${item.id}`)}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Duzenle
                      </Button>
                      {item.status === 'Draft' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2 text-green-600"
                          onClick={() => handlePublish(item.id)}
                          disabled={publishMutation.isPending}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Yayinla
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            totalCount={data?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel="mufredat"
          />
        </>
      ) : (
        <Card className="border border-dashed border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {search || statusFilter ? 'Aramanizla eslesen mufredat bulunamadi' : 'Henuz mufredat olusturmadiniz'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {search || statusFilter
                ? 'Farkli filtreler deneyin'
                : 'Haftalik ders plani olusturarak ogrencilerinizi yonlendirin'}
            </p>
            {!search && !statusFilter && (
              <Button size="sm" className="text-xs" onClick={() => router.push('/mentor/curriculums/create')}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Ilk Mufredati Olustur
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
