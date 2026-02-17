'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Pencil, Check, X, Loader2 } from 'lucide-react';
import { adminApi, type PlatformSettingDto } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

const feeKeys = [
  'platform_commission_rate',
  'mentor_commission_rate',
  'course_commission_rate',
];

const feeLabels: Record<string, string> = {
  platform_commission_rate: 'Platform Komisyon Orani (Booking)',
  mentor_commission_rate: 'Mentor Komisyon Kesintisi',
  course_commission_rate: 'Kurs Komisyon Orani',
};

const feeDescriptions: Record<string, string> = {
  platform_commission_rate: 'Birebir ders rezervasyonlarindan alinan platform komisyon orani. Ornegin 0.07 = %7',
  mentor_commission_rate: 'Mentor kazancindan dusulecek komisyon orani. Ornegin 0.15 = %15',
  course_commission_rate: 'Video kurs satislarindan alinan platform komisyon orani. Ornegin 0.07 = %7',
};

function FeeRow({
  setting,
  onSave,
  isSaving,
}: {
  setting: PlatformSettingDto;
  onSave: (key: string, value: string) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(setting.value);

  useEffect(() => {
    setEditValue(setting.value);
  }, [setting.value]);

  const handleSave = () => {
    const num = parseFloat(editValue);
    if (isNaN(num) || num < 0 || num > 1) {
      toast.error('Oran 0 ile 1 arasinda olmalidir (ornegin 0.07)');
      return;
    }
    onSave(setting.key, editValue);
    setEditing(false);
  };

  const percent = (parseFloat(setting.value) * 100).toFixed(1);

  return (
    <div className="flex items-center justify-between p-5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0 mr-4">
        <p className="font-semibold text-gray-800">
          {feeLabels[setting.key] || setting.key}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {feeDescriptions[setting.key] || setting.description || ''}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-28 h-9 text-sm"
              autoFocus
            />
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="h-9 px-2">
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditValue(setting.value); setEditing(false); }} disabled={isSaving} className="h-9 px-2">
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-600">%{percent}</span>
            <span className="text-xs text-gray-400 font-mono">({setting.value})</span>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="h-9 px-2">
              <Pencil className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeesPage() {
  const queryClient = useQueryClient();

  const { data: allSettings = [], isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const feeSettings = allSettings.filter((s) => feeKeys.includes(s.key));

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminApi.updateSetting(key, value),
    onSuccess: () => {
      toast.success('Komisyon orani guncellendi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: () => {
      toast.error('Guncelleme sirasinda hata olustu.');
    },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Komisyon Oranlari</h1>
        </div>
        <p className="text-sm text-gray-500">
          Platform genelindeki komisyon oranlarini buradan duzenleyebilirsiniz.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {!isLoading && (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          {feeSettings.length > 0 ? (
            feeSettings.map((s) => (
              <FeeRow
                key={s.id}
                setting={s}
                onSave={(key, value) => updateMutation.mutate({ key, value })}
                isSaving={updateMutation.isPending}
              />
            ))
          ) : (
            <div className="text-center py-16">
              <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Komisyon ayarlari bulunamadi. Once &quot;Genel Ayarlar&quot; sayfasindan varsayilan ayarlari yukleyin.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
