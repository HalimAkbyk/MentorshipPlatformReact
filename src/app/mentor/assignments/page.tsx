'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAssignments, useDeleteAssignment, usePublishAssignment, useCloseAssignment } from '@/lib/hooks/use-assignments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  Plus,
  FileCheck,
  Search,
  Pencil,
  Trash2,
  Send,
  Lock,
  Eye,
  CalendarDays,
  Star,
  Users,
} from 'lucide-react';
import type { AssignmentListDto } from '@/lib/api/assignments';

const STATUS_TABS = [
  { label: 'Tumu', value: '' },
  { label: 'Taslak', value: 'Draft' },
  { label: 'Yayinda', value: 'Published' },
  { label: 'Kapali', value: 'Closed' },
];

const TYPE_TABS = [
  { label: 'Tumu', value: '' },
  { label: 'Odev', value: 'Homework' },
  { label: 'Proje', value: 'Project' },
  { label: 'Pratik', value: 'Practice' },
  { label: 'Quiz', value: 'Quiz' },
  { label: 'Okuma', value: 'Reading' },
  { label: 'Arastirma', value: 'Research' },
];

const TYPE_LABELS: Record<string, string> = {
  Homework: 'Odev',
  Project: 'Proje',
  Practice: 'Pratik',
  Quiz: 'Quiz',
  Reading: 'Okuma',
  Research: 'Arastirma',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  Easy: 'Kolay',
  Medium: 'Orta',
  Hard: 'Zor',
};

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Taslak',
  Published: 'Yayinda',
  Closed: 'Kapali',
};

function statusColor(status: string) {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-700';
    case 'Published': return 'bg-green-100 text-green-700';
    case 'Closed': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function difficultyColor(level?: string) {
  switch (level) {
    case 'Easy': return 'bg-emerald-100 text-emerald-700';
    case 'Medium': return 'bg-amber-100 text-amber-700';
    case 'Hard': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MentorAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAssignments({
    status: statusFilter || undefined,
    assignmentType: typeFilter || undefined,
    search: search.trim() || undefined,
    page,
    pageSize: 12,
  });

  const deleteMutation = useDeleteAssignment();
  const publishMutation = usePublishAssignment();
  const closeMutation = useCloseAssignment();

  const items = data?.items ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('Bu odevi silmek istediginize emin misiniz?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Odev silindi');
    } catch {
      // error handled by interceptor
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
      toast.success('Odev yayinlandi');
    } catch {
      // error handled by interceptor
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closeMutation.mutateAsync(id);
      toast.success('Odev kapatildi');
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Odevler</h1>
            <p className="text-xs text-gray-500">Odevlerinizi yonetin ve takip edin</p>
          </div>
        </div>
        <Link href="/mentor/assignments/create">
          <Button size="sm" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Yeni Odev
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                statusFilter === tab.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type Filter + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setTypeFilter(tab.value); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                  typeFilter === tab.value
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                )}
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
              <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-4">
                  {/* Title + Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      href={`/mentor/assignments/${item.id}`}
                      className="font-semibold text-sm text-gray-900 hover:text-teal-700 transition-colors line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    <Badge className={cn('text-[10px] px-1.5 py-0 flex-shrink-0', statusColor(item.status))}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </Badge>
                  </div>

                  {/* Type + Difficulty */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {TYPE_LABELS[item.assignmentType] ?? item.assignmentType}
                    </Badge>
                    {item.difficultyLevel && (
                      <Badge className={cn('text-[10px] px-1.5 py-0', difficultyColor(item.difficultyLevel))}>
                        {DIFFICULTY_LABELS[item.difficultyLevel] ?? item.difficultyLevel}
                      </Badge>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
                    {item.dueDate && (
                      <span className="flex items-center gap-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(item.dueDate)}
                      </span>
                    )}
                    {item.maxScore != null && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3" />
                        {item.maxScore} puan
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Users className="w-3 h-3" />
                      {item.reviewedCount}/{item.submissionCount} degerlendirildi
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                    <Link href={`/mentor/assignments/${item.id}`}>
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                        <Eye className="w-3 h-3 mr-1" />
                        Detay
                      </Button>
                    </Link>
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
                    {item.status === 'Published' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-amber-600"
                        onClick={() => handleClose(item.id)}
                        disabled={closeMutation.isPending}
                      >
                        <Lock className="w-3 h-3 mr-1" />
                        Kapat
                      </Button>
                    )}
                    {item.status === 'Draft' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
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
            itemLabel="odev"
          />
        </>
      ) : (
        <Card className="border border-dashed border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {search || statusFilter || typeFilter ? 'Aramanizla eslesen odev bulunamadi' : 'Henuz odev yok'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {search || statusFilter || typeFilter
                ? 'Farkli filtreler deneyin'
                : 'Ilk odevinizi olusturarak baslayin'}
            </p>
            {!search && !statusFilter && !typeFilter && (
              <Link href="/mentor/assignments/create">
                <Button size="sm" className="text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Ilk Odevi Olustur
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
