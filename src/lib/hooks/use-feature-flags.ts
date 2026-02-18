import { useQuery } from '@tanstack/react-query';
import { featureFlagsApi, type FeatureFlags } from '../api/feature-flags';

const FEATURE_FLAGS_QUERY_KEY = ['feature-flags'];

/**
 * Hook to get all feature flags.
 * Refreshes every 60 seconds and is globally shared via React Query.
 */
export function useFeatureFlags() {
  const { data, isLoading } = useQuery({
    queryKey: FEATURE_FLAGS_QUERY_KEY,
    queryFn: featureFlagsApi.getAll,
    staleTime: 60 * 1000,        // 60s cache
    refetchInterval: 60 * 1000,   // Auto-refresh every 60s
    refetchOnWindowFocus: true,    // Refresh on tab focus
    retry: 2,
  });

  return {
    flags: data ?? {
      registration_enabled: true,
      course_sales_enabled: true,
      group_classes_enabled: true,
      chat_enabled: true,
      video_enabled: true,
      maintenance_mode: false,
    } as FeatureFlags,
    isLoading,
  };
}

/**
 * Convenience hook for checking a single flag.
 */
export function useFeatureFlag(key: keyof FeatureFlags): boolean {
  const { flags } = useFeatureFlags();
  return flags[key] ?? true; // Default to enabled if unknown
}
