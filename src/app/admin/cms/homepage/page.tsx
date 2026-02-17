'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LayoutDashboard, Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2 } from 'lucide-react';

import { adminApi, type HomepageModuleDto } from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { ConfirmActionModal } from '@/components/admin/confirm-action-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODULE_TYPES = [
  { value: 'HeroBanner', label: 'Hero Banner' },
  { value: 'FeaturedMentors', label: 'One Cikan Mentorlar' },
  { value: 'PopularCourses', label: 'Populer Kurslar' },
  { value: 'Testimonials', label: 'Referanslar' },
  { value: 'Categories', label: 'Kategoriler' },
  { value: 'Stats', label: 'Istatistikler' },
  { value: 'CTA', label: 'CTA (Aksiyon)' },
];

function moduleTypeLabel(type: string): string {
  return MODULE_TYPES.find((m) => m.value === type)?.label ?? type;
}

function moduleTypeBadgeVariant(type: string) {
  switch (type) {
    case 'HeroBanner':
      return 'destructive' as const;
    case 'FeaturedMentors':
      return 'success' as const;
    case 'PopularCourses':
      return 'default' as const;
    case 'CTA':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModuleFormData {
  moduleType: string;
  title: string;
  subtitle: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: ModuleFormData = {
  moduleType: 'HeroBanner',
  title: '',
  subtitle: '',
  content: '',
  sortOrder: 0,
  isActive: true,
};

// ---------------------------------------------------------------------------
// Form Modal
// ---------------------------------------------------------------------------

function ModuleFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  isEdit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ModuleFormData) => void;
  initialData: ModuleFormData;
  isLoading: boolean;
  isEdit: boolean;
}) {
  const [form, setForm] = useState<ModuleFormData>(initialData);

  // Sync form when initialData changes
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
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl animate-in zoom-in-95 fade-in duration-200">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isEdit ? 'Modulu Duzenle' : 'Yeni Modul Ekle'}
          </h3>

          <div className="space-y-4">
            {/* Module Type */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modul Tipi
                </label>
                <select
                  value={form.moduleType}
                  onChange={(e) => setForm({ ...form, moduleType: e.target.value })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {MODULE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baslik
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Modul basligi"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Baslik
              </label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Opsiyonel alt baslik"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icerik (JSON)
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder='{"key": "value"}'
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sira
              </label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            {/* Is Active (only for edit) */}
            {isEdit && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="module-active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="module-active" className="text-sm text-gray-700">
                  Aktif
                </label>
              </div>
            )}
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

export default function HomepageModulesPage() {
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<HomepageModuleDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Queries ---
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'modules'],
    queryFn: () => adminApi.getModules(),
  });

  const sortedModules = [...modules].sort((a, b) => a.sortOrder - b.sortOrder);

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: ModuleFormData) =>
      adminApi.createModule({
        moduleType: data.moduleType,
        title: data.title,
        subtitle: data.subtitle || undefined,
        content: data.content || undefined,
        sortOrder: data.sortOrder,
      }),
    onSuccess: () => {
      toast.success('Modul olusturuldu');
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'modules'] });
    },
    onError: () => {
      toast.error('Modul olusturulamadi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ModuleFormData }) =>
      adminApi.updateModule(id, {
        title: data.title,
        subtitle: data.subtitle || undefined,
        content: data.content || undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      }),
    onSuccess: () => {
      toast.success('Modul guncellendi');
      setEditingModule(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'modules'] });
    },
    onError: () => {
      toast.error('Modul guncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteModule(id),
    onSuccess: () => {
      toast.success('Modul silindi');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'modules'] });
    },
    onError: () => {
      toast.error('Modul silinemedi');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (mod: HomepageModuleDto) =>
      adminApi.updateModule(mod.id, {
        title: mod.title,
        subtitle: mod.subtitle || undefined,
        content: mod.content || undefined,
        sortOrder: mod.sortOrder,
        isActive: !mod.isActive,
      }),
    onSuccess: () => {
      toast.success('Modul durumu guncellendi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'modules'] });
    },
    onError: () => {
      toast.error('Durum guncellenemedi');
    },
  });

  // --- Columns ---
  const columns: Column<HomepageModuleDto>[] = [
    {
      key: 'sortOrder',
      label: 'Sira',
      className: 'text-center w-16',
      render: (item) => (
        <span className="text-sm font-medium text-gray-700">{item.sortOrder}</span>
      ),
    },
    {
      key: 'moduleType',
      label: 'Modul Tipi',
      render: (item) => (
        <Badge variant={moduleTypeBadgeVariant(item.moduleType)} className="text-[10px]">
          {moduleTypeLabel(item.moduleType)}
        </Badge>
      ),
    },
    {
      key: 'title',
      label: 'Baslik',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          {item.subtitle && (
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.subtitle}</p>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Durum',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMutation.mutate(item);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
            item.isActive
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {item.isActive ? (
            <>
              <Eye className="h-3 w-3" /> Aktif
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3" /> Pasif
            </>
          )}
        </button>
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
              setEditingModule(item);
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
            <LayoutDashboard className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Anasayfa Modulleri</h1>
          </div>
          <p className="text-sm text-gray-500">
            Anasayfada gosterilen icerik modullerini yonetin
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Modul
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={sortedModules}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        emptyMessage="Henuz modul eklenmemis."
        emptyIcon={<LayoutDashboard className="h-12 w-12" />}
      />

      {/* Create Modal */}
      <ModuleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        initialData={emptyForm}
        isLoading={createMutation.isPending}
        isEdit={false}
      />

      {/* Edit Modal */}
      <ModuleFormModal
        open={!!editingModule}
        onClose={() => setEditingModule(null)}
        onSubmit={(data) => {
          if (editingModule) {
            updateMutation.mutate({ id: editingModule.id, data });
          }
        }}
        initialData={
          editingModule
            ? {
                moduleType: editingModule.moduleType,
                title: editingModule.title,
                subtitle: editingModule.subtitle ?? '',
                content: editingModule.content ?? '',
                sortOrder: editingModule.sortOrder,
                isActive: editingModule.isActive,
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
        title="Modulu Sil"
        description="Bu modulu silmek istediginize emin misiniz? Bu islem geri alinamaz."
        confirmLabel="Sil"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
