'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { adminAvatarApi, type AdminPresetAvatar } from '@/lib/api/user';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function AdminAvatarsPage() {
  const [avatars, setAvatars] = useState<AdminPresetAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingExistingUrl, setEditingExistingUrl] = useState<string | null>(null);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFilePreview, setFormFilePreview] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAvatars = async () => {
    try {
      setLoading(true);
      const data = await adminAvatarApi.getAll();
      setAvatars(data);
    } catch {
      toast.error('Avatarlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAvatars(); }, []);

  // Cleanup preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (formFilePreview) URL.revokeObjectURL(formFilePreview);
    };
  }, [formFilePreview]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingExistingUrl(null);
    setFormFile(null);
    if (formFilePreview) URL.revokeObjectURL(formFilePreview);
    setFormFilePreview(null);
    setFormLabel('');
    setFormSortOrder(avatars.length);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Geçersiz dosya tipi. JPG, PNG, GIF, WebP veya SVG yükleyin.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Dosya boyutu 2MB\'dan büyük olamaz.');
      e.target.value = '';
      return;
    }

    if (formFilePreview) URL.revokeObjectURL(formFilePreview);
    setFormFile(file);
    setFormFilePreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setFormFile(null);
    if (formFilePreview) URL.revokeObjectURL(formFilePreview);
    setFormFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!formLabel.trim()) {
      toast.error('Etiket zorunludur');
      return;
    }

    if (!editingId && !formFile) {
      toast.error('Lütfen bir avatar dosyası seçin');
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        // Update metadata (label, sortOrder)
        const existing = avatars.find(a => a.id === editingId);
        await adminAvatarApi.update(editingId, {
          label: formLabel,
          sortOrder: formSortOrder,
          isActive: existing?.isActive ?? true,
        });

        // If a new file was selected, update the image separately
        if (formFile) {
          await adminAvatarApi.updateImage(editingId, formFile);
        }

        toast.success('Avatar güncellendi');
      } else {
        // Create new avatar with file upload
        await adminAvatarApi.create(formFile!, formLabel, formSortOrder);
        toast.success('Avatar eklendi');
      }

      resetForm();
      fetchAvatars();
    } catch {
      toast.error('İşlem başarısız');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (avatar: AdminPresetAvatar) => {
    try {
      await adminAvatarApi.update(avatar.id, {
        label: avatar.label,
        sortOrder: avatar.sortOrder,
        isActive: !avatar.isActive,
      });
      toast.success(avatar.isActive ? 'Avatar deaktif edildi' : 'Avatar aktif edildi');
      fetchAvatars();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu avatarı silmek istediğinizden emin misiniz?')) return;
    try {
      await adminAvatarApi.delete(id);
      toast.success('Avatar silindi');
      fetchAvatars();
    } catch {
      toast.error('Silme başarısız');
    }
  };

  const handleEdit = (avatar: AdminPresetAvatar) => {
    setEditingId(avatar.id);
    setEditingExistingUrl(avatar.url);
    setFormFile(null);
    if (formFilePreview) URL.revokeObjectURL(formFilePreview);
    setFormFilePreview(null);
    setFormLabel(avatar.label);
    setFormSortOrder(avatar.sortOrder);
    setShowForm(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // The preview image to show in the form
  const previewSrc = formFilePreview || editingExistingUrl;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Geri</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-primary-600" />
              Önerilen Avatarlar
            </h1>
            <p className="text-sm text-gray-500">Kullanıcılara önerilecek avatarları yönet</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); setFormSortOrder(avatars.length); }}>
          <Plus className="w-4 h-4 mr-2" />Yeni Avatar
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-6 border-primary-200">
          <CardHeader>
            <CardTitle>{editingId ? 'Avatar Düzenle' : 'Yeni Avatar Ekle'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="shrink-0">
                {previewSrc ? (
                  <Avatar className="w-20 h-20 border-2 border-gray-200">
                    <AvatarImage src={previewSrc} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Avatar Dosyası {!editingId && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {formFile ? 'Dosya Değiştir' : 'Dosya Seç'}
                    </Button>
                    {formFile && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="truncate max-w-[200px]">{formFile.name}</span>
                        <span className="text-xs text-gray-400">
                          ({(formFile.size / 1024).toFixed(0)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={clearFile}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF, WebP veya SVG. Maks 2MB.
                    {editingId && !formFile && ' Yeni dosya seçmezseniz mevcut resim korunur.'}
                  </p>
                </div>

                {/* Label & Sort Order */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Etiket <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      placeholder="Felix"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sıra</label>
                    <Input
                      type="number"
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ekle'}
              </Button>
              <Button variant="outline" onClick={resetForm}>İptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avatar List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : avatars.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Henüz önerilen avatar eklenmemiş</p>
            <Button onClick={() => { setShowForm(true); setFormSortOrder(0); }}>
              <Plus className="w-4 h-4 mr-2" />İlk Avatarı Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {avatars.map((avatar) => (
            <Card key={avatar.id} className={cn(!avatar.isActive && 'opacity-60')}>
              <CardContent className="flex items-center gap-4 py-4">
                <Avatar className="w-14 h-14 border-2 border-gray-200">
                  <AvatarImage src={avatar.url} />
                  <AvatarFallback>{avatar.label.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{avatar.label}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      avatar.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {avatar.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                    <span className="text-xs text-gray-400">Sıra: {avatar.sortOrder}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{avatar.url}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(avatar)} title={avatar.isActive ? 'Deaktif Et' : 'Aktif Et'}>
                    {avatar.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(avatar)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(avatar.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
