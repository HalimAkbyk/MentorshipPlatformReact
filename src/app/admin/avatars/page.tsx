'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { adminAvatarApi, type AdminPresetAvatar } from '@/lib/api/user';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

export default function AdminAvatarsPage() {
  const [avatars, setAvatars] = useState<AdminPresetAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formUrl, setFormUrl] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchAvatars = async () => {
    try {
      setLoading(true);
      const data = await adminAvatarApi.getAll();
      setAvatars(data);
    } catch {
      toast.error('Avatarlar yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAvatars(); }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormUrl('');
    setFormLabel('');
    setFormSortOrder(avatars.length);
  };

  const handleSubmit = async () => {
    if (!formUrl.trim() || !formLabel.trim()) {
      toast.error('URL ve etiket zorunludur');
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        const existing = avatars.find(a => a.id === editingId);
        await adminAvatarApi.update(editingId, {
          url: formUrl,
          label: formLabel,
          sortOrder: formSortOrder,
          isActive: existing?.isActive ?? true,
        });
        toast.success('Avatar guncellendi');
      } else {
        await adminAvatarApi.create({
          url: formUrl,
          label: formLabel,
          sortOrder: formSortOrder,
        });
        toast.success('Avatar eklendi');
      }
      resetForm();
      fetchAvatars();
    } catch {
      toast.error('Islem basarisiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (avatar: AdminPresetAvatar) => {
    try {
      await adminAvatarApi.update(avatar.id, {
        url: avatar.url,
        label: avatar.label,
        sortOrder: avatar.sortOrder,
        isActive: !avatar.isActive,
      });
      toast.success(avatar.isActive ? 'Avatar deaktif edildi' : 'Avatar aktif edildi');
      fetchAvatars();
    } catch {
      toast.error('Islem basarisiz');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu avatari silmek istediginizden emin misiniz?')) return;
    try {
      await adminAvatarApi.delete(id);
      toast.success('Avatar silindi');
      fetchAvatars();
    } catch {
      toast.error('Silme basarisiz');
    }
  };

  const handleEdit = (avatar: AdminPresetAvatar) => {
    setEditingId(avatar.id);
    setFormUrl(avatar.url);
    setFormLabel(avatar.label);
    setFormSortOrder(avatar.sortOrder);
    setShowForm(true);
  };

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
              Onerilen Avatarlar
            </h1>
            <p className="text-sm text-gray-500">Kullanicilara onerilecek avatarlari yonet</p>
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
            <CardTitle>{editingId ? 'Avatar Duzenle' : 'Yeni Avatar Ekle'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {formUrl && (
                <Avatar className="w-16 h-16 border-2 border-gray-200">
                  <AvatarImage src={formUrl} />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Avatar URL</label>
                  <Input
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://api.dicebear.com/9.x/avataaars/svg?seed=Felix"
                  />
                  <p className="text-xs text-gray-500 mt-1">Resim URL si girin (DiceBear, Gravatar, vs.)</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Etiket</label>
                    <Input
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      placeholder="Felix"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sira</label>
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
                {submitting ? 'Kaydediliyor...' : editingId ? 'Guncelle' : 'Ekle'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Iptal</Button>
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
            <p className="text-gray-500 mb-4">Henuz onerilen avatar eklenmemis</p>
            <Button onClick={() => { setShowForm(true); setFormSortOrder(0); }}>
              <Plus className="w-4 h-4 mr-2" />Ilk Avatari Ekle
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
                    <span className="text-xs text-gray-400">Sira: {avatar.sortOrder}</span>
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
