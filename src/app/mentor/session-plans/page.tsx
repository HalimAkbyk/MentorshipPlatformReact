'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionPlans, useDeleteSessionPlan, useShareSessionPlan, useCompleteSessionPlan } from '@/lib/hooks/use-session-plans';
import { CreatePlanDialog } from '@/components/features/session-plans/create-plan-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';
import {
  Plus,
  ClipboardList,
  Search,
  Pencil,
  Trash2,
  Share2,
  CheckCircle2,
  FileText,
  Users,
  Calendar,
  FolderOpen,
} from 'lucide-react';
import type { SessionPlanListDto } from '@/lib/api/session-plans';

const STATUS_TABS = [
  { label: 'Tumu', value: '' },
  { label: 'Taslak', value: 'Draft' },
  { label: 'Paylasildi', value: 'Shared' },
  { label: 'Tamamlandi', value: 'Completed' },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'Draft':
      return <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600">Taslak</Badge>;
    case 'Shared':
      return <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">Paylasildi</Badge>;
    case 'Completed':
      return <Badge variant="outline" className="text-[10px] bg-green-50 text-green-600 border-green-200">Tamamlandi</Badge>;
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

export default function MentorSessionPlansPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useSessionPlans({
    status: statusFilter || undefined,
    search: search.trim() || undefined,
    page,
    pageSize: 12,
  });

  const deleteMutation = useDeleteSessionPlan();
  const shareMutation = useShareSessionPlan();
  const completeMutation = useCompleteSessionPlan();

  const items = data?.items ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('Bu plani silmek istediginize emin misiniz?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Plan silindi');
    } catch {
      // error handled by interceptor
    }
  };

  const handleShare = async (id: string) => {
    try {
      await shareMutation.mutateAsync(id);
      toast.success('Plan ogrenciyle paylasildi');
    } catch {
      // error handled by interceptor
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Bu plani tamamlandi olarak isaretlemek istiyor musunuz?')) return;
    try {
      await completeMutation.mutateAsync(id);
      toast.success('Plan tamamlandi olarak isaretlendi');
    } catch {
      // error handled by interceptor
    }
  };

  const handleCreated = (id: string) => {
    router.push(`/mentor/session-plans/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Oturum Planlari</h1>
            <p className="text-xs text-gray-500">Seanslariniz icin ders planlari olusturun ve yonetin</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Yeni Plan
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
                  ? 'bg-amber-600 text-white'
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
            {items.map((plan: SessionPlanListDto) => (
              <Card
                key={plan.id}
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => router.push(`/mentor/session-plans/${plan.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {plan.title || 'Isimsiz Plan'}
                        </span>
                        {getStatusBadge(plan.status)}
                      </div>

                      {/* Booking / Group Class info */}
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                        {plan.bookingId && (
                          <span className="flex items-center gap-0.5">
                            <FileText className="w-3 h-3" />
                            Seans
                          </span>
                        )}
                        {plan.groupClassId && (
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3" />
                            Grup Dersi
                          </span>
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                        <span className="flex items-center gap-0.5">
                          <FolderOpen className="w-3 h-3" />
                          {plan.materialCount} materyal
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(plan.createdAt)}
                        </span>
                        {plan.sharedAt && (
                          <span className="text-blue-500">
                            Paylasilma: {formatDate(plan.sharedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2"
                      onClick={() => router.push(`/mentor/session-plans/${plan.id}`)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Duzenle
                    </Button>
                    {plan.status === 'Draft' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-blue-600"
                        onClick={() => handleShare(plan.id)}
                        disabled={shareMutation.isPending}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Paylas
                      </Button>
                    )}
                    {(plan.status === 'Draft' || plan.status === 'Shared') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-green-600"
                        onClick={() => handleComplete(plan.id)}
                        disabled={completeMutation.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Tamamla
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
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
            itemLabel="plan"
          />
        </>
      ) : (
        <Card className="border border-dashed border-amber-200 bg-amber-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {search || statusFilter ? 'Aramanizla eslesen plan bulunamadi' : 'Henuz oturum planiniz yok'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {search || statusFilter
                ? 'Farkli filtreler deneyin'
                : 'Ilk oturum planinizi olusturarak baslayın'}
            </p>
            {!search && !statusFilter && (
              <Button size="sm" className="text-xs" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Ilk Plani Olustur
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <CreatePlanDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
