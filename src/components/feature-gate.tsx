'use client';

import { useFeatureFlag } from '@/lib/hooks/use-feature-flags';
import type { FeatureFlags } from '@/lib/api/feature-flags';
import { AlertTriangle } from 'lucide-react';

interface FeatureGateProps {
  /** The feature flag key to check */
  flag: keyof FeatureFlags;
  /** Content to render when the flag is enabled */
  children: React.ReactNode;
  /** Custom fallback message when the flag is disabled */
  fallbackMessage?: string;
  /** If true, render nothing instead of the disabled message */
  hideWhenDisabled?: boolean;
}

/**
 * Gate component that conditionally renders children based on a feature flag.
 * When the flag is disabled, shows a message or renders nothing.
 */
export function FeatureGate({
  flag,
  children,
  fallbackMessage,
  hideWhenDisabled = false,
}: FeatureGateProps) {
  const isEnabled = useFeatureFlag(flag);

  if (isEnabled) return <>{children}</>;

  if (hideWhenDisabled) return null;

  const defaultMessages: Record<string, string> = {
    registration_enabled: 'Yeni kullanici kayitlari gecici olarak durdurulmustur.',
    course_sales_enabled: 'Kurs satislari gecici olarak durdurulmustur.',
    group_classes_enabled: 'Grup dersleri gecici olarak devre disi birakilmistir.',
    chat_enabled: 'Mesajlasma ozelligi gecici olarak devre disi birakilmistir.',
    video_enabled: 'Video gorusme ozelligi gecici olarak devre disi birakilmistir.',
    maintenance_mode: 'Sistem bakim modundadir.',
  };

  const message = fallbackMessage || defaultMessages[flag] || 'Bu ozellik gecici olarak devre disi birakilmistir.';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ozellik Devre Disi
        </h3>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
