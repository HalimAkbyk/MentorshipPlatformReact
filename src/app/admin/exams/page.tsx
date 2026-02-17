'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Search,
  Loader2,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

import { adminApi, type AdminExamDto, type PagedResult } from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const scopeLabels: Record<string, string> = {
  General: 'Genel',
  Booking: 'Ders',
  Course: 'Kurs',
  GroupClass: 'Grup Dersi',
};

export default function AdminExamsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'exams', page, search, scopeFilter],
    queryFn: () =>
      adminApi.getAdminExams({
        page,
        pageSize,
        search: search || undefined,
        scopeType: scopeFilter || undefined,
      }),
  });

  const publishMutation = useMutation({
    mutationFn: (examId: string) => adminApi.publishExam(examId),
    onSuccess: () => {
      toast.success('Sinav yayinlandi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'exams'] });
    },
    onError: () => toast.error('Hata olustu.'),
  });

  const unpublishMutation = useMutation({
    mutationFn: (examId: string) => adminApi.unpublishExam(examId),
    onSuccess: () => {
      toast.success('Sinav yayindan kaldirildi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'exams'] });
    },
    onError: () => toast.error('Hata olustu.'),
  });

  const pagedData = data as PagedResult<AdminExamDto> | undefined;

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const columns: Column<AdminExamDto>[] = [
    {
      key: 'title',
      label: 'Sinav Adi',
      render: (e) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{e.title}</p>
          <p className="text-xs text-gray-400">{e.mentorName}</p>
        </div>
      ),
    },
    {
      key: 'scopeType',
      label: 'Kapsam',
      render: (e) => (
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
          {scopeLabels[e.scopeType] || e.scopeType}
        </span>
      ),
    },
    {
      key: 'questionCount',
      label: 'Soru',
      render: (e) => <span className="text-sm">{e.questionCount}</span>,
    },
    {
      key: 'attemptCount',
      label: 'Katilim',
      render: (e) => <span className="text-sm">{e.attemptCount}</span>,
    },
    {
      key: 'averageScore',
      label: 'Ort. Puan',
      render: (e) => (
        <span className="text-sm">
          {e.averageScore != null ? `%${e.averageScore.toFixed(0)}` : '-'}
        </span>
      ),
    },
    {
      key: 'durationMinutes',
      label: 'Sure',
      render: (e) => <span className="text-sm">{e.durationMinutes} dk</span>,
    },
    {
      key: 'isPublished',
      label: 'Durum',
      render: (e) => (
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            e.isPublished
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {e.isPublished ? 'Yayinda' : 'Taslak'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Tarih',
      render: (e) => (
        <span className="text-xs text-gray-500">{formatDate(e.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (e) => (
        <div className="flex items-center gap-1">
          {e.isPublished ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(ev) => {
                ev.stopPropagation();
                unpublishMutation.mutate(e.id);
              }}
              disabled={unpublishMutation.isPending}
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Kaldir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(ev) => {
                ev.stopPropagation();
                publishMutation.mutate(e.id);
              }}
              disabled={publishMutation.isPending}
            >
              <Eye className="h-3 w-3 mr-1" />
              Yayinla
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Sinav Modulu</h1>
        </div>
        <p className="text-sm text-gray-500">
          Tum mentor sinavlarini goruntuleyebilir, yayinlayabilir veya kaldirabilirsiniz.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Arama</label>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Sinav adi veya mentor..."
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Kapsam</label>
            <select
              value={scopeFilter}
              onChange={(e) => {
                setScopeFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full border rounded-md px-3 text-sm bg-white"
            >
              <option value="">Tumu</option>
              <option value="General">Genel</option>
              <option value="Booking">Ders</option>
              <option value="Course">Kurs</option>
              <option value="GroupClass">Grup Dersi</option>
            </select>
          </div>
          <Button onClick={handleSearch} size="sm" className="h-9">
            <Search className="h-4 w-4 mr-1" />
            Ara
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={pagedData?.items ?? []}
        isLoading={isLoading}
        getRowId={(e) => e.id}
        pagination={
          pagedData
            ? {
                page: pagedData.page,
                pageSize,
                totalCount: pagedData.totalCount,
                totalPages: pagedData.totalPages,
                onPageChange: setPage,
              }
            : undefined
        }
        emptyMessage="Henuz sinav bulunamadi."
      />
    </div>
  );
}
