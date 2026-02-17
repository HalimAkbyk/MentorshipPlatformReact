'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Loader2, Plus, Pencil, Trash2, ToggleRight, ToggleLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api/admin';
import type { CategoryDto } from '@/lib/api/categories';

// ---------------------------------------------------------------------------
// Category Form Dialog
// ---------------------------------------------------------------------------

function CategoryFormDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
  initial,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; icon?: string; sortOrder: number; entityType?: string }) => void;
  isLoading: boolean;
  initial?: CategoryDto;
  title: string;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [icon, setIcon] = useState(initial?.icon || '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [entityType, setEntityType] = useState(initial?.entityType || 'General');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adi *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategori adi" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ikon (emoji)</label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📚" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Siralama</label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tur</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="General">Genel (Tum alanlar)</option>
              <option value="GroupClass">Grup Dersi</option>
              <option value="Course">Video Kurs</option>
              <option value="Offering">Hizmet</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Iptal
          </Button>
          <Button
            onClick={() => onSubmit({ name, icon: icon || undefined, sortOrder, entityType })}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  message: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Iptal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Sil
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entity type badge
// ---------------------------------------------------------------------------

const entityTypeLabels: Record<string, string> = {
  General: 'Genel',
  GroupClass: 'Grup Dersi',
  Course: 'Video Kurs',
  Offering: 'Hizmet',
};

function EntityTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    General: 'bg-gray-100 text-gray-700',
    GroupClass: 'bg-blue-100 text-blue-700',
    Course: 'bg-purple-100 text-purple-700',
    Offering: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type] || colors.General}`}>
      {entityTypeLabels[type] || type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);

  const { data: categories = [], isLoading } = useQuery<CategoryDto[]>({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; icon?: string; sortOrder: number; entityType?: string }) =>
      adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori olusturuldu.');
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; icon?: string; sortOrder: number; entityType?: string } }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori guncellendi.');
      setEditOpen(false);
      setSelectedCategory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori silindi.');
      setDeleteOpen(false);
      setSelectedCategory(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? adminApi.deactivateCategory(id) : adminApi.activateCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
          </div>
          <p className="text-sm text-gray-500">
            Platform genelinde kullanilan ders ve kurs kategorilerini yonetin.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Ikon</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Ad</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Tur</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Siralama</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Durum</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Henuz kategori eklenmemis.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-xl">{cat.icon || '📁'}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{cat.name}</td>
                  <td className="py-3 px-4">
                    <EntityTypeBadge type={cat.entityType} />
                  </td>
                  <td className="py-3 px-4 text-gray-500">{cat.sortOrder}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {cat.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMutation.mutate({ id: cat.id, isActive: cat.isActive })}
                        title={cat.isActive ? 'Pasife al' : 'Aktif yap'}
                      >
                        {cat.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setEditOpen(true);
                        }}
                        title="Duzenle"
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setDeleteOpen(true);
                        }}
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CategoryFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        title="Yeni Kategori Olustur"
      />

      {selectedCategory && (
        <CategoryFormDialog
          key={selectedCategory.id}
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            setSelectedCategory(null);
          }}
          onSubmit={(data) => updateMutation.mutate({ id: selectedCategory.id, data })}
          isLoading={updateMutation.isPending}
          initial={selectedCategory}
          title="Kategori Duzenle"
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={() => {
          if (selectedCategory) deleteMutation.mutate(selectedCategory.id);
        }}
        isLoading={deleteMutation.isPending}
        title="Kategori Sil"
        message={`"${selectedCategory?.name}" kategorisini silmek istediginize emin misiniz? Bu islem geri alinamaz.`}
      />
    </div>
  );
}
