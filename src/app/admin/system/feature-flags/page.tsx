'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flag,
  Download,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { adminApi, type FeatureFlagDto } from '@/lib/api/admin';
import { ConfirmActionModal } from '@/components/admin/confirm-action-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Known flag descriptions
// ---------------------------------------------------------------------------

const flagDescriptions: Record<string, string> = {
  registration_enabled: 'Yeni kullanici kayitlari',
  course_sales_enabled: 'Kurs satislari',
  group_classes_enabled: 'Grup dersleri',
  chat_enabled: 'Mesajlasma',
  video_enabled: 'Video gorusme',
  maintenance_mode: 'Bakim modu',
};

// ---------------------------------------------------------------------------
// Feature Flag Card
// ---------------------------------------------------------------------------

function FlagCard({
  flag,
  onToggle,
  isToggling,
}: {
  flag: FeatureFlagDto;
  onToggle: (key: string, isEnabled: boolean) => void;
  isToggling: boolean;
}) {
  const isMaintenance = flag.key === 'maintenance_mode';
  const description = flagDescriptions[flag.key] || flag.description || 'Aciklama bulunamadi';

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        isMaintenance && flag.isEnabled && 'border-red-300 bg-red-50'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-bold text-gray-800">{flag.key}</p>
              {isMaintenance && flag.isEnabled && (
                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  Aktif
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
            <p className="text-xs text-gray-400 mt-1">
              Son guncelleme:{' '}
              {new Date(flag.updatedAt).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => onToggle(flag.key, !flag.isEnabled)}
            disabled={isToggling}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
              flag.isEnabled
                ? isMaintenance
                  ? 'bg-red-500'
                  : 'bg-green-500'
                : 'bg-gray-300',
              isToggling && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
                flag.isEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function FeatureFlagsPage() {
  const queryClient = useQueryClient();
  const [seedModalOpen, setSeedModalOpen] = useState(false);

  // Query
  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'system', 'feature-flags'],
    queryFn: () => adminApi.getFeatureFlags(),
  });

  // Mutation: Toggle flag
  const toggleMutation = useMutation({
    mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
      adminApi.updateFeatureFlag(key, isEnabled),
    onSuccess: () => {
      toast.success('Ozellik bayragi guncellendi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'system', 'feature-flags'] });
    },
    onError: () => {
      toast.error('Bayrak guncellenirken hata olustu.');
    },
  });

  // Mutation: Seed flags
  const seedMutation = useMutation({
    mutationFn: () => adminApi.seedFeatureFlags(),
    onSuccess: () => {
      toast.success('Varsayilan bayraklar basariyla yuklendi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'system', 'feature-flags'] });
      setSeedModalOpen(false);
    },
    onError: () => {
      toast.error('Bayraklar yuklenirken hata olustu.');
    },
  });

  const handleToggle = (key: string, isEnabled: boolean) => {
    toggleMutation.mutate({ key, isEnabled });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flag className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Ozellik Bayraklari</h1>
          </div>
          <p className="text-sm text-gray-500">
            Platform ozelliklerini acip kapatabilirsiniz.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSeedModalOpen(true)}>
          <Download className="h-4 w-4 mr-1.5" />
          Varsayilan Bayraklari Yukle
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Flag List */}
      {!isLoading && (
        <div className="space-y-4">
          {flags.map((flag) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              onToggle={handleToggle}
              isToggling={toggleMutation.isPending}
            />
          ))}

          {flags.length === 0 && (
            <div className="text-center py-20">
              <Flag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Henuz ozellik bayragi bulunamadi. Varsayilan bayraklari yukleyerek baslayabilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seed Confirmation Modal */}
      <ConfirmActionModal
        open={seedModalOpen}
        onClose={() => setSeedModalOpen(false)}
        onConfirm={() => seedMutation.mutate()}
        title="Varsayilan Bayraklari Yukle"
        description="Varsayilan ozellik bayraklarini yuklemek istediginize emin misiniz? Mevcut bayraklar korunur, yalnizca eksik bayraklar eklenir."
        confirmLabel="Yukle"
        variant="warning"
        isLoading={seedMutation.isPending}
      />
    </div>
  );
}
