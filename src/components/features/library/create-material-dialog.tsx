'use client';

import { useState, useRef, useCallback } from 'react';
import { useCreateLibraryItem, useUploadLibraryFile } from '@/lib/hooks/use-library';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X, Upload, FileText, Video, Link2, FileSpreadsheet, Loader2 } from 'lucide-react';

interface CreateMaterialDialogProps {
  open: boolean;
  onClose: () => void;
}

const ITEM_TYPES = [
  { value: 'Document', label: 'Dokuman' },
  { value: 'Video', label: 'Video' },
  { value: 'Link', label: 'Link' },
  { value: 'Template', label: 'Sablon' },
  { value: 'ExerciseSheet', label: 'Calisma Yapragi' },
];

const FILE_FORMATS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  Document: [
    { value: 'PDF', label: 'PDF' },
    { value: 'DOCX', label: 'DOCX' },
    { value: 'PPTX', label: 'PPTX' },
    { value: 'XLSX', label: 'XLSX' },
    { value: 'PNG', label: 'PNG' },
    { value: 'JPG', label: 'JPG' },
    { value: 'Other', label: 'Diger' },
  ],
  Video: [
    { value: 'MP4', label: 'MP4' },
    { value: 'MOV', label: 'MOV' },
    { value: 'Other', label: 'Diger' },
  ],
  Link: [
    { value: 'URL', label: 'URL' },
  ],
  Template: [
    { value: 'PDF', label: 'PDF' },
    { value: 'DOCX', label: 'DOCX' },
    { value: 'PPTX', label: 'PPTX' },
    { value: 'XLSX', label: 'XLSX' },
    { value: 'Other', label: 'Diger' },
  ],
  ExerciseSheet: [
    { value: 'PDF', label: 'PDF' },
    { value: 'DOCX', label: 'DOCX' },
    { value: 'XLSX', label: 'XLSX' },
    { value: 'Other', label: 'Diger' },
  ],
};

const CATEGORIES = ['TYT', 'AYT', 'LGS', 'Genel'];
const SUBJECTS = [
  'Matematik', 'Fizik', 'Kimya', 'Biyoloji',
  'Turkce', 'Tarih', 'Cografya', 'Ingilizce', 'Diger',
];

export function CreateMaterialDialog({ open, onClose }: CreateMaterialDialogProps) {
  const createMutation = useCreateLibraryItem();
  const uploadMutation = useUploadLibraryFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    itemType: 'Document',
    fileFormat: 'PDF',
    fileUrl: '',
    originalFileName: '',
    fileSizeBytes: 0,
    externalUrl: '',
    category: '',
    subject: '',
    tags: '',
    isTemplate: false,
  });

  const [isDragging, setIsDragging] = useState(false);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      itemType: 'Document',
      fileFormat: 'PDF',
      fileUrl: '',
      originalFileName: '',
      fileSizeBytes: 0,
      externalUrl: '',
      category: '',
      subject: '',
      tags: '',
      isTemplate: false,
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const result = await uploadMutation.mutateAsync(file);
      setForm((prev) => ({
        ...prev,
        fileUrl: result.fileUrl,
        originalFileName: result.originalFileName,
        fileSizeBytes: result.fileSizeBytes,
      }));
      toast.success('Dosya yuklendi');
    } catch {
      toast.error('Dosya yuklenemedi');
    }
  }, [uploadMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!open) return null;

  const showFileUpload = form.itemType !== 'Link';
  const showUrlInput = form.itemType === 'Link';
  const availableFormats = FILE_FORMATS_BY_TYPE[form.itemType] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Baslik zorunludur');
      return;
    }

    if (showUrlInput && !form.externalUrl.trim()) {
      toast.error('URL zorunludur');
      return;
    }

    if (showFileUpload && !form.fileUrl) {
      toast.error('Lutfen bir dosya yukleyin');
      return;
    }

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await createMutation.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        itemType: form.itemType,
        fileFormat: form.fileFormat,
        fileUrl: form.fileUrl || undefined,
        originalFileName: form.originalFileName || undefined,
        fileSizeBytes: form.fileSizeBytes || undefined,
        externalUrl: form.externalUrl.trim() || undefined,
        category: form.category || undefined,
        subject: form.subject || undefined,
        tags: tags.length > 0 ? tags : undefined,
        isTemplate: form.isTemplate,
      });

      toast.success('Materyal basariyla olusturuldu');
      resetForm();
      onClose();
    } catch {
      // error already handled by apiClient interceptor
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Yeni Materyal Ekle</CardTitle>
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

            {/* Item Type */}
            <div>
              <label className="text-sm font-medium">Materyal Turu *</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-white"
                value={form.itemType}
                onChange={(e) => {
                  const newType = e.target.value;
                  const formats = FILE_FORMATS_BY_TYPE[newType] || [];
                  setForm({
                    ...form,
                    itemType: newType,
                    fileFormat: formats[0]?.value || 'Other',
                    fileUrl: '',
                    originalFileName: '',
                    fileSizeBytes: 0,
                    externalUrl: '',
                  });
                }}
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* File Format */}
            {availableFormats.length > 1 && (
              <div>
                <label className="text-sm font-medium">Dosya Formati *</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-white"
                  value={form.fileFormat}
                  onChange={(e) => setForm({ ...form, fileFormat: e.target.value })}
                >
                  {availableFormats.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* File Upload */}
            {showFileUpload && (
              <div>
                <label className="text-sm font-medium">Dosya Yukle *</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-teal-400 bg-teal-50'
                      : form.fileUrl
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {uploadMutation.isPending ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                      <span className="text-sm text-gray-500">Yukleniyor...</span>
                    </div>
                  ) : form.fileUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-6 h-6 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">{form.originalFileName}</span>
                      <span className="text-xs text-gray-500">Degistirmek icin tiklayin</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Dosyayi surukleyin veya tiklayin
                      </span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </div>
              </div>
            )}

            {/* External URL */}
            {showUrlInput && (
              <div>
                <label className="text-sm font-medium">URL *</label>
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

            {/* Is Template */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isTemplate}
                onChange={(e) => setForm({ ...form, isTemplate: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Sablon olarak isaretle</span>
            </label>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending || uploadMutation.isPending}
              >
                {createMutation.isPending ? 'Olusturuluyor...' : 'Olustur'}
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
