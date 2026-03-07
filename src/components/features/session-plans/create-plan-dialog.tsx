'use client';

import { useState } from 'react';
import { useCreateSessionPlan } from '@/lib/hooks/use-session-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function CreatePlanDialog({ open, onClose, onCreated }: CreatePlanDialogProps) {
  const createMutation = useCreateSessionPlan();

  const [form, setForm] = useState({
    title: '',
    bookingId: '',
    groupClassId: '',
    preSessionNote: '',
    sessionObjective: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      bookingId: '',
      groupClassId: '',
      preSessionNote: '',
      sessionObjective: '',
    });
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Baslik zorunludur');
      return;
    }

    try {
      const id = await createMutation.mutateAsync({
        title: form.title.trim(),
        bookingId: form.bookingId.trim() || undefined,
        groupClassId: form.groupClassId.trim() || undefined,
        preSessionNote: form.preSessionNote.trim() || undefined,
        sessionObjective: form.sessionObjective.trim() || undefined,
      });

      toast.success('Oturum plani olusturuldu');
      resetForm();
      onClose();
      onCreated?.(id);
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Yeni Oturum Plani</CardTitle>
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
                placeholder="Ornegin: Matematik - Turev Konusu"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={200}
              />
            </div>

            {/* Booking ID */}
            <div>
              <label className="text-sm font-medium">Seans ID (Opsiyonel)</label>
              <Input
                placeholder="Bir seansa baglamak icin seans ID girin"
                value={form.bookingId}
                onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Bos birakilabilir, sonra baglanabilir</p>
            </div>

            {/* Group Class ID */}
            <div>
              <label className="text-sm font-medium">Grup Ders ID (Opsiyonel)</label>
              <Input
                placeholder="Bir grup dersine baglamak icin ID girin"
                value={form.groupClassId}
                onChange={(e) => setForm({ ...form, groupClassId: e.target.value })}
              />
            </div>

            {/* Session Objective */}
            <div>
              <label className="text-sm font-medium">Seans Hedefi</label>
              <Input
                placeholder="Bu seansin hedefi nedir?"
                value={form.sessionObjective}
                onChange={(e) => setForm({ ...form, sessionObjective: e.target.value })}
                maxLength={500}
              />
            </div>

            {/* Pre Session Note */}
            <div>
              <label className="text-sm font-medium">Seans Oncesi Notu</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm mt-1 min-h-[80px]"
                placeholder="Ogrenci seanstan once neler hazirlamali?"
                value={form.preSessionNote}
                onChange={(e) => setForm({ ...form, preSessionNote: e.target.value })}
                maxLength={2000}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Olusturuluyor...
                  </>
                ) : (
                  'Olustur'
                )}
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
