'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Megaphone, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

import { adminApi, type AnnouncementDto } from '@/lib/api/admin';
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

const ANNOUNCEMENT_TYPES = [
  { value: 'Info', label: 'Bilgi' },
  { value: 'Warning', label: 'Uyari' },
  { value: 'Maintenance', label: 'Bakim' },
];

const TARGET_AUDIENCES = [
  { value: 'All', label: 'Herkes' },
  { value: 'Students', label: 'Ogrenciler' },
  { value: 'Mentors', label: 'Mentorlar' },
];

function typeLabel(type: string): string {
  return ANNOUNCEMENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

function typeBadgeVariant(type: string) {
  switch (type) {
    case 'Info':
      return 'default' as const;
    case 'Warning':
      return 'secondary' as const;
    case 'Maintenance':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'Info':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Warning':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Maintenance':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return '';
  }
}

function audienceLabel(audience: string): string {
  return TARGET_AUDIENCES.find((a) => a.value === audience)?.label ?? audience;
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

interface AnnouncementFormData {
  title: string;
  content: string;
  type: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  isDismissible: boolean;
  isActive: boolean;
}

const emptyForm: AnnouncementFormData = {
  title: '',
  content: '',
  type: 'Info',
  targetAudience: 'All',
  startDate: '',
  endDate: '',
  isDismissible: true,
  isActive: true,
};

// ---------------------------------------------------------------------------
// Form Modal
// ---------------------------------------------------------------------------

function AnnouncementFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  isEdit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AnnouncementFormData) => void;
  initialData: AnnouncementFormData;
  isLoading: boolean;
  isEdit: boolean;
}) {
  const [form, setForm] = useState<AnnouncementFormData>(initialData);

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
            {isEdit ? 'Duyuruyu Duzenle' : 'Yeni Duyuru Ekle'}
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baslik</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Duyuru basligi"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icerik</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Duyuru icerigi"
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Type & Target */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {ANNOUNCEMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hedef Kitle
                </label>
                <select
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {TARGET_AUDIENCES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
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

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ann-dismissible"
                  checked={form.isDismissible}
                  onChange={(e) => setForm({ ...form, isDismissible: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="ann-dismissible" className="text-sm text-gray-700">
                  Kapatilabilir
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ann-active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="ann-active" className="text-sm text-gray-700">
                  Aktif
                </label>
              </div>
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
              disabled={isLoading || !form.title.trim() || !form.content.trim()}
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

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Queries ---
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'announcements'],
    queryFn: () => adminApi.getAnnouncements(),
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: AnnouncementFormData) =>
      adminApi.createAnnouncement({
        title: data.title,
        content: data.content,
        type: data.type,
        targetAudience: data.targetAudience,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        isDismissible: data.isDismissible,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      toast.success('Duyuru olusturuldu');
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'announcements'] });
    },
    onError: () => {
      toast.error('Duyuru olusturulamadi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AnnouncementFormData }) =>
      adminApi.updateAnnouncement(id, {
        title: data.title,
        content: data.content,
        type: data.type,
        targetAudience: data.targetAudience,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        isDismissible: data.isDismissible,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      toast.success('Duyuru guncellendi');
      setEditingAnnouncement(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'announcements'] });
    },
    onError: () => {
      toast.error('Duyuru guncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success('Duyuru silindi');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'announcements'] });
    },
    onError: () => {
      toast.error('Duyuru silinemedi');
    },
  });

  // --- Columns ---
  const columns: Column<AnnouncementDto>[] = [
    {
      key: 'title',
      label: 'Baslik',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          <p className="text-xs text-gray-500 truncate max-w-[250px]">{item.content}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tip',
      render: (item) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
            typeBadgeClass(item.type)
          )}
        >
          {typeLabel(item.type)}
        </span>
      ),
    },
    {
      key: 'targetAudience',
      label: 'Hedef Kitle',
      render: (item) => (
        <span className="text-sm text-gray-700">{audienceLabel(item.targetAudience)}</span>
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
      key: 'createdAt',
      label: 'Tarih',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
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
              setEditingAnnouncement(item);
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
            <Megaphone className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
          </div>
          <p className="text-sm text-gray-500">
            Platform genelinde gosterilen duyurulari yonetin
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Duyuru
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={announcements}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        emptyMessage="Henuz duyuru eklenmemis."
        emptyIcon={<Megaphone className="h-12 w-12" />}
      />

      {/* Create Modal */}
      <AnnouncementFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        initialData={emptyForm}
        isLoading={createMutation.isPending}
        isEdit={false}
      />

      {/* Edit Modal */}
      <AnnouncementFormModal
        open={!!editingAnnouncement}
        onClose={() => setEditingAnnouncement(null)}
        onSubmit={(data) => {
          if (editingAnnouncement) {
            updateMutation.mutate({ id: editingAnnouncement.id, data });
          }
        }}
        initialData={
          editingAnnouncement
            ? {
                title: editingAnnouncement.title,
                content: editingAnnouncement.content,
                type: editingAnnouncement.type,
                targetAudience: editingAnnouncement.targetAudience,
                startDate: editingAnnouncement.startDate
                  ? editingAnnouncement.startDate.split('T')[0]
                  : '',
                endDate: editingAnnouncement.endDate
                  ? editingAnnouncement.endDate.split('T')[0]
                  : '',
                isDismissible: editingAnnouncement.isDismissible,
                isActive: editingAnnouncement.isActive,
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
        title="Duyuruyu Sil"
        description="Bu duyuruyu silmek istediginize emin misiniz? Bu islem geri alinamaz."
        confirmLabel="Sil"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
