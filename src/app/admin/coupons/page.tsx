'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ticket,
  Search,
  Plus,
  Loader2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
} from 'lucide-react';

import { adminApi, type CouponDto, type PagedResult } from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmActionModal } from '@/components/admin/confirm-action-modal';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ---------------------------------------------------------------------------
// Create Coupon Dialog
// ---------------------------------------------------------------------------

function CreateCouponDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscountAmount: undefined as number | undefined,
    minOrderAmount: 0,
    maxUsageCount: 100,
    maxUsagePerUser: 1,
    startDate: '',
    endDate: '',
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createCoupon({
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: form.discountValue,
        maxDiscountAmount: form.maxDiscountAmount,
        minOrderAmount: form.minOrderAmount,
        maxUsageCount: form.maxUsageCount,
        maxUsagePerUser: form.maxUsagePerUser,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Kupon basariyla olusturuldu.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      onClose();
      setForm({
        code: '',
        description: '',
        discountType: 'Percentage',
        discountValue: 10,
        maxDiscountAmount: undefined,
        minOrderAmount: 0,
        maxUsageCount: 100,
        maxUsagePerUser: 1,
        startDate: '',
        endDate: '',
      });
    },
    onError: () => toast.error('Kupon olusturulurken hata olustu.'),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Yeni Kupon Olustur</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kupon Kodu</label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="ornegin: WELCOME10"
              className="h-9"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Aciklama</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Kupon aciklamasi"
              className="h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Indirim Tipi</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="h-9 w-full border rounded-md px-3 text-sm bg-white"
              >
                <option value="Percentage">Yuzde (%)</option>
                <option value="FixedAmount">Sabit Tutar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {form.discountType === 'Percentage' ? 'Yuzde (%)' : 'Tutar (TL)'}
              </label>
              <Input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Maks Kullanim</label>
              <Input
                type="number"
                value={form.maxUsageCount}
                onChange={(e) => setForm({ ...form, maxUsageCount: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kisi Basi Maks</label>
              <Input
                type="number"
                value={form.maxUsagePerUser}
                onChange={(e) => setForm({ ...form, maxUsagePerUser: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Baslangic Tarihi</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bitis Tarihi</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="h-9"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Iptal
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!form.code || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Olustur
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'coupons', page, search],
    queryFn: () =>
      adminApi.getCoupons({
        page,
        pageSize,
        search: search || undefined,
      }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.activateCoupon(id),
    onSuccess: () => {
      toast.success('Kupon aktif edildi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: () => toast.error('Hata olustu.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminApi.deactivateCoupon(id),
    onSuccess: () => {
      toast.success('Kupon deaktif edildi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: () => toast.error('Hata olustu.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => {
      toast.success('Kupon silindi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Hata olustu.'),
  });

  const pagedData = data as PagedResult<CouponDto> | undefined;

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const columns: Column<CouponDto>[] = [
    {
      key: 'code',
      label: 'Kupon Kodu',
      render: (c) => (
        <span className="font-mono font-bold text-sm text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
          {c.code}
        </span>
      ),
    },
    {
      key: 'discountType',
      label: 'Indirim',
      render: (c) => (
        <span className="text-sm font-medium">
          {c.discountType === 'Percentage'
            ? `%${c.discountValue}`
            : `${c.discountValue} TL`}
        </span>
      ),
    },
    {
      key: 'createdByRole',
      label: 'Olusturan',
      render: (c) => (
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            c.createdByRole === 'Admin'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          )}
        >
          {c.createdByRole}
        </span>
      ),
    },
    {
      key: 'usage',
      label: 'Kullanim',
      render: (c) => (
        <span className="text-sm">
          {c.currentUsageCount} / {c.maxUsageCount}
        </span>
      ),
    },
    {
      key: 'startDate',
      label: 'Gecerlilik',
      render: (c) => (
        <span className="text-xs text-gray-500">
          {formatDate(c.startDate)} - {formatDate(c.endDate)}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Durum',
      render: (c) => (
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          )}
        >
          {c.isActive ? 'Aktif' : 'Pasif'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {c.isActive ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => deactivateMutation.mutate(c.id)}
              disabled={deactivateMutation.isPending}
            >
              <ToggleLeft className="h-3 w-3 mr-1" />
              Kapat
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => activateMutation.mutate(c.id)}
              disabled={activateMutation.isPending}
            >
              <ToggleRight className="h-3 w-3 mr-1" />
              Ac
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs text-red-600 hover:text-red-700"
            onClick={() => setDeleteTarget(c.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Kupon Yonetimi</h1>
          </div>
          <p className="text-sm text-gray-500">
            Indirim kuponlarini olusturabilir, duzenleyebilir ve yonetebilirsiniz.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Kupon
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Arama</label>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Kupon kodu..."
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
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
        getRowId={(c) => c.id}
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
        emptyMessage="Henuz kupon bulunamadi."
      />

      {/* Create Dialog */}
      <CreateCouponDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Delete Confirmation */}
      <ConfirmActionModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        title="Kuponu Sil"
        description="Bu kuponu silmek istediginize emin misiniz? Bu islem geri alinamaz."
        confirmLabel="Sil"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
