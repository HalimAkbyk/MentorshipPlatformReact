'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

import { adminApi, type StaticPageDto } from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { ConfirmActionModal } from '@/components/admin/confirm-action-modal';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
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

interface PageFormData {
  slug: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
}

const emptyForm: PageFormData = {
  slug: '',
  title: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
  isPublished: false,
};

// ---------------------------------------------------------------------------
// Form Modal
// ---------------------------------------------------------------------------

function PageFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  isEdit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PageFormData) => void;
  initialData: PageFormData;
  isLoading: boolean;
  isEdit: boolean;
}) {
  const [form, setForm] = useState<PageFormData>(initialData);

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
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-xl shadow-xl animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isEdit ? 'Sayfayi Duzenle' : 'Yeni Sayfa Olustur'}
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sayfa Adi
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Sayfa basligi"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-+/g, '-'),
                  })
                }
                placeholder="sayfa-url-slug"
                disabled={isEdit}
              />
              {isEdit && (
                <p className="text-xs text-gray-400 mt-1">
                  Slug duzenleme modunda degistirilemez
                </p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icerik (HTML)
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Sayfa icerigi..."
                rows={10}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>

            {/* SEO Fields */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">SEO Ayarlari</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Baslik
                  </label>
                  <Input
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    placeholder="Opsiyonel meta baslik"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Aciklama
                  </label>
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    placeholder="Opsiyonel meta aciklama"
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Published */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="page-published"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="page-published" className="text-sm text-gray-700">
                Yayinla
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
              disabled={isLoading || !form.title.trim() || !form.slug.trim()}
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

export default function StaticPagesPage() {
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPageDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // For editing, we need the full page content
  const [editPageId, setEditPageId] = useState<string | null>(null);

  // --- Queries ---
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'pages'],
    queryFn: () => adminApi.getPages(),
  });

  const { data: fullPageData } = useQuery({
    queryKey: ['admin', 'cms', 'page', editPageId],
    queryFn: () => adminApi.getPage(editPageId!),
    enabled: !!editPageId,
  });

  // When fullPageData loads, open the edit modal
  if (fullPageData && editPageId && !editingPage) {
    setEditingPage(fullPageData);
    setEditPageId(null);
  }

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: PageFormData) =>
      adminApi.createPage({
        slug: data.slug,
        title: data.title,
        content: data.content,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
      }),
    onSuccess: () => {
      toast.success('Sayfa olusturuldu');
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] });
    },
    onError: () => {
      toast.error('Sayfa olusturulamadi');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PageFormData }) =>
      adminApi.updatePage(id, {
        title: data.title,
        content: data.content,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
        isPublished: data.isPublished,
      }),
    onSuccess: () => {
      toast.success('Sayfa guncellendi');
      setEditingPage(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] });
    },
    onError: () => {
      toast.error('Sayfa guncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePage(id),
    onSuccess: () => {
      toast.success('Sayfa silindi');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] });
    },
    onError: () => {
      toast.error('Sayfa silinemedi');
    },
  });

  // --- Columns ---
  const columns: Column<StaticPageDto>[] = [
    {
      key: 'title',
      label: 'Sayfa Adi',
      render: (item) => (
        <p className="text-sm font-medium text-gray-900">{item.title}</p>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (item) => (
        <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
          /{item.slug}
        </code>
      ),
    },
    {
      key: 'isPublished',
      label: 'Durum',
      render: (item) => (
        <StatusBadge status={item.isPublished ? 'Published' : 'Draft'} size="sm" />
      ),
    },
    {
      key: 'updatedAt',
      label: 'Son Guncelleme',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-xs text-gray-500">{formatDate(item.updatedAt)}</span>
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
              setEditPageId(item.id);
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
            <FileText className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Statik Sayfalar</h1>
          </div>
          <p className="text-sm text-gray-500">
            Hakkimizda, Gizlilik Politikasi gibi statik sayfalari yonetin
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Sayfa
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={pages}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        emptyMessage="Henuz statik sayfa eklenmemis."
        emptyIcon={<FileText className="h-12 w-12" />}
      />

      {/* Create Modal */}
      <PageFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        initialData={emptyForm}
        isLoading={createMutation.isPending}
        isEdit={false}
      />

      {/* Edit Modal */}
      <PageFormModal
        open={!!editingPage}
        onClose={() => setEditingPage(null)}
        onSubmit={(data) => {
          if (editingPage) {
            updateMutation.mutate({ id: editingPage.id, data });
          }
        }}
        initialData={
          editingPage
            ? {
                slug: editingPage.slug,
                title: editingPage.title,
                content: editingPage.content ?? '',
                metaTitle: editingPage.metaTitle ?? '',
                metaDescription: editingPage.metaDescription ?? '',
                isPublished: editingPage.isPublished,
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
        title="Sayfayi Sil"
        description="Bu sayfayi silmek istediginize emin misiniz? Bu islem geri alinamaz."
        confirmLabel="Sil"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
