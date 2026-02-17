'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Image, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

import { adminApi, type BannerDto } from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { ConfirmActionModal } from '@/components/admin/confirm-action-modal';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POSITIONS = [
  { value: 'Top', label: 'Ust' },
  { value: 'Middle', label: 'Orta' },
  { value: 'Bottom', label: 'Alt' },
];

function positionLabel(pos: string): string {
  return POSITIONS.find((p) => p.value === pos)?.label ?? pos;
}

function positionBadgeVariant(pos: string) {
  switch (pos) {
    case 'Top':
      return 'destructive' as const;
    case 'Middle':
      return 'default' as const;
    case 'Bottom':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BannerFormData {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: BannerFormData = {
  title: '',
  description: '',
  imageUrl: '',
  linkUrl: '',
  position: 'Top',
  startDate: '',
  endDate: '',
  sortOrder: 0,
  isActive: true,
};

// ---------------------------------------------------------------------------
// Form Modal
// ---------------------------------------------------------------------------

function BannerFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  isEdit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BannerFormData) => void;
  initialData: BannerFormData;
  isLoading: boolean;
  isEdit: boolean;
}) {
  const [form, setForm] = useState<BannerFormData>(initialData);

  const [prevData, setPrevData] = useState(initialData);
  if (initialData !== prevData) {
    setPrevData(initialData);
    setForm(initialData);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
      />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isEdit ? 'Banneri Duzenle' : 'Yeni Banner Ekle'}
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baslik</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Banner basligi"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aciklama</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Opsiyonel aciklama"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gorsel URL</label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
              <Input
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pozisyon</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Baslangic Tarihi
                </label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitis Tarihi
                </label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sira</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="banner-active"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="banner-active" className="text-sm text-gray-700">
                Aktif
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Iptal
            </Button>
            <Button
              size="sm"
              onClick={() => onSubmit(form)}
              disabled={isLoading || !form.title.trim()}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? 'Guncelle' : 'Olustur'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BannersPage() {
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Queries ---
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'banners'],
    queryFn: () => adminApi.getBanners(),
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: BannerFormData) =>
      adminApi.createBanner({
        title: data.title,
        description: data.description || undefined,
        imageUrl: data.imageUrl || undefined,
        linkUrl: data.linkUrl || undefined,
        position: data.position,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      toast.success('Banner olusturuldu');
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'banners'] });
    },
    onError: () => {
      toast.error('Banner olusturulamadi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BannerFormData }) =>
      adminApi.updateBanner(id, {
        title: data.title,
        description: data.description || undefined,
        imageUrl: data.imageUrl || undefined,
        linkUrl: data.linkUrl || undefined,
        position: data.position,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      toast.success('Banner guncellendi');
      setEditingBanner(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'banners'] });
    },
    onError: () => {
      toast.error('Banner guncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => {
      toast.success('Banner silindi');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'banners'] });
    },
    onError: () => {
      toast.error('Banner silinemedi');
    },
  });

  // --- Columns ---
  const columns: Column<BannerDto>[] = [
    {
      key: 'title',
      label: 'Baslik',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          {item.description && (
            <p className="text-xs text-gray-500 truncate max-w-[250px]">{item.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'position',
      label: 'Pozisyon',
      render: (item) => (
        <Badge variant={positionBadgeVariant(item.position)} className="text-[10px]">
          {positionLabel(item.position)}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Durum',
      render: (item) => (
        <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} size="sm" />
      ),
    },
    {
      key: 'startDate',
      label: 'Baslangic',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-xs text-gray-500">{formatDate(item.startDate)}</span>
      ),
    },
    {
      key: 'endDate',
      label: 'Bitis',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-xs text-gray-500">{formatDate(item.endDate)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Islemler',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingBanner(item);
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Duzenle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(item.id);
            }}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // --- Render ---
  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Image className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Banner Yonetimi</h1>
          </div>
          <p className="text-sm text-gray-500">
            Anasayfa ve diger sayfalardaki bannerlari yonetin
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Banner
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={banners}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        emptyMessage="Henuz banner eklenmemis."
        emptyIcon={<Image className="h-12 w-12" />}
      />

      {/* Create Modal */}
      <BannerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        initialData={emptyForm}
        isLoading={createMutation.isPending}
        isEdit={false}
      />

      {/* Edit Modal */}
      <BannerFormModal
        open={!!editingBanner}
        onClose={() => setEditingBanner(null)}
        onSubmit={(data) => {
          if (editingBanner) {
            updateMutation.mutate({ id: editingBanner.id, data });
          }
        }}
        initialData={
          editingBanner
            ? {
                title: editingBanner.title,
                description: editingBanner.description ?? '',
                imageUrl: editingBanner.imageUrl ?? '',
                linkUrl: editingBanner.linkUrl ?? '',
                position: editingBanner.position,
                startDate: editingBanner.startDate
                  ? editingBanner.startDate.split('T')[0]
                  : '',
                endDate: editingBanner.endDate
                  ? editingBanner.endDate.split('T')[0]
                  : '',
                sortOrder: editingBanner.sortOrder,
                isActive: editingBanner.isActive,
              }
            : emptyForm
        }
        isLoading={updateMutation.isPending}
        isEdit={true}
      />

      {/* Delete Confirmation */}
      <ConfirmActionModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
        title="Banneri Sil"
        description="Bu banneri silmek istediginize emin misiniz? Bu islem geri alinamaz."
        confirmLabel="Sil"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
