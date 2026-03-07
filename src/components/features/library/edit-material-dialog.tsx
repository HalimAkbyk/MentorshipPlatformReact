'use client';

import { useState, useEffect } from 'react';
import { useUpdateLibraryItem } from '@/lib/hooks/use-library';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import type { LibraryItemDto } from '@/lib/api/library';

interface EditMaterialDialogProps {
  open: boolean;
  item: LibraryItemDto | null;
  onClose: () => void;
}

const CATEGORIES = ['TYT', 'AYT', 'LGS', 'Genel'];
const SUBJECTS = [
  'Matematik', 'Fizik', 'Kimya', 'Biyoloji',
  'Turkce', 'Tarih', 'Cografya', 'Ingilizce', 'Diger',
];

export function EditMaterialDialog({ open, item, onClose }: EditMaterialDialogProps) {
  const updateMutation = useUpdateLibraryItem();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    subject: '',
    tags: '',
    isTemplate: false,
    templateType: '',
    isSharedWithStudents: false,
    externalUrl: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        subject: item.subject || '',
        tags: (item.tags || []).join(', '),
        isTemplate: item.isTemplate || false,
        templateType: item.templateType || '',
        isSharedWithStudents: item.isSharedWithStudents || false,
        externalUrl: item.externalUrl || '',
      });
    }
  }, [item]);

  if (!open || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Baslik zorunludur');
      return;
    }

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          category: form.category || undefined,
          subject: form.subject || undefined,
          tags: tags.length > 0 ? tags : undefined,
          isTemplate: form.isTemplate,
          templateType: form.templateType || undefined,
          isSharedWithStudents: form.isSharedWithStudents,
          externalUrl: form.externalUrl.trim() || undefined,
        },
      });

      toast.success('Materyal guncellendi');
      onClose();
    } catch {
      // error already handled by apiClient interceptor
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Materyali Duzenle</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-sm font-medium">Baslik *</label>
              <Input
                placeholder="Materyal basligi"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Aciklama</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm mt-1 min-h-[80px]"
                placeholder="Materyal hakkinda aciklama..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={2000}
              />
            </div>

            {/* External URL (only if Link type) */}
            {item.itemType === 'Link' && (
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  placeholder="https://..."
                  value={form.externalUrl}
                  onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                />
              </div>
            )}

            {/* Category & Subject */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-white"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Secin</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Ders</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-white"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                >
                  <option value="">Secin</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium">Etiketler</label>
              <Input
                placeholder="Virgul ile ayirin: matematik, TYT, konu anlatimi"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Virgul ile ayirin</p>
            </div>

            {/* Template Type */}
            {form.isTemplate && (
              <div>
                <label className="text-sm font-medium">Sablon Turu</label>
                <Input
                  placeholder="Orn: Ders Plani, Odev Sablonu"
                  value={form.templateType}
                  onChange={(e) => setForm({ ...form, templateType: e.target.value })}
                />
              </div>
            )}

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isTemplate}
                  onChange={(e) => setForm({ ...form, isTemplate: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Sablon olarak isaretle</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isSharedWithStudents}
                  onChange={(e) => setForm({ ...form, isSharedWithStudents: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Ogrencilerle paylas</span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Iptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
