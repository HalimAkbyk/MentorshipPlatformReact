'use client';
import { useQuery } from '@tanstack/react-query';
import { videoApi } from '../api/video';

export function useVideoProvider() {
  const { data, isLoading } = useQuery({
    queryKey: ['video-provider'],
    queryFn: () => videoApi.getProvider(),
    staleTime: 60_000, // cache for 1 minute
  });

  return {
    provider: data?.provider ?? 'twilio',
    whiteboardEnabled: data?.whiteboardEnabled ?? false,
    isLoading,
  };
}
