'use client';

import { useState } from 'react';
import { useCreateGroupClass } from '@/lib/hooks/use-classes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const CATEGORIES = [
  'Matematik',
  'Yazılım',
  'Müzik',
  'Dil',
  'Sanat',
  'İş/Kariyer',
  'Bilim',
  'Spor/Sağlık',
  'Diğer',
];

interface CreateClassDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateClassDialog({ open, onClose }: CreateClassDialogProps) {
  const createMutation = useCreateGroupClass();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    startTime: '',
    endTime: '',
    capacity: 10,
    pricePerSeat: 100,
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.category || !form.date || !form.startTime || !form.endTime) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    const startAt = new Date(`${form.date}T${form.startTime}:00`).toISOString();
    const endAt = new Date(`${form.date}T${form.endTime}:00`).toISOString();

    try {
      await createMutation.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        startAt,
        endAt,
        capacity: form.capacity,
        pricePerSeat: form.pricePerSeat,
      });

      toast.success('Grup dersi başarıyla oluşturuldu!');
      setForm({
        title: '',
        description: '',
        category: '',
        date: '',
        startTime: '',
        endTime: '',
        capacity: 10,
        pricePerSeat: 100,
      });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] || 'Grup dersi oluşturulamadı');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Yeni Grup Dersi Oluştur</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Başlık *</label>
              <Input
                placeholder="Örn: Matematik Soru Çözümü"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Açıklama</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm mt-1 min-h-[80px]"
                placeholder="Ders hakkında açıklama yazın..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={2000}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Kategori *</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-white"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Kategori Seçin</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Tarih *</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Başlangıç Saati *</label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bitiş Saati *</label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Kontenjan *</label>
                <Input
                  type="number"
                  min={2}
                  max={100}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 2 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kişi Başı Ücret (₺) *</label>
                <Input
                  type="number"
                  min={1}
                  step="0.01"
                  value={form.pricePerSeat}
                  onChange={(e) => setForm({ ...form, pricePerSeat: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur ve Yayınla'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
