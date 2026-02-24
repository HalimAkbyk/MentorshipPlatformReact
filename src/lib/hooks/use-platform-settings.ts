import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

type PlatformSettings = Record<string, string>;

async function fetchPlatformSettings(): Promise<PlatformSettings> {
  return apiClient.get<PlatformSettings>('/platform-settings');
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: fetchPlatformSettings,
    staleTime: 60_000, // 1 min cache
  });
}

/**
 * Helper hook: returns { devMode, earlyJoinMinutes } for session join logic.
 */
export function useSessionJoinSettings() {
  const { data: settings } = usePlatformSettings();

  const devMode = settings?.dev_mode_session_bypass === 'true';
  const earlyJoinMinutes = parseInt(settings?.session_early_join_minutes || '15', 10);

  return { devMode, earlyJoinMinutes };
}

/**
 * Utility: check if a session can be started/joined right now.
 * Returns { canJoin, minutesUntilJoinable, minutesUntilStart }
 */
export function getSessionJoinStatus(
  startAt: string,
  devMode: boolean,
  earlyJoinMinutes: number
): { canJoin: boolean; minutesUntilJoinable: number; minutesUntilStart: number } {
  const now = new Date();
  const start = new Date(startAt);
  const minutesUntilStart = (start.getTime() - now.getTime()) / (1000 * 60);

  if (devMode) {
    return { canJoin: true, minutesUntilJoinable: 0, minutesUntilStart };
  }

  const canJoin = minutesUntilStart <= earlyJoinMinutes;
  const minutesUntilJoinable = canJoin ? 0 : minutesUntilStart - earlyJoinMinutes;

  return { canJoin, minutesUntilJoinable, minutesUntilStart };
}
